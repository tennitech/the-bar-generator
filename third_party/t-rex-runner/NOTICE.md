This directory vendors code and sprite assets from:
https://github.com/wayou/t-rex-runner
commit: 5455bfa408ec6b707c7300ff194b7390733a766d

Upstream license: BSD 3-Clause License

Local modifications:
- removed the automatic DOMContentLoaded boot path
- scoped arcade/invert classes to the local host container
- added programmatic jump/score helpers for embedding in the RPI logo generator
- disabled global event binding for the embedded easter-egg integration
- disabled audio for this embed
