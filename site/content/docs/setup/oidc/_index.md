---
title: "OIDC Providers"
---

Single-Sign-On is handled via OpenID Connect and OAuth2. To use SSO you must have a compatible provider that supports the following features:

- OpenID Connect (OIDC) Discovery - RFC5785
- Authorization Code Flow with PKCE + state
    - May show in provider UI's as a "public client type"
- Claims
    - sub: the users id
    - name: the users full name
    - preferred_username: the users username, not the email
- Scopes
    - openid
    - profile
- ID Token: MUST be signed JWT, JWE NOT supported

> *TIP*: OIDC will only work if Note Mark is running with https

Depending on your SSO provider the issuer URL may be different, see below for examples:

If your provider is not listed, please see requirements listed above. No further support will be given, as every provider & setup cannot be tested.

> Please do reach out if you have a working setup for another provider and would like it listed.

## Providers
- [Authentik]({{< ref authentik >}}), tested on: `2025.6.1`
- [Authelia]({{< ref authelia >}})
