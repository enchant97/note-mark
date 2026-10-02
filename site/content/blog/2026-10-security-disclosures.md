---
title: Security Disclosures - 2026-10
---

## Users with write access can rename notes into locations where they only have read access
Users with write access to a note can rename/move into an area where they only read access.

This only affects users who have shared a note with write access.

Added a access-control check for the destination path as well as source path.

- affected versions: `>= 1.0.0, <= 1.1.0`
- patched versions: `>=1.1.0`
- cwe: `CWE-862`
- cve: `6.5/10`
- score: `Moderate`
- credit:
    - [@brx-zyy](https://github.com/brx-zyy) (reporter)
- more info: <https://github.com/enchant97/note-mark/security/advisories/GHSA-6p2v-mc83-63wr>
