(function (scope) {
  function createWriter({ write, currentURL, now, schedule, unschedule, onError = () => {}, interval = 200 }) {
    let pending = null, timer = null, lastWrite = -Infinity;
    function cancel() {
      if (timer !== null) unschedule(timer);
      timer = null; pending = null;
    }
    function flush() {
      if (timer !== null) unschedule(timer);
      timer = null;
      const url = pending; pending = null;
      if (!url || url === currentURL()) return;
      lastWrite = now();
      try { write(url); } catch (error) { onError(error); }
    }
    function replace(url) {
      pending = new URL(url, currentURL()).href;
      if (pending === currentURL()) { cancel(); return; }
      const wait = Math.max(0, lastWrite + interval - now());
      if (!wait) flush();
      else if (timer === null) timer = schedule(flush, wait);
    }
    return { replace, flush, cancel, pendingURL: () => pending };
  }
  const api = { createWriter };
  if (scope.history && scope.location) {
    Object.assign(api, createWriter({
      write: url => scope.history.replaceState(scope.history.state, '', url),
      currentURL: () => scope.location.href,
      now: () => performance.now(), schedule: scope.setTimeout.bind(scope), unschedule: scope.clearTimeout.bind(scope),
      onError: error => scope.dispatchEvent(new CustomEvent('urlstateerror', { detail: error.message }))
    }));
    scope.addEventListener('popstate', api.cancel);
    scope.addEventListener('hashchange', api.cancel);
    let hiddenPending = null;
    scope.addEventListener('pagehide', () => {
      hiddenPending = api.pendingURL();
      if (hiddenPending) {
        try { scope.sessionStorage.setItem('rpi-pending-url', JSON.stringify({ from: scope.location.href, to: hiddenPending })); } catch (_) { /* Storage can be unavailable. */ }
      } else {
        try { scope.sessionStorage.removeItem('rpi-pending-url'); } catch (_) { /* Storage can be unavailable. */ }
      }
      api.cancel();
    });
    scope.addEventListener('pageshow', event => {
      if (event.persisted) {
        try { scope.sessionStorage.removeItem('rpi-pending-url'); } catch (_) { /* Storage can be unavailable. */ }
        if (hiddenPending) { api.replace(hiddenPending); hiddenPending = null; }
      }
    });
  }
  scope.URLState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
