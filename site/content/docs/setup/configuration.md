---
title: 02 - Configuration
---
Configuration of the Note Mark is done through environment variables. See the below options:

| Key              | Description                               | Default   | Docker Default
|:---------------- |:----------------------------------------- |:----------|:--------------- |
| BIND__HOST       | What ip to listen on                      | 127.0.0.1 | 0.0.0.0         |
| BIND__PORT       | Port to bind to                           | 8080      | 8080            |
| BIND__UNIX_SOCKET | Listen on unix socket, overrides HOST/PORT when set | - | - |
| DB__TYPE         | Type of DB (sqlite or postgres)           |           | sqlite          |
| DB__URI          | URI (or file path if using SQLite)        |           | /data/db.sqlite |
| JWT_SECRET       | base64 encoded secret                     |           |                 |
| TOKEN_EXPIRY     | seconds until a token expires             | 259200    | 259200          |
| DATA_PATH        | Where to store app data                   |           | /data           |
| STATIC_PATH      | Host static files                         |           |                 |
| CORS_ORIGINS     | Comma separated values of allowed origins |           |                 |
| ENABLE_INTERNAL_SIGNUP | Whether to enable new internal accounts | true | true |
| ENABLE_INTERNAL_LOGIN | Whether to enable new logins for internal accounts | true | true |
| NOTE_SIZE_LIMIT  | Max file size for note                    |  1M       | 1M              |
| ASSET_SIZE_LIMIT | Max file size for uploaded assets         |  12M      | 12M             |
| OIDC__DISPLAY_NAME | The provider name (used for UI) | - | - |
| OIDC__PROVIDER_NAME | The provider name (used for DB) | - | - |
| OIDC__ISSUER_URL | The OIDC issuer url | - | - |
| OIDC__CLIENT_ID | The OIDC client id | - | - |
| OIDC__ENABLE_USER_CREATION | Whether to automatically create users | true | true |

> *TIP* A secret can be generated using: `openssl rand -base64 32`

## OIDC
Single-Sign-On is handled via OpenID Connect and OAuth2. [OIDC Provider Examples]({{< ref oidc >}}).

## Database URI
These have been copied from the ORM docs, more info found on [gorm.io](https://gorm.io/docs/connecting_to_the_database.html).

sqlite:

```text
/path/to/db.sqlite
```

postgres:

```text
host=localhost user=user password=pass dbname=notemark port=5432 sslmode=disable TimeZone=Europe/London
```

## CORS
For most people this should be set to your front-end URL. For example if you access your front-end via `https://notemark.example.com` then you should enter that. Multiple origins can also be specified by providing comma separated values. Learn more about CORS on [Wikipedia](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing).
