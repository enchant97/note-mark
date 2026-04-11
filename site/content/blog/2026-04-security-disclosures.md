---
title: Security Disclosures - 2026-04
---

## Stored XSS via Unrestricted Asset Upload
If a user clicked on a note asset or opened a asset link from another service the browser could open a html file and execute it. Meaning any attacker could gain access to the Note Mark API.

This attack would require the attacker to have an account on the Note Mark server and force the victim to click on a link, which could be possible if the attacker had a shared note with the victim.

Fixed by disabling browser based content sniffing and ensuring exploitable content types cannot load in the browser window by marking them as `application/octet-stream` and setting content disposition to "attachment".

- affected versions: `<=0.19.1`
- patched versions: `0.19.2`
- cwe: `CWE-79` `CWE-434`
- cve: `CVE-2026-40262`
- score: `8.7/10`
- credit: [@QiaoNPC](https://github.com/QiaoNPC) (reporter)
- more info: <https://github.com/enchant97/note-mark/security/advisories/GHSA-9pr4-rf97-79qh>

## Broken Access Control on Asset Download
Any assets that are added to a note can be accessed without any authentication needed. The attacker would need to know the note UUID and asset UUID, so unlikely exploitable.

Fixed by adding authentication check on asset route.

- affected versions: `<=0.19.1`
- patched versions: `0.19.2`
- cwe: `CWE-862`
- cve: `CVE-2026-40265`
- score: `5.9/10`
- credit: [@QiaoNPC](https://github.com/QiaoNPC) (reporter)
- more info: <https://github.com/enchant97/note-mark/security/advisories/GHSA-p5w6-75f9-cc2p>

## Username Enumeration via Login Endpoint
When using the internal login system, the api can reveal whether a username exists or not due to the password hash compare function only running when there is a valid user.

Fixed by adding a default password to check against when no user exists.

- affected versions: `<=0.19.1`
- patched versions: `0.19.2`
- cwe: `CWE-208`
- cve: `CVE-2026-40263`
- score: `3.7/10`
- credit: [@QiaoNPC](https://github.com/QiaoNPC) (reporter)
- more info: <https://github.com/enchant97/note-mark/security/advisories/GHSA-w6m9-39cv-2fwp>
