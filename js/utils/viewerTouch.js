(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.viewerTouchUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function measure(points) {
    const [first, second] = Array.from(points.values());
    if (!first) return null;
    return second ? {
      count: 2,
      center: { clientX: (first.clientX + second.clientX) / 2,
        clientY: (first.clientY + second.clientY) / 2 },
      distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)
    } : { count: 1, center: { ...first } };
  }

  function bindViewerTouch(element, callbacks, windowRef = window) {
    const points = new Map();
    let previous = null;
    let tapOrigin = null;
    let moved = false;
    let multiple = false;
    const release = id => {
      if (element.hasPointerCapture?.(id)) element.releasePointerCapture(id);
    };
    function cancel() {
      if (!points.size) return;
      const ids = Array.from(points.keys());
      points.clear();
      previous = null;
      ids.forEach(release);
      callbacks.onEnd();
    }
    function down(event) {
      if (event.pointerType !== 'touch' || points.size >= 2
        || event.target.closest('button,a,input,textarea,select,[contenteditable="true"]')) return;
      event.preventDefault();
      if (!points.size) {
        tapOrigin = { x: event.clientX, y: event.clientY };
        moved = false;
        multiple = false;
        callbacks.onStart();
      } else {
        multiple = true;
      }
      points.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      element.setPointerCapture(event.pointerId);
      // Rebase whenever a finger is added: no jump from the prior one-finger drag.
      previous = measure(points);
    }
    function move(event) {
      if (!points.has(event.pointerId)) return;
      event.preventDefault();
      points.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      const next = measure(points);
      moved ||= Math.hypot(event.clientX - tapOrigin.x, event.clientY - tapOrigin.y) > 8;
      const delta = { x: next.center.clientX - previous.center.clientX,
        y: next.center.clientY - previous.center.clientY };
      if (next.count === 2) {
        callbacks.onPinch({ anchor: previous.center, delta,
          ratio: previous.distance >= 2 && next.distance >= 2 ? next.distance / previous.distance : 1 });
      } else {
        callbacks.onPan(delta);
      }
      previous = next;
    }
    function up(event) {
      if (!points.has(event.pointerId)) return;
      event.preventDefault();
      points.delete(event.pointerId);
      release(event.pointerId);
      // A remaining finger can pan immediately, from its current position.
      previous = measure(points);
      if (!points.size) {
        callbacks.onEnd();
        if (!moved && !multiple) callbacks.onTap?.();
      }
    }
    function interrupted(event) {
      if (points.has(event.pointerId)) cancel();
    }
    const listeners = { pointerdown: down, pointermove: move, pointerup: up,
      pointercancel: interrupted, lostpointercapture: interrupted };
    Object.entries(listeners).forEach(([type, listener]) => element.addEventListener(type, listener));
    windowRef.addEventListener('resize', cancel);
    windowRef.addEventListener('orientationchange', cancel);
    const observer = windowRef.ResizeObserver ? new windowRef.ResizeObserver(cancel) : null;
    observer?.observe(element);
    return { cancel, dispose() {
      cancel();
      Object.entries(listeners).forEach(([type, listener]) => element.removeEventListener(type, listener));
      windowRef.removeEventListener('resize', cancel);
      windowRef.removeEventListener('orientationchange', cancel);
      observer?.disconnect();
    } };
  }
  return { bindViewerTouch };
});
