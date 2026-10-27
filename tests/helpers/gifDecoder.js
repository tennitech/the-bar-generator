// Independent test decoder: parses GIF blocks, LZW indices, palettes and disposal.
// Frame iteration reuses one compositing canvas to keep large-output QA bounded.
function parseGif(bytes) {
  const data = Buffer.from(bytes);
  if (!/^GIF8[79]a$/.test(data.toString('ascii', 0, 6))) throw new Error('Invalid GIF header');
  const width = data.readUInt16LE(6), height = data.readUInt16LE(8), backgroundIndex = data[11];
  let offset = 13, palette = null, control = { disposal: 0, transparent: false, transparentIndex: 0, delayMs: 0 };
  const colorTable = size => { const result = data.subarray(offset, offset + size * 3); offset += size * 3; return result; };
  if (data[10] & 128) palette = colorTable(2 ** ((data[10] & 7) + 1));
  const readBlocks = () => { const blocks = []; for (let size = data[offset++]; size; size = data[offset++]) {
    blocks.push(data.subarray(offset, offset + size)); offset += size;
  } return Buffer.concat(blocks); };
  const frames = [];
  while (offset < data.length) {
    const tag = data[offset++];
    if (tag === 0x3b) break;
    if (tag === 0x21) {
      const label = data[offset++];
      if (label === 0xf9) {
        const size = data[offset++], flags = data[offset];
        control = { disposal: (flags >> 2) & 7, transparent: !!(flags & 1),
          delayMs: data.readUInt16LE(offset + 1) * 10, transparentIndex: data[offset + 3] };
        offset += size + 1;
      } else readBlocks();
    } else if (tag === 0x2c) {
      const left = data.readUInt16LE(offset), top = data.readUInt16LE(offset + 2);
      const frameWidth = data.readUInt16LE(offset + 4), frameHeight = data.readUInt16LE(offset + 6), flags = data[offset + 8];
      offset += 9;
      const framePalette = flags & 128 ? colorTable(2 ** ((flags & 7) + 1)) : palette;
      const minimumCodeSize = data[offset++];
      frames.push({ ...control, left, top, width: frameWidth, height: frameHeight,
        interlaced: !!(flags & 64), palette: framePalette, minimumCodeSize, compressed: readBlocks() });
      control = { disposal: 0, transparent: false, transparentIndex: 0, delayMs: 0 };
    } else throw new Error(`Unexpected GIF block ${tag}`);
  }
  return { width, height, backgroundIndex, palette, frames };
}

function decodeIndices(compressed, minimumCodeSize, pixelCount) {
  const clear = 1 << minimumCodeSize, end = clear + 1;
  const dictionary = new Array(4096), output = new Uint8Array(pixelCount);
  let bits = 0, codeSize = minimumCodeSize + 1, next = end + 1, previous = null, written = 0;
  const reset = () => { for (let i = 0; i < clear; i++) dictionary[i] = Uint8Array.of(i);
    codeSize = minimumCodeSize + 1; next = end + 1; previous = null; };
  reset();
  while (bits + codeSize <= compressed.length * 8) {
    let code = 0;
    for (let bit = 0; bit < codeSize; bit++, bits++) code |= ((compressed[bits >> 3] >> (bits & 7)) & 1) << bit;
    if (code === clear) { reset(); continue; }
    if (code === end) break;
    let entry;
    if (code < next) entry = dictionary[code];
    else if (code === next && previous) { entry = new Uint8Array(previous.length + 1); entry.set(previous); entry[previous.length] = previous[0]; }
    if (!entry) throw new Error(`Invalid GIF LZW code ${code}`);
    if (written + entry.length > pixelCount) throw new Error('GIF pixel overflow');
    output.set(entry, written); written += entry.length;
    if (previous && next < 4096) {
      const added = new Uint8Array(previous.length + 1); added.set(previous); added[previous.length] = entry[0];
      dictionary[next++] = added;
      if (next === (1 << codeSize) && codeSize < 12) codeSize++;
    }
    previous = entry;
  }
  if (written !== pixelCount) throw new Error(`GIF pixel underflow ${written}/${pixelCount}`);
  return output;
}

function* decodeFrames(gif) {
  const canvas = new Uint8Array(gif.width * gif.height * 4);
  let previous = null, restore = null;
  for (const frame of gif.frames) {
    if (previous && previous.disposal === 2) {
      for (let y = previous.top; y < previous.top + previous.height; y++) for (let x = previous.left; x < previous.left + previous.width; x++) {
        const i = (y * gif.width + x) * 4;
        if (previous.transparent && previous.transparentIndex === gif.backgroundIndex) canvas.fill(0, i, i + 4);
        else { canvas.set(gif.palette.subarray(gif.backgroundIndex * 3, gif.backgroundIndex * 3 + 3), i); canvas[i + 3] = 255; }
      }
    } else if (previous && previous.disposal === 3 && restore) canvas.set(restore);
    restore = frame.disposal === 3 ? canvas.slice() : null;
    const indices = decodeIndices(frame.compressed, frame.minimumCodeSize, frame.width * frame.height);
    const rows = frame.interlaced ? [0, 4, 2, 1].flatMap((start, pass) =>
      Array.from({ length: Math.ceil(Math.max(0, frame.height - start) / [8, 8, 4, 2][pass]) }, (_, i) => start + i * [8, 8, 4, 2][pass]))
      : Array.from({ length: frame.height }, (_, i) => i);
    rows.forEach((row, sourceRow) => {
      for (let x = 0; x < frame.width; x++) {
        const index = indices[sourceRow * frame.width + x];
        if (frame.transparent && index === frame.transparentIndex) continue;
        const i = ((frame.top + row) * gif.width + frame.left + x) * 4;
        canvas.set(frame.palette.subarray(index * 3, index * 3 + 3), i); canvas[i + 3] = 255;
      }
    });
    previous = frame;
    yield { rgba: canvas, frame, indices };
  }
}
module.exports = { parseGif, decodeFrames, decodeIndices };
