/* A passive overflow cue and fade, with no input interception. */
(function (scope) {
  function measure({ scrollHeight, clientHeight, scrollTop, scrollerTop, scrollerBottom,
    contentBottom, footerTop, sidebarTop }) {
    const boundary = Math.min(scrollerBottom, footerTop);
    const visible = clientHeight > 0 && scrollHeight - clientHeight - scrollTop > 2
      && contentBottom > boundary + 2 && boundary - scrollerTop >= 48;
    return { visible, top: Math.max(0, boundary - sidebarTop - 24),
      availableHeight: Math.max(0, boundary - scrollerTop) };
  }
  function init(documentRef = document) {
    const sidebar = documentRef.getElementById('app-sidebar');
    const scroller = documentRef.getElementById('sidebar-scroll');
    const content = scroller?.querySelector('.sidebar-content');
    const footer = sidebar?.querySelector('.sidebar-footer');
    if (!sidebar || !scroller || !content || !footer || sidebar.querySelector('[data-scroll-cue]')) return;
    const cue = documentRef.createElement('span');
    cue.className = 'sidebar_scroll-cue';
    cue.dataset.scrollCue = '';
    cue.setAttribute('aria-hidden', 'true');
    cue.hidden = true;
    cue.innerHTML = '<span>More below</span>' + scope.FeatherIcons.getIconMarkup('chevron-down', 'sidebar_scroll-cue-icon');
    sidebar.appendChild(cue);
    // The indicator is not a second control. Native keyboard scrolling stays
    // available even in browsers that do not focus scroll containers by default.
    scroller.tabIndex = 0;
    scroller.setAttribute('role', 'region');
    scroller.setAttribute('aria-label', 'Scrollable design controls');
    let frame = 0;
    function update() {
      frame = 0;
      const bounds = scroller.getBoundingClientRect();
      const state = measure({ scrollHeight: scroller.scrollHeight, clientHeight: scroller.clientHeight,
        scrollTop: scroller.scrollTop, scrollerTop: bounds.top, scrollerBottom: bounds.bottom,
        contentBottom: content.getBoundingClientRect().bottom, footerTop: footer.getBoundingClientRect().top,
        sidebarTop: sidebar.getBoundingClientRect().top });
      cue.hidden = !state.visible;
      if (state.visible) {
        cue.style.top = `${state.top}px`;
        cue.style.setProperty('--sidebar-scroll-fade-space', `${state.availableHeight}px`);
      }
    }
    const schedule = () => { if (!frame) frame = scope.requestAnimationFrame(update); };
    scroller.addEventListener('scroll', schedule, { passive: true });
    scope.addEventListener('resize', schedule, { passive: true });
    const observer = typeof scope.ResizeObserver === 'function' ? new scope.ResizeObserver(schedule) : null;
    [scroller, content, footer].forEach(element => observer?.observe(element));
    // Fallback for browsers without ResizeObserver, and changes whose layout is
    // applied later by another listener. No mutation observer or per-frame loop.
    sidebar.addEventListener('change', schedule);
    sidebar.addEventListener('toggle', schedule, true);
    documentRef.fonts?.ready.then(schedule);
    schedule();
  }
  const api = { measure, init };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.SidebarScrollCue = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
