const fs = require('node:fs');
const html = fs.readFileSync(require.resolve('../generator/index.html'), 'utf8');
const css = fs.readFileSync(require.resolve('../css/style.css'), 'utf8');

// Contract: information dialogs share their shell. Content type, not a one-off
// override, determines the layout inside it.
test('every native dialog has the same visible title and text Close control', () => {
  const dialogs = [...html.matchAll(/<dialog\b[^>]*>([\s\S]*?)<\/dialog>/g)];
  expect(dialogs).toHaveLength(3);
  for (const [, body] of dialogs) {
    const header = body.match(/<div class="report_dialog-header">([\s\S]*?)<\/div>/)[1];
    expect(header).toMatch(/<h2[^>]+class="report_dialog-title"/);
    expect(header).toMatch(/<button[^>]+class="report_dialog-secondary"[^>]*>Close<\/button>/);
    expect(header).not.toMatch(/report_dialog-kicker|<svg|×/);
  }
});

test('both information guides use heading-first focus and inherit the same shell', () => {
  for (const id of ['secondary-color-title', 'keyboard-shortcuts-title']) {
    expect(html).toMatch(new RegExp(`<h2 id="${id}"[^>]*tabindex="-1"[^>]*autofocus`));
  }
  expect(css).not.toMatch(/\.(?:color_guidance-dialog|shortcuts_dialog)(?:::backdrop)?\s*\{/);
});

test('native modal and anchored menu shells share theme surface, border and corner tokens', () => {
  for (const selector of ['report_dialog', 'sidebar_more-panel']) {
    const rule = css.match(new RegExp(`\\.${selector} \\{([^}]+)`))[1];
    expect(rule).toContain('var(--menu-surface)');
    expect(rule).toContain('var(--menu-border)');
    expect(rule).toContain('var(--control-radius)');
  }
  expect(css).toMatch(/\.report_dialog::backdrop\s*\{[^}]*backdrop-filter: none/s);
});
