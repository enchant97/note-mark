---
title: "Authelia"
---
OIDC setup example for the Authelia provider.

Thanks [@tim42](https://github.com/enchant97/note-mark/issues/248#issuecomment-3449010016) for contributing this configuration.

> Make sure you have the relevant [configurations set in Note Mark]({{< ref configuration >}}).

```yaml
identity_providers:
  oidc:
    cors: # Note Mark will be served on a different domain
      endpoints: [token, userinfo]
      allowed_origins_from_client_redirect_uris: true
    clients:
      - client_id: note-mark # must match OIDC__CLIENT_ID
        client_name: Note Mark
        redirect_uris: # replace with the url of your Note Mark instance
          - 'https://{note-mark-domain:port}/oidc-callback'
        public: true
        authorization_policy: 'two_factor' # can also be 'one_factor'
        require_pkce: true
        pkce_challenge_method: 'S256'
        scopes:
          - 'openid'
          - 'profile'
        response_types:
          - 'code'
        grant_types:
          - 'authorization_code'
        access_token_signed_response_alg: 'none'
        userinfo_signed_response_alg: 'none'
        token_endpoint_auth_method: 'none'
```
