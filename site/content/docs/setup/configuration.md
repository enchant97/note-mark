---
title: 02 - Configuration
---
Configuration of the backend is done through environment variables. See the below options:

| Key              | Description                               | Default   | Docker Default
|:---------------- |:----------------------------------------- |:----------|:--------------- |
| BIND__HOST       | What ip to listen on                      | 127.0.0.1 | 0.0.0.0         |
| BIND__PORT       | Port to bind to                           | 8000      | 8000            |
| DB__TYPE         | Type of DB (sqlite or postgres)           |           | sqlite          |
| DB__URI          | URI (or file path if using SQLite)        |           | /data/db.sqlite |
| JWT_SECRET       | base64 encoded secret                     |           |                 |
| TOKEN_EXPIRY     | seconds until a token expires             | 259200    | 259200          |
| DATA_PATH        | Where to store app data                   |           | /data           |
| STATIC_PATH      | Host static files                         |           |                 |
| CORS_ORIGINS     | Comma separated values of allowed origins |           |                 |
| ALLOW_SIGNUP     | Whether to enable new accounts            |  true     | true            |
| NOTE_SIZE_LIMIT  | Max file size for note                    |  1M       | 1M              |
| ASSET_SIZE_LIMIT | Max file size for uploaded assets         |  12M      | 12M             |

> *TIP* A secret can be generated using: `openssl rand -base64 32`

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
For most people this should be set to your front-end URL. For example if you access your front-end via `https://example.com:8000` then you should enter that. You can also set the config to allow all origins via `*`, multiple origins can also be specified by providing a comma separated values. Learn more about CORS on [Wikipedia](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing).
