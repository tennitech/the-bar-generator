# Music: chromatic score study

November 11, 2026. Experimental, live under **Under Construction**. Do not move
it into a promoted category or the Home marquee until the owner approves.

## Meaning and sources

- [Apple: Piano Roll overview](https://support.apple.com/en-ng/guide/logicpro/lgcpa9111b0d/mac), checked November 11: horizontal position and length encode onset and duration; vertical position encodes pitch. The app adopts these coordinates, without claiming to be conventional staff notation, MIDI file import/export, an audio waveform or an audio analysis tool.
- [UNSW: note names, MIDI numbers and frequencies](https://phys.unsw.edu.au/jw/notes.html), checked November 11: equal-tempered semitone ratios are `2^(1/12)`, with frequency `440 * 2^((m - 69)/12)` for MIDI note number `m`. C4–C5 are MIDI 60–72. The audio model uses this formula directly, rather than rounded lookup frequencies or a fallback A4 for unknown data.

Rise & return, Arpeggio and Syncopation are original short exercise phrases,
not quoted songs or licensed recordings. Voices are synthesized; “Piano-like
synth” and “Plucked synth” describe approximations, not sampled instruments.
No new third-party assets, fonts, libraries or dependencies are introduced.

## Exact model

`js/utils/musicStyle.js` validates every input to the same domain: 13 chromatic
pitches C4–C5 plus `rest`; durations 0.25, 0.5, 1 or 2 quarter-note beats; at most
64 events and 16 beats. Unsupported pitches, non-finite or unsupported durations
are discarded. The first capacity overflow ends the phrase. Explicit empty
query state stays empty; an omitted phrase starts with Rise & return.

Time runs left to right over the complete phrase, not over an assumed four-bar
meter. Each event begins at cumulative beats / total beats and occupies its
exact duration / total beats. A leading/trailing rest therefore produces honest
empty time at the corresponding edge. Pitch occupies one of 13 equal-height
fixed lanes with C5 highest. Mark thickness is 82% of a lane, centered within
it, so the lowest/highest pitch is never clipped or merged with another pitch.

Bars, capsules, diamonds and triangles retain those exact time bounds and pitch
lanes. Their contours are drawing choices, not note-value symbols or velocity.
Capsules use the same bounded polygon approximation in every renderer. No grid,
base line, artificial side strips or per-frame normalization is painted. All
artwork remains inside the official 500 × 36 design viewport with unchanged
RPI paths, spacing, clear space and export viewports.

The phrase is monophonic. Audio schedules each note/rest for its beat duration
at 60/BPM seconds per beat; a rest schedules no oscillator. Decay and optional
reverb can naturally overlap later events. Changing the phrase stops transport;
Play restarts it. Tempo, voice, reverb and tremolo are audio-only controls. There
is no autoplay or animated playhead, including with reduced motion. SVG and
PNG are static silent scores. Empty/all-rest phrases cannot export blank bars.

## Controls and persistence

- Native labeled note/rest buttons work through `click`, including keyboard and touch, with no mouse-only event path. Minimum key size is 44 × 44 CSS pixels; the grid wraps to available width.
- Next-event duration buttons expose pressed state. Every event lists pitch and beats and can be removed with a native button. Removal moves focus to the next event (or an add-note key); Clear leaves focus on the first add-note key. Full and empty states are announced without color alone.
- Shape, phrase and sound controls use the existing parameter panel, custom-select plumbing, theme tokens, Reset/Randomize/Undo and URL state. The canonical hidden phrase participates in dirty tracking. Randomize chooses a different original phrase; Reset restores the documented default.
- Canonical notes and rests round-trip through query state and share/runtime snapshots. Historic `staff*` parameter names and shape values remain supported. Notes outside the supported octave are discarded rather than clamped to a misleading pitch.
- Static preview, header, selector thumbnail and SVG/PNG use the same geometry. Export captures clone and freeze the notes before asynchronous work. Both Bar Only and Bar + RPI retain the same pattern.

## Verification and limits

Automated tests exercise semitone separation, octave/frequency ratios, exact
onset/duration, explicit rests, capacity and malformed input, all four polygon
treatments, renderer vertex parity, both export compositions, blank recovery,
audio scheduling, native composer callbacks, focus after removal/Clear,
unchanged-chip focus preservation, query restoration, default/reset/randomize
and saved runtime state. Music is included in the existing all-family,
all-theme composition checks. Home catalog assertions explicitly exclude the
Under Construction category without weakening routable-style coverage.

`node scripts/musicReview.js` produces actual export SVGs and a labeled review
sheet in `review-images/music/`. The sheet was rasterized with native Inkscape
and visually inspected: distinct pitch lanes, full time-domain width, proper
silent gaps, unchanged official letterforms and no clipping. These are native
vector-rendering checks, not browser screenshots. Review assets contain only
project artwork and explanatory labels. The renderer is reproducible and does
not change production behavior.

The supported cloud browser could not reach the local preview server
(`ERR_CONNECTION_REFUSED`). Previously restricted local browser execution was
not retried. Real browser layout at desktop/phone widths, physical touch,
manual screen-reader behavior, audible playback/timbre and production rendering
remain to be checked through the permitted browser after publication. Source
and callback tests do not establish those results, nor formal RPI or user
acceptance. Full-suite counts and exact-head CI belong in the release PR.
