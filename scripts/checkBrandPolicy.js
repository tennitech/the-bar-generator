// Repository tooling follows the existing CommonJS CLI/Jest convention.
// This checks evidence integrity and review coverage, not visual/brand approval.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hasText = value => typeof value === 'string' && value.trim().length > 0;

function localPath(root, relative) {
  if (!hasText(relative) || path.isAbsolute(relative)) throw new Error(`Invalid repository path: ${relative}`);
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(path.resolve(root) + path.sep)) throw new Error(`Path escapes repository: ${relative}`);
  return resolved;
}

function validateSources(root, registry) {
  const errors = [];
  const manifestPath = localPath(root, registry.sourceManifest);
  const manifest = readJSON(manifestPath);
  const directory = path.dirname(manifestPath);
  const records = manifest.records || [];
  const ids = new Set();
  const urls = new Set();
  const counts = {};
  for (const record of records) {
    if (ids.has(record.id) || urls.has(record.url)) errors.push(`Duplicate source: ${record.id}`);
    ids.add(record.id);
    urls.add(record.url);
    counts[record.kind] = (counts[record.kind] || 0) + 1;
    if (new URL(record.url).origin !== manifest.origin) errors.push(`Unexpected source origin: ${record.id}`);
    if (!record.capturedAt?.startsWith(manifest.capturedOn)) errors.push(`Capture date mismatch: ${record.id}`);
    for (const [field, digest] of [['markdown', 'markdownSha256'], ['json', 'jsonSha256']]) {
      const file = localPath(directory, record[field]);
      if (sha256(fs.readFileSync(file)) !== record[digest]) errors.push(`Source hash mismatch: ${record[field]}`);
    }
    const data = readJSON(localPath(directory, record.json));
    if (!hasText(data.text) || data.url !== record.url || data.label !== record.label) {
      errors.push(`Source content/provenance mismatch: ${record.id}`);
    }
    if (record.kind === 'guideline') {
      if (!data.reachedBottom || !data.frames?.some(frame => {
        const s = frame.scroll;
        return s && s.v > 0 && s.h >= s.v && s.y + s.v >= s.h - 2;
      })) errors.push(`Incomplete scroll coverage: ${record.id}`);
    } else if (!data.catalogTextExcluded) errors.push(`Unscoped asset catalog: ${record.id}`);
  }
  for (const [kind, count] of Object.entries(manifest.counts || {})) {
    if (counts[kind] !== count) errors.push(`Source count mismatch: ${kind}`);
  }
  for (const page of manifest.navigation || []) {
    if (!urls.has(page.url) && !manifest.exclusions?.some(item => item.url === page.url)) {
      errors.push(`Unvisited/unexplained navigation page: ${page.url}`);
    }
  }
  const areaIds = new Set();
  for (const area of registry.areas || []) {
    if (areaIds.has(area.id)) errors.push(`Duplicate review area: ${area.id}`);
    areaIds.add(area.id);
    if (!area.sources?.length || !area.requirements?.length) errors.push(`Empty review area: ${area.id}`);
    for (const id of area.sources || []) {
      if (!records.some(record => record.id === id && record.kind === 'guideline')) {
        errors.push(`Unknown guideline source ${id} in ${area.id}`);
      }
    }
    for (const pattern of area.patterns || []) new RegExp(pattern);
  }
  if (!areaIds.has('foundations')) errors.push('Missing foundations review area');
  for (const file of [registry.policyDocument, registry.conflictRegister]) {
    if (!fs.existsSync(localPath(root, file))) errors.push(`Missing policy document: ${file}`);
  }
  return { errors, manifest };
}

function requiredAreas(files, registry) {
  return registry.areas.filter(area => area.always || files.some(file =>
    (area.patterns || []).some(pattern => new RegExp(pattern).test(file))
  )).map(area => area.id);
}

function changeFingerprint(files, readFile) {
  return sha256([...new Set(files)].sort().map(file => {
    const value = readFile(file);
    return `${file}\0${value === null ? 'deleted' : sha256(value)}\n`;
  }).join(''));
}

