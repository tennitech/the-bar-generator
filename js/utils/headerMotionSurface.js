(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HeaderMotionSurface = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function getSurfaceLayout(geometry, width, height, pixelRatio = 1) {
    const scale = Math.min(width / geometry.width, height / geometry.height);
    const cssWidth = geometry.width * scale;
    const cssHeight = geometry.barHeight * scale;
    return {
      left: (width - cssWidth) / 2,
      top: (height - geometry.height * scale) / 2 + geometry.barY * scale,
      width: cssWidth, height: cssHeight,
      pixelWidth: Math.max(1, Math.round(cssWidth * pixelRatio)),
      pixelHeight: Math.max(1, Math.round(cssHeight * pixelRatio))
    };
  }

  function create(container, geometry, documentRef = document) {
    const stage = documentRef.createElement('span');
    stage.className = 'header_motion-stage';
    stage.setAttribute('aria-hidden', 'true');
    const letters = documentRef.createElementNS('http://www.w3.org/2000/svg', 'svg');
    letters.classList.add('header_motion-letters');
    letters.setAttribute('viewBox', `0 0 ${geometry.width} ${geometry.height}`);
    letters.setAttribute('focusable', 'false');
    for (const d of geometry.paths) {
      const path = documentRef.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'currentColor');
      letters.appendChild(path);
    }
    const canvas = documentRef.createElement('canvas');
    canvas.className = 'header_motion-canvas';
    const buffer = documentRef.createElement('canvas');
    const context = buffer.getContext('2d');
    const output = canvas.getContext('2d');
    stage.append(letters, canvas);
    container.replaceChildren(stage);
    let lastSize = '';
    return {
      stage, letters, canvas, context,
      resize(width, height, pixelRatio) {
        const layout = getSurfaceLayout(geometry, width, height, pixelRatio);
        const key = [width, height, pixelRatio].join(':');
        if (key === lastSize) return;
        lastSize = key;
        Object.assign(canvas.style, { left: `${layout.left}px`, top: `${layout.top}px`,
          width: `${layout.width}px`, height: `${layout.height}px` });
        canvas.width = layout.pixelWidth;
        canvas.height = layout.pixelHeight;
        // Resolve coverage before presenting the tiny bar. The vector letters are
        // outside this surface and are never cleared, resized or repainted by JS.
        buffer.width = canvas.width * 4;
        buffer.height = canvas.height * 4;
      },
      begin() {
        context.setTransform(buffer.width / geometry.width, 0, 0, buffer.height / geometry.barHeight, 0, 0);
        context.clearRect(0, 0, geometry.width, geometry.barHeight);
        return context;
      },
      commit() {
        output.clearRect(0, 0, canvas.width, canvas.height);
        output.imageSmoothingEnabled = true;
        output.imageSmoothingQuality = 'high';
        output.drawImage(buffer, 0, 0, canvas.width, canvas.height);
      }
    };
  }
  return { create, getSurfaceLayout };
}));
