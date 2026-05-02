---
title: Security Disclosures - 2026-05
---

## Arbitrary File Write via Path Traversal in Asset Names Leading to Remote Code Execution
If an attacker uploads an asset with a asset name that contains a directory traversal it is possible to write to other locations, if running as root could also allow writing to `/bin/bash` with a malicious payload.

The resulting asset will only get placed when an export is performed by an admin. It also requires that an attacker has access to a account.

Fixed by ensuring export features sanitise asset names and prevent any new asset names from having path separators.

- affected versions: `>= 0.13.0`
- patched versions: `0.19.4`
- cwe: `CWE-20` `CWE-22`
- cve: ``
- score: `8.6/10`
- credit: [@rvizx](https://github.com/rvizx) (reporter)
- more info: <https://github.com/enchant97/note-mark/security/advisories/GHSA-g49p-4qxj-88v3>

## JWT Secret Weakness allows Full Account Takeover via token forgery
If an admin sets a `JWT_SECRET` that is less than 32 bytes long an attacker can brute-force a token to any account if a username/user-id is known.

This will not effect admins who have set a longer `JWT_SECRET`.

Fixed by preventing startup when the secret is too short.

- affected versions: `>= 0.6.0`
- patched versions: `0.19.4`
- cwe: `CWE-326` `CWE-345`
- cve: ``
- score: `10/10`
- credit: [@osageling](https://github.com/osageling) (reporter)
- more info: <https://github.com/enchant97/note-mark/security/advisories/GHSA-q6mh-rqwh-g786>
