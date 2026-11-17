const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { changeFingerprint, requiredAreas, validateReview, validateSources, run } = require('../scripts/checkBrandPolicy');

const registry = { areas: [
  { id: 'foundations', always: true, sources: ['home'], requirements: ['Use evidence.'] },
  { id: 'interface', patterns: ['^js/'], sources: ['color'], requirements: ['Check contrast.'] },
  { id: 'bar-and-exports', patterns: ['^js/'], sources: ['the-bar'], requirements: ['Check parity.'] }
] };
const context = { files: ['js/main.js'], fingerprint: 'current', manifest: {
  capturedOn: '2026-11-17', records: ['home', 'color', 'the-bar'].map(id => ({ id, kind: 'guideline' }))
} };
function completeReview() {
  return {
    reviewer: 'Test reviewer', reviewedOn: '2026-11-17', sourceSnapshot: '2026-11-17', changeFingerprint: 'current',
    areas: Object.fromEntries(registry.areas.map(area => [area.id, { status: 'reviewed', rationale: 'Reviewed the affected behavior against the source.', sources: area.sources }])),
    blockingConflicts: [], requiresFormalApproval: false, approvalRationale: 'No institutional asset or approval-dependent treatment changed.',
    checks: ['brand-policy', 'unit-tests', 'rendered-ui', 'preview-export-parity'].map(name => ({ name, result: 'passed', evidence: 'Recorded check output for the reviewed state.' }))
  };
}

describe('brand review enforcement', () => {
  test('fingerprint is order-independent but changes for bytes, names, additions and deletions', () => {
    const read = name => ({ a: 'first', b: 'second' })[name] ?? null;
    const baseline = changeFingerprint(['a', 'b'], read);
    expect(changeFingerprint(['b', 'a'], read)).toBe(baseline);
    expect(changeFingerprint(['a', 'b'], () => 'edited')).not.toBe(baseline);
    expect(changeFingerprint(['a', 'renamed'], read)).not.toBe(baseline);
    expect(changeFingerprint(['a'], read)).not.toBe(baseline);
    expect(changeFingerprint(['a', 'b', 'new'], read)).not.toBe(baseline);
    expect(changeFingerprint(['a', 'b'], () => null)).not.toBe(baseline);
  });
  test('shared JS cannot omit interface or bar/export review', () => {
    expect(requiredAreas(['js/main.js'], registry)).toEqual(['foundations', 'interface', 'bar-and-exports']);
    expect(requiredAreas(['notes.md'], registry)).toEqual(['foundations']);
  });
  test('accepts a covered current state without claiming formal approval', () => {
    expect(validateReview(completeReview(), registry, context)).toEqual([]);
  });
  test('rejects stale file-state reviews', () => {
    const review = completeReview(); review.changeFingerprint = 'older';
    expect(validateReview(review, registry, context).join(' ')).toMatch(/stale/);
  });
  test('a not-applicable declaration cannot bypass path-required areas', () => {
    const review = completeReview(); review.areas.interface.status = 'not-applicable';
    expect(validateReview(review, registry, context).join(' ')).toMatch(/Required brand area not reviewed: interface/);
  });
  test('rejects missing and invented source references', () => {
    const review = completeReview(); review.areas.interface.sources = ['invented'];
    const errors = validateReview(review, registry, context).join(' ');
    expect(errors).toMatch(/Missing source color/); expect(errors).toMatch(/Unknown reviewed source/);
  });
  test('blocks an unresolved conflict and required permission without evidence', () => {
    const review = completeReview(); review.blockingConflicts = ['B01']; review.requiresFormalApproval = true; review.approvalStatus = 'pending';
    const errors = validateReview(review, registry, context).join(' ');
    expect(errors).toMatch(/blocking brand conflicts/); expect(errors).toMatch(/formal approval/);
  });
  test('pending rendered work cannot be recorded as completed interface validation', () => {
    const review = completeReview(); review.checks.find(check => check.name === 'rendered-ui').result = 'pending';
    expect(validateReview(review, registry, context).join(' ')).toMatch(/rendered-ui/);
  });
  test('preserves honest pending acceptance but rejects failed checks', () => {
    const review = completeReview(); review.checks.push({ name: 'physical-device acceptance', result: 'pending', evidence: 'Not performed; no device claim.' });
    expect(validateReview(review, registry, context)).toEqual([]);
    review.checks[0].result = 'failed';
    expect(validateReview(review, registry, context).join(' ')).toMatch(/failed check|Required check/);
  });
});

