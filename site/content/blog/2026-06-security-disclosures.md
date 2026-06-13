---
title: Security Disclosures - 2026-06
---

## Path traversal via unsanitized book/note slug in migrate export (sibling of GHSA-g49p)
If an attacker uploads a note with a slug that contains a directory traversal it is possible to write to other locations during an export.

The resulting note will only get placed when an export is performed by an admin. It also requires that an attacker has access to a account. Compared to the sibling vulnerability this will export with the file extension `.md`.

Fixed by ensuring slugs cannot have path separators, also restricted the username field. Also any exported notes that have path separators will log a warning on export and will be skipped.

- affected versions: `>= 0.6.0`
- patched versions: `0.19.5`
- cwe: `CWE-20` `CWE-22`
- cve: `CVE-2026-50553`
- score: `High`
- credit:
    - [@tonghuaroot](https://github.com/tonghuaroot) (reporter)
    - [@Yunkaiwjs](https://github.com/Yunkaiwjs) (reporter)
- more info: <https://github.com/enchant97/note-mark/security/advisories/GHSA-rqrh-8wpv-x7hh>

## Unauthenticated disclosure of soft-deleted note metadata on public books in note-mark
When a book is marked as public any soft-deleted note metadata can still be retrieved with no authentication. The data that can be retrieved is: id, title, slug and timestamps.

Fixed by adjusting queries.

- affected versions: `>= 0.6.0`
- patched versions: `0.19.5`
- cwe: `CWE-200` `CWE-285`
- cve: `CVE-2026-50554`
- score: `5.3/10`
- credit:
    - [@Yunkaiwjs](https://github.com/Yunkaiwjs) (reporter)
- more info: <https://github.com/enchant97/note-mark/security/advisories/GHSA-588f-fvcv-xhvf>
