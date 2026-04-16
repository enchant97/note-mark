---
title: 02 - Configuration
---
Configuration of the Note Mark is done through environment variables. See the below options:

| Key | Description | Default | Docker Default |
|:--- |:----------- |:------- |:-------------- |
| BIND__HOST        | What ip to listen on                                | 127.0.0.1 | 0.0.0.0 |
| BIND__PORT        | Port to bind to                                     | 8080      | 8080    |
| BIND__UNIX_SOCKET | Listen on unix socket, overrides HOST/PORT when set | -         | -       |
| | | | | |
| AUTH_TOKEN__SECRET | base64 encoded secret         |        |        |
| AUTH_TOKEN__EXPIRY | seconds until a token expires | 259200 | 259200 |
| | | | | |
| DATA_PATH   | Where to store app data            |   | /data   |
| STATIC_PATH | Host static files                  | - | /static |
| PUBLIC_URL  | The URL where app is accessed from |   |         |
| | | | | |
| ENABLE_INTERNAL_SIGNUP       | Whether to enable new internal accounts            | true | true |
| ENABLE_INTERNAL_LOGIN        | Whether to enable new logins for internal accounts | true | true |
| ENABLE_ANONYMOUS_USER_SEARCH | Whether to allow public access to user search      | true | true |
| | | | | |
| FILE_SIZE_LIMIT | Max file size for uploaded assets | 12M | 12M |
| | | | | |
| OIDC__DISPLAY_NAME         | The provider name (used for UI)       | -    | -    |
| OIDC__PROVIDER_NAME        | The provider name (used for DB)       | -    | -    |
| OIDC__ISSUER_URL           | The OIDC issuer url                   | -    | -    |
| OIDC__CLIENT_ID            | The OIDC client id                    | -    | -    |
| OIDC__ENABLE_USER_CREATION | Whether to automatically create users | true | true |
| | | | | |
| ENV_MODE | "production" or "development" | production | production |

## AUTH_TOKEN__SECRET
A secret can be generated using:

```sh
openssl rand -base64 128
```

## OIDC
Single-Sign-On is handled via OpenID Connect and OAuth2. [OIDC Provider Examples]({{< ref oidc >}}).

## PUBLIC_URL
This **MUST** be set to your front-end URL and **NOT** end in a trailing slash e.g. `https://notemark.example.com`.