function validateReview(review, registry, context) {
  const errors = [];
  if (!hasText(review.reviewer) || !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedOn || '')) {
    errors.push('Review needs reviewer and reviewedOn date');
  }
  if (review.sourceSnapshot !== context.manifest.capturedOn) errors.push('Review refers to a different source snapshot');
  if (review.changeFingerprint !== context.fingerprint) errors.push('Brand review is stale: recompute the fingerprint and review the changed state');
  const required = requiredAreas(context.files, registry);
  for (const area of registry.areas) {
    const decision = review.areas?.[area.id];
    if (!decision || !['reviewed', 'not-applicable'].includes(decision.status) || !hasText(decision.rationale)) {
      errors.push(`Missing decision/rationale: ${area.id}`);
      continue;
    }
    if (required.includes(area.id) && decision.status !== 'reviewed') errors.push(`Required brand area not reviewed: ${area.id}`);
    if (decision.status === 'reviewed') {
      for (const source of area.sources) {
        if (!decision.sources?.includes(source)) errors.push(`Missing source ${source} in ${area.id} review`);
      }
    }
    for (const source of decision.sources || []) {
      if (!context.manifest.records.some(record => record.kind === 'guideline' && record.id === source)) errors.push(`Unknown reviewed source: ${source}`);
    }
  }
  if (!Array.isArray(review.blockingConflicts) || review.blockingConflicts.length) errors.push('Resolve blocking brand conflicts before completion');
  if (typeof review.requiresFormalApproval !== 'boolean' || !hasText(review.approvalRationale)) errors.push('Review needs an explicit approval applicability decision');
  if (review.requiresFormalApproval && (review.approvalStatus !== 'granted' || !hasText(review.approvalEvidence))) {
    errors.push('Required formal approval has not been evidenced');
  }
  if (!Array.isArray(review.checks) || !review.checks.length) errors.push('Review needs check evidence');
  for (const check of review.checks || []) {
    if (!hasText(check.name) || !hasText(check.evidence) || !['passed', 'not-applicable', 'pending'].includes(check.result)) {
      errors.push(`Missing/failed check evidence: ${check.name || 'unnamed'}`);
    }
  }
  for (const name of ['brand-policy', 'unit-tests']) {
    if (!review.checks?.some(check => check.name === name && check.result === 'passed')) errors.push(`Required check not recorded as passed: ${name}`);
  }
  if (required.includes('interface') && !review.checks?.some(check => check.name === 'rendered-ui' && check.result === 'passed')) {
    errors.push('Interface changes need rendered-ui check evidence');
  }
  if (required.includes('bar-and-exports') && !review.checks?.some(check => check.name === 'preview-export-parity' && ['passed', 'not-applicable'].includes(check.result))) {
    errors.push('Bar/export impact needs parity evidence or an explicit unchanged-output rationale');
  }
  return errors;
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function run(root, args = process.argv.slice(2)) {
  const registry = readJSON(path.join(root, 'references/brand_rules.json'));
  const { errors, manifest } = validateSources(root, registry);
  if (errors.length) throw new Error(errors.join('\n'));
  const baseAt = args.indexOf('--base');
  if (args.some((arg, index) => !['--base', '--print-fingerprint'].includes(arg) && !(baseAt >= 0 && index === baseAt + 1))) throw new Error('Unknown brand-check argument');
  if (baseAt >= 0 && (!args[baseAt + 1] || args[baseAt + 1].startsWith('-'))) throw new Error('--base requires a Git revision');
  const base = baseAt >= 0 ? args[baseAt + 1] : process.env.GITHUB_EVENT_NAME === 'pull_request' ? 'HEAD^1' : 'origin/main';
  // In GitHub's PR merge checkout, fetch-depth: 2 provides its main parent.
  // The CI invocation supplies no contributor-controlled environment override.
  git(root, ['rev-parse', '--verify', `${base}^{commit}`]);
  const changedFiles = [...new Set([
    ...git(root, ['diff', '--name-only', '-z', base, '--']).split('\0'),
    ...git(root, ['ls-files', '--others', '--exclude-standard', '-z']).split('\0')
  ].filter(Boolean))].sort();
  const files = changedFiles.filter(file => file !== registry.reviewFile);
  const fingerprint = changeFingerprint(files, file => {
    const target = localPath(root, file);
    if (!fs.existsSync(target)) return null;
    // Git's clean filters normalize checkout line endings just as they do on
    // commit. This makes a Windows working review agree with the Linux CI tree.
    return fs.lstatSync(target).isSymbolicLink() ? fs.readlinkSync(target) : git(root, ['hash-object', `--path=${file}`, '--', file]);
  });
  if (args.includes('--print-fingerprint')) {
    console.log(fingerprint);
    return;
  }
  if (files.length || changedFiles.includes(registry.reviewFile)) {
    const reviewPath = localPath(root, registry.reviewFile);
    if (!fs.existsSync(reviewPath)) throw new Error(`Missing ${registry.reviewFile}; read references/brand_policy.md`);
    errors.push(...validateReview(readJSON(reviewPath), registry, { files, fingerprint, manifest }));
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Brand policy: ${manifest.records.length} source records verified; ${files.length ? `${files.length} changed files reviewed` : 'no changed files to review'}. Human and institutional approval remain separate.`);
}

if (require.main === module) {
  try { run(path.resolve(__dirname, '..')); }
  catch (error) { console.error(`Brand policy check failed:\n${error.message}`); process.exitCode = 1; }
}

module.exports = { changeFingerprint, requiredAreas, validateReview, validateSources, run };
