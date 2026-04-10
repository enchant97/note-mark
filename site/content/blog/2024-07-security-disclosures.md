---
title: Security Disclosures - 2024-07
---

## Ability for XSS in rendered note content
A stored cross-site scripting (XSS) vulnerability in Note Mark version v0.13.0 allows attackers to execute arbitrary web scripts in the markdown content that is activated when rendered.

- affected versions: `<=0.13.0`
- patched versions: `0.13.1`
- cwe: `CWE-79`
- cve: `CVE-2024-41819`
- score: `4.6`
- credit: [@alessio-romano](https://github.com/alessio-romano) (reporter)
- more info: <https://github.com/enchant97/note-mark/security/advisories/GHSA-rm48-9mqf-8jc3>
