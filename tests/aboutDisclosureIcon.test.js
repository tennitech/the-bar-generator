const fs = require('node:fs');
const path = require('node:path');
const { descriptions, sync } = require('../js/utils/barInformation');
const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
const css = fs.readFileSync(require.resolve('../css/style.css'), 'utf8');
const sectionSource = fs.readFileSync(require.resolve('../js/utils/sidebarSections'), 'utf8');
const about = html.match(/<summary id="bar-information-toggle"[\s\S]*?<\/summary>/)[0];

test('About reuses the exact thin section SVG, sizing box and decorative semantics', () => {
  const sectionSVG = sectionSource.match(/icon.innerHTML = '(<svg.*?<\/svg>)';/)[1];
  expect(about.match(/<svg[\s\S]*?<\/svg>/)[0]).toBe(sectionSVG);
  expect(about).toContain('<span class="sidebar_section-icon" aria-hidden="true">');
  expect(about).toContain('focusable="false"');
  expect(about).toContain('stroke-width="1.5"');
  expect(about).toContain('points="9 6 15 12 9 18"');
  expect(css).toMatch(/\.bar_information-toggle\s*\{[^}]*align-items: center;[^}]*justify-content: flex-start;[^}]*gap: 0.5rem/s);
  expect(css).toMatch(/\.sidebar_section-icon\s*\{[^}]*flex: 0 0 1rem;[^}]*width: 1rem;[^}]*height: 1rem;[^}]*transform: rotate\(90deg\)/s);
  expect(css).toMatch(/\.sidebar_section-toggle\[aria-expanded="false"\] \.sidebar_section-icon,\s*\.bar_information:not\(\[open\]\) > \.bar_information-toggle \.sidebar_section-icon\s*\{ transform: rotate\(0deg\)/);
  expect(css).not.toMatch(/\.bar_information\[open\][^{]*\{[^}]*180deg/);
});

test('About keeps native collapsed details/summary, focus target and reduced-motion-safe orientation', () => {
  const details = html.match(/<details id="bar-information"[^>]*>/)[0];
  expect(details).not.toMatch(/\bopen(?:\s|=|>)/);
  expect(about).not.toMatch(/role="button"|aria-expanded=|tabindex="-1"/);
  expect(html).toContain('id="bar-information-content" class="bar_information-content" tabindex="0" role="region" aria-labelledby="bar-information-toggle"');
  expect(css).toContain('.bar_information-toggle:focus-visible,');
  expect(css.match(/\.sidebar_section-icon\s*\{([^}]+)\}/)[1]).not.toMatch(/animation|transition/);
});

test.each(Object.keys(descriptions))('%s retains its About content and native state in both icon orientations', style => {
  for (const open of [false, true]) {
    const nodes = { '#style-select': { value: style }, '#bar-information': { open },
      '#bar-information-title': {}, '#bar-information-description': {},
      '#artemis-information': { hidden: true, open: false } };
    sync({ querySelector: selector => nodes[selector] });
    expect(nodes['#bar-information'].open).toBe(open);
    expect(nodes['#bar-information-title'].textContent).toBe(descriptions[style].title);
    expect(nodes['#bar-information-description'].textContent).toBe(descriptions[style].text);
  }
});

const routeRoot = path.resolve(__dirname, '../generator');
const routes = fs.readdirSync(routeRoot, { withFileTypes: true }).filter(entry => entry.isDirectory())
  .map(entry => path.join(routeRoot, entry.name, 'index.html')).filter(file => fs.existsSync(file));
test.each(routes)('%s uses the shared corrected footer rather than per-route About markup', file => {
  const stub = fs.readFileSync(file, 'utf8');
  expect(stub).toMatch(/__RPI_GENERATOR_PAGE_SOURCE__ = 'generator\/index\.html\?v=/);
  expect(stub).toMatch(/js\/generatorBootstrap\.js\?v=/);
  expect(stub).not.toContain('id="bar-information-toggle"');
});
