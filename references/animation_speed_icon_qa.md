# Speed and Randomize integration review

The original uncommitted speed candidate is preserved in
`/workspace/scratch/83f166ead34c/the-bar-generator-speed-icon` on
`codex/fix-animation-speed-randomize-icon`. Its original raw patch and file hashes
are in `generator-integration-evidence` beside the integration worktree.

The integrated revision replaces literal repeat rates in the SPEED display with
0.2–4× of each style's original default. Stored physical/display-rate values and
all formerly valid configurations remain unchanged. Keyboard arrows use 0.05×,
Page keys 0.25×, and the numeric editor accepts multipliers. LFO RATE remains Hz.
The already licensed Feather shuffle stays at a clearer 18px; refresh-cw is not
added because it resembles Reset. No license/asset change is needed.

See [combined validation](combined_generator_validation.md) and
[motion rendering](motion_rendering.md) for exact ranges, full tests and limits.
`scripts/animationSpeedSmoke.js` targets all four current SPEED families and the
combined static Home pages. It has not passed here: browser access is blocked,
and the explicitly denied browser escalation has not been retried.
