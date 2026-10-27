# Bar backlog coordination — October 27, 2026

## Required painted extent

The owner requires every bar artwork to reach both exact nominal horizontal edges. Merely fitting inside the bar rectangle is insufficient. For a caller rectangle x, y, width, height, the painted minimum X must equal x and painted maximum X must equal x + width, within a documented numerical tolerance used only for floating-point verification. All painted artwork, including stroke extents, must remain inside the nominal rectangle with no overflow. The official 500 × 36 px design area scales uniformly; do not change its dimensions to force edge contact. Do not introduce visible side padding. Preserve the official bar dimensions, placement, letterforms, and letter-to-bar gap.

Apply this invariant to every style and variant, including animation phases, tiny triangle changes, Circle Gradient, Quantum, and Artemis artwork. Verify painted geometry including strokes, caps, joins, clipping, and artwork transforms in the main preview, header, SVG, and PNG; include GIF where supported. A clip rectangle alone proves containment, not edge contact. Add focused assertions and inspect rendered exports.

Use the complete official logo vector as a consistent source. See bar_science_notes.md and the dated checklist in rpi_brand_guidelines.md. Current implementation values are not independent evidence of official spacing.

## Owner review state

Earlier Triangle variant 2 overlap designs were rejected and superseded. The owner then requested exact complementary variants, direction/count controls, and the final Down right default/order, and authorized publication after verification. PR #30 merged as f01ee45570aa116d6b4865729dc96bd65d666546 after exact-head CI, 50-state Chromium export verification, targeted WebKit checks, and aggregate smoke. This is publication authorization, not a claim of manual testing or institutional brand approval. Retain the local and remote feature branches and worktree for later manual review.

## Worker boundaries and integration

BAR-01 owns canonical geometry, clipping, and export plumbing. BAR-02 owns pattern composition helpers. BAR-05 owns client-side configuration sharing. Later Quantum and Artemis workers must inherit the required painted-extent invariant before beginning work. BAR-00 coordinates the local registry; workers report changes rather than rewriting it concurrently.

Keep feature changes isolated on their own branches/worktrees. Reconcile function-level changes to main.js, drawing.js, barPattern.js, generator shell wiring, cache keys, and documentation through a single integration owner. Update project_status.md and scientific/source notes with the final behavior and evidence. Integrate these owner requirements into main through the repository's normal reviewed workflow; no merge or push is authorized by this coordination record alone.

## Preview delivery

Canonical local URLs use http://127.0.0.1 and assigned ports: baseline 4310, geometry 4311, patterns 4312, Quantum 4313, Artemis 4314, sharing 4315, motion UI 4316, mobile polish 4317. Local runtime registry and evidence live in /tmp/bar-generator-coordination; those files are operational and are not a durable substitute for this repository record.

The BAR-02 development server exhausted its default connection backlog under parallel cold bootstrap requests. Raising its local backlog from 5 to 128 changed the same 24-load Chromium probe from 22 canvas failures and 128 failed requests to zero failures. This was a development-server change, not product code. A successful HTTP response or one browser load does not exclude intermittent connection failures.

Parent-targeted open_in_codex requests have returned queued. Parent visibility remains unverified; the worker has no supported parent-tab inventory or close operation. Do not claim that a queued preview is visible or accepted.

## Verified publication follow-up

PR #30 is deployed. Local main contains the remote merge and preserves the earlier unpublished documentation commit bf230849c62d11cc114d9a6fa1f7a93d92c7bb63. The scoped BAR-02 header/SVG/PNG gap is repaired for its four families; the broader BAR-01 official-complete-vector integration remains separate. Under the owner’s latest resource policy, local test servers are temporary and must close with the leased test slice; retaining a branch does not imply leaving a preview server running.
