// Geometry transcribed from the complete supplied RPI Logo.svg at uniform 1/2 scale.
// Separate wordmark assets have different origins/proportions; do not mix them.
const RPI_LOGO_GEOMETRY = Object.freeze({
  width: 250,
  letterHeight: 111.4885,
  barY: 132.4885,
  barHeight: 18,
  totalHeight: 150.4885,
  cornerSize: 1.56182,
  exportPadding: 20,
  barPath: "M248.438 132.4885L250 134.05V148.9265L248.438 150.488H1.56182L0 148.9265V134.05L1.56182 132.4885H248.4435H248.438Z",
  paths: Object.freeze({
  "r": "M212.8265 30.42675C212.821 30.30115 212.8155 30.17555 212.81 30.0554C212.313 19.6742 208.447 12.0617 201.965 7.1032C201.812 6.98855 201.659 6.87385 201.506 6.7701C195.3735 2.275785 186.9965 0.0805055 176.981 0.0805055H117.277L115.7155 1.642325V109.921L117.277 111.483H131.945L133.507 109.921V66.234L135.0635 64.672H176.981C186.1445 64.672 194.2925 62.575 200.507 58.288C200.796 58.0915 201.0745 57.895 201.353 57.6875C207.2455 53.308 211.2375 46.84765 212.466 38.21945C212.51 37.9136 212.548 37.60235 212.5865 37.2856C212.6245 36.97435 212.657 36.6576 212.6845 36.3409C212.7065 36.117 212.728 35.8931 212.739 35.6692C212.8265 34.59885 212.865 33.5012 212.865 32.37625C212.865 31.7155 212.854 31.06565 212.8265 30.42675ZM135.0635 48.4477L133.507 46.8859V17.86665L135.069 16.30485H175.889C189.88 16.30485 195.0785 20.66265 195.0785 32.37625C195.0785 44.0899 189.88 48.4477 175.889 48.4477H135.0635Z",
  "p": "M249.2145 109.921L247.6525 111.483H232.9845L231.423 109.921V1.642325L232.99 0.0805055H247.658L249.22 1.642325V109.921H249.2145Z",
  "i": "M85.889 111.483L82.924 109.839L54.871 66.201L51.824 64.6775H19.34795L17.78615 66.2395V109.9265L16.2298 111.4885H1.56182L0 109.9265V1.642325L1.56182 0.0805055H60.1735C84.3655 0.0805055 97.1495 11.24805 97.1495 32.37625C97.1495 48.4477 89.2855 58.916 74.383 62.7335V64.279L95.5875 97.5905V109.828L93.933 111.483H85.889ZM60.1735 48.4477C74.1645 48.4477 79.3635 44.0899 79.3635 32.37625C79.3635 20.66265 74.1645 16.30485 60.1735 16.30485H19.35345L17.78615 17.86665V46.8859L19.34795 48.4477H60.1735Z"
})
});

function clipBarSVG(markup, x, y, width, height) {
  const id = `bar-bounds-${[x, y, width, height].map(value => String(value).replace(/[^0-9a-z]/gi, '_')).join('-')}`;
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath></defs><g clip-path="url(#${id})">${markup}</g>`;
}

function getBarEdgeTransform(left, right, start, width) {
  if (![left, right, start, width].every(Number.isFinite) || right <= left || width <= 0) {
    return { offset: 0, scale: 1 };
  }
  const scale = width / (right - left);
  return { offset: start - left * scale, scale };
}

// getBBox() alone omits centered strokes and can falsely report an inset.
// Measure each painted primitive in the group's coordinates, excluding clip/defs.
function getSVGPaintedHorizontalBounds(group) {
  const inverse = group.getScreenCTM().inverse();
  let left = Infinity, right = -Infinity;
  for (const element of group.querySelectorAll('path,rect,circle,ellipse,line,polygon,polyline')) {
    if (element.closest('defs,clipPath,mask,pattern,marker')) continue;
    const style = getComputedStyle(element);
    const hasStroke = style.stroke !== 'none' && Number(style.strokeOpacity) !== 0;
    const hasFill = style.fill !== 'none' && Number(style.fillOpacity) !== 0;
    if ((!hasStroke && !hasFill) || Number(style.opacity) === 0) continue;
    const bounds = element.getBBox();
    const stroke = hasStroke ? (parseFloat(style.strokeWidth) || 0) / 2 : 0;
    if (bounds.width === 0 && bounds.height === 0 && !stroke) continue;
    const matrix = inverse.multiply(element.getScreenCTM());
    for (const x of [bounds.x - stroke, bounds.x + bounds.width + stroke]) {
      for (const y of [bounds.y - stroke, bounds.y + bounds.height + stroke]) {
        const mappedX = matrix.a * x + matrix.c * y + matrix.e;
        left = Math.min(left, mappedX); right = Math.max(right, mappedX);
      }
    }
  }
  return { left, right };
}

// Fit actual primitive geometry, rather than its empty SVG container, to both edges.
// Geometry outside the design rectangle is clipped before considering its extents.
const horizontalBarFits = new Map();
function fitBarSVGToEdges(markup, x, y, width, height) {
  if (!markup || typeof document === 'undefined') return markup;
  const key = `${x}:${y}:${width}:${height}:${markup}`;
  if (horizontalBarFits.has(key)) return horizontalBarFits.get(key);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const group = document.createElementNS(svg.namespaceURI, 'g');
  svg.style.cssText = 'position:fixed;left:-10000px;top:-10000px;visibility:hidden;pointer-events:none';
  svg.setAttribute('aria-hidden', 'true');
  group.innerHTML = markup;
  svg.appendChild(group);
  document.body.appendChild(svg);
  let fitted = markup;
  try {
    const bounds = getSVGPaintedHorizontalBounds(group);
    const left = Math.max(x, bounds.left);
    const right = Math.min(x + width, bounds.right);
    if (right > left && (Math.abs(left - x) > 1e-7 || Math.abs(right - x - width) > 1e-7)) {
      const fit = getBarEdgeTransform(left, right, x, width);
      fitted = `<g data-bar-edge-fit="true" transform="translate(${fit.offset} 0) scale(${fit.scale} 1)">${markup}</g>`;
    }
  } finally { svg.remove(); }
  horizontalBarFits.set(key, fitted);
  if (horizontalBarFits.size > 8) horizontalBarFits.delete(horizontalBarFits.keys().next().value);
  return fitted;
}

if (typeof window !== 'undefined') {
  window.RPI_LOGO_GEOMETRY = RPI_LOGO_GEOMETRY;
  window.clipBarSVG = clipBarSVG;
  window.fitBarSVGToEdges = fitBarSVGToEdges;
  window.getBarEdgeTransform = getBarEdgeTransform;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { RPI_LOGO_GEOMETRY, clipBarSVG, fitBarSVGToEdges, getBarEdgeTransform };
