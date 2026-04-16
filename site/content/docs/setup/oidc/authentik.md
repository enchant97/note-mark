---
title: "Authentik"
---
OIDC setup example for the Authentik provider.

> Make sure you have the relevant [configurations set in Note Mark]({{< ref configuration >}}).

Client Type:

```
public
```

Issuer URL (shown in UI as "OpenID Configuration Issuer"):

```
https://{provider-domain:port}/application/o/{note-mark}/
```

Redirect/Callback URL:

```
https://{note-mark-domain:port}/oidc-callback
```

Optional:

- Turn on "Include claims in id_token", this removes extra requests to provider
