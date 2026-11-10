/* Disclosure changes presentation only: controls stay mounted and keep their values. */
(function (scope) {
  function help(button, tooltip, documentRef) {
    let pinned = false;
    const show = visible => {
      tooltip.hidden = !visible;
      button.setAttribute('aria-expanded', String(visible));
    };
    const close = () => { pinned = false; show(false); };
    button.addEventListener('focus', () => show(true));
    button.addEventListener('blur', close);
    button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') show(true); });
    const boundary = button.closest?.('.waveform_lfo') || button;
    boundary.addEventListener('pointerleave', () => { if (!pinned && documentRef.activeElement !== button) show(false); });
    button.addEventListener('click', () => { pinned = !pinned; show(pinned); });
    documentRef.addEventListener('pointerdown', event => {
      if (!button.contains(event.target) && !tooltip.contains(event.target)) close();
    });
    documentRef.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  }
  function disclosure(header, documentRef) {
    if (header.querySelector('[data-section-toggle]')) return;
    const label = header.querySelector('.control-header-label');
    const title = (label || header).textContent.trim();
    const button = documentRef.createElement('button');
    button.type = 'button';
    button.className = 'sidebar_section-toggle';
    button.dataset.sectionToggle = '';
    button.textContent = title;
    const icon = documentRef.createElement('span');
    icon.className = 'sidebar_section-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false"><polyline points="9 6 15 12 9 18"/></svg>';
    button.appendChild(icon);
    button.setAttribute('aria-label', `${title.charAt(0)}${title.slice(1).toLowerCase()} section`);
    const body = documentRef.createElement('div');
    body.className = 'sidebar_section-body';
    const group = header.closest('.control-group');
    const index = Array.from(group.querySelectorAll('.control-header')).indexOf(header);
    body.id = `${group.id}-section-${index}`;
    button.setAttribute('aria-controls', body.id);
    button.setAttribute('aria-expanded', 'true');
    // Keep action buttons outside the disclosure button; no nested controls.
    if (label) label.replaceWith(button);
    else header.replaceChildren(button);
    let next = header.nextSibling;
    while (next && !(next.nodeType === 1 && next.matches('.runtime_section, .control-header'))) {
      const node = next;
      next = next.nextSibling;
      body.appendChild(node);
    }
    header.after(body);
    button.addEventListener('click', () => {
      // Some pointer-driven browsers do not focus buttons automatically.
      if (!body.hidden && body.contains(documentRef.activeElement)) button.focus({ preventScroll: true });
      body.hidden = !body.hidden;
      button.setAttribute('aria-expanded', String(!body.hidden));
      // Re-measure overflow even without ResizeObserver.
      button.dispatchEvent(new scope.Event('change', { bubbles: true }));
    });
  }
  function prepare(root) {
    const documentRef = root.ownerDocument || root;
    root.querySelectorAll('.control-group .control-header').forEach(header => disclosure(header, documentRef));
    root.querySelectorAll('[data-control-help]').forEach(button => {
      if (button.dataset.helpReady) return;
      const tooltip = documentRef.getElementById(button.dataset.controlHelp);
      if (!tooltip) return;
      button.dataset.helpReady = 'true';
      help(button, tooltip, documentRef);
    });
  }
  const api = { prepare, disclosure, help };
  scope.SidebarSections = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