describe('brand source evidence integrity', () => {
  let root;
  let sourceRegistry;
  let manifest;
  const digest = value => crypto.createHash('sha256').update(value).digest('hex');
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-policy-test-'));
    const text = '# Home\n\nSource text.';
    const data = JSON.stringify({ label: 'Home', url: 'https://brand.rpi.edu/document/4#/-/home', text: 'Source text.', reachedBottom: true, frames: [{ scroll: { y: 20, v: 100, h: 120 } }] });
    fs.writeFileSync(path.join(root, 'home.md'), text); fs.writeFileSync(path.join(root, 'home.json'), data);
    fs.writeFileSync(path.join(root, 'policy.md'), 'Policy'); fs.writeFileSync(path.join(root, 'conflicts.md'), 'Conflicts');
    manifest = { origin: 'https://brand.rpi.edu', capturedOn: '2026-11-17', counts: { guideline: 1 }, exclusions: [], navigation: [{ url: 'https://brand.rpi.edu/document/4#/-/home' }], records: [{ id: 'home', label: 'Home', url: 'https://brand.rpi.edu/document/4#/-/home', capturedAt: '2026-11-17T12:00:00Z', kind: 'guideline', markdown: 'home.md', json: 'home.json', markdownSha256: digest(text), jsonSha256: digest(data) }] };
    sourceRegistry = { sourceManifest: 'manifest.json', policyDocument: 'policy.md', conflictRegister: 'conflicts.md', areas: [registry.areas[0]] };
    fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  test('detects source edits without an intentional manifest refresh', () => {
    expect(validateSources(root, sourceRegistry).errors).toEqual([]);
    fs.appendFileSync(path.join(root, 'home.md'), ' Unrecorded edit.');
    expect(validateSources(root, sourceRegistry).errors.join(' ')).toMatch(/hash mismatch/);
  });
  test('requires an explanation for every discovered navigation page', () => {
    manifest.navigation.push({ url: 'https://brand.rpi.edu/document/4#/-/new-page' });
    fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));
    expect(validateSources(root, sourceRegistry).errors.join(' ')).toMatch(/Unvisited\/unexplained/);
  });
  test('rejects source paths escaping the dated archive', () => {
    manifest.records[0].markdown = '../outside.md';
    fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));
    expect(() => validateSources(root, sourceRegistry)).toThrow(/escapes repository/);
  });
  test('validates review-only edits and blocks deleting the review record', () => {
    fs.mkdirSync(path.join(root, 'references'));
    sourceRegistry.reviewFile = 'references/brand_review.json';
    fs.writeFileSync(path.join(root, 'references/brand_rules.json'), JSON.stringify(sourceRegistry));
    const reviewFile = path.join(root, sourceRegistry.reviewFile);
    fs.writeFileSync(reviewFile, JSON.stringify(completeReview()));
    const git = (...args) => execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' });
    git('init', '--quiet');
    git('config', 'user.name', 'Brand policy fixture');
    git('config', 'user.email', 'brand-policy-fixture@example.invalid');
    git('add', '--all');
    git('commit', '--quiet', '-m', 'Fixture baseline');
    fs.writeFileSync(reviewFile, '{}');
    expect(() => run(root, ['--base', 'HEAD'])).toThrow(/Review needs|stale/);
    fs.unlinkSync(reviewFile);
    expect(() => run(root, ['--base', 'HEAD'])).toThrow(/Missing references\/brand_review.json/);
  });
});
