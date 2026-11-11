// Native SVG review sheet from the same frozen export code; not a UI screenshot.
const fs = require('node:fs');
const path = require('node:path');
const music = require('../js/utils/musicStyle');
const { createRuntime } = require('../tests/helpers/exportCompositionRuntime');
const runtime = createRuntime(); runtime.select('music'); runtime.state.title='Music score study';
const output=path.resolve(__dirname,'../review-images/music'); fs.mkdirSync(output,{recursive:true});
let sheet='<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="1000" viewBox="0 0 1160 1000"><rect width="1160" height="1000" fill="#fff"/><g fill="#111" font-family="sans-serif"><text x="40" y="40" font-size="22">Music · native export geometry review</text><text x="40" y="65" font-size="14">Pitch = height · duration = length · silent rests = gaps · static artwork</text></g>';
for (const [i,shape] of ['square','circle','diamond','triangle'].entries()) {
 runtime.state.composition='logo'; runtime.state.values.staffNoteShape=shape; runtime.state.values.staffNotes=music.normalizeNotes(music.presets.rise);
 const svg=runtime.captureLogoExportSnapshot().svgSource;
 fs.writeFileSync(path.join(output,`${shape}.svg`),svg);
 const x=40+(i%2)*560,y=100+Math.floor(i/2)*330;
 sheet+=`<text x="${x}" y="${y}" font-family="sans-serif" font-size="16" fill="#111">${shape}</text><g transform="translate(${x},${y+12})">${svg.replace(/id="([^"]+)"/g, (_, id) => `id="review-${i}-${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#review-${i}-${id})`).replace(/<\?xml[^>]*>\s*/, '').replace(/width="[^"]*"/,'width="450"').replace(/height="[^"]*"/,'height="296"')}</g>`;
}
for (const [i,phrase] of ['arpeggio','syncopation'].entries()) {
 runtime.state.composition='bar'; runtime.state.values.staffNotes=music.normalizeNotes(music.presets[phrase]); runtime.state.values.staffNoteShape='square';
 const svg=runtime.captureLogoExportSnapshot().svgSource;
 fs.writeFileSync(path.join(output,`${phrase}.svg`),svg);
 sheet+=`<text x="40" y="${790+i*90}" font-family="sans-serif" font-size="16" fill="#111">${phrase}</text><g transform="translate(210,${750+i*90})">${svg.replace(/id="([^"]+)"/g, (_, id) => `id="review-${i}-${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#review-${i}-${id})`).replace(/<\?xml[^>]*>\s*/, '').replace(/width="[^"]*"/,'width="870"').replace(/height="[^"]*"/,'height="174"')}</g>`;
}
sheet+='</svg>';fs.writeFileSync(path.join(output,'geometry-review.svg'),sheet);
