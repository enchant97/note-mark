---
title: 02 - Configuration
---
Configuration of the backend is done through environment variables. See the below options:

| Key          | Description                               | Default   | Docker Default  |
|:------------ |:----------------------------------------- |:----------|:--------------- |
| BIND__HOST   | What ip to listen on                      | 127.0.0.1 | 0.0.0.0         |
| BIND__PORT   | Port to bind to                           | 8000      | 8000            |
| DB__TYPE     | Type of DB (sqlite, mariadb, postgres)    |           | sqlite          |
| DB__URI      | URI (or file path if using SQLite)        |           | /data/db.sqlite |
| JWT_SECRET   | base64 encoded secret                     |           |                 |
| TOKEN_EXPIRY | seconds until a token expires             | 259200    | 259200          |
| DATA_PATH    | Where to store app data                   |           | /data           |
| CORS_ORIGINS | Comma separated values of allowed origins |           |                 |
| ALLOW_SIGNUP | Whether to enable new accounts            |  true     | true            |

> *TIP* A secret can be generated using: `openssl rand -base64 32`

## Database URI
These have been copied from the ORM, more info found [here](https://gorm.io/docs/connecting_to_the_database.html).

sqlite:

```text
/path/to/db.sqlite
```

mariadb:

```text
user:pass@tcp(127.0.0.1:3306)/notemark?charset=utf8mb4&parseTime=True&loc=Local
```

postgres:

```text
host=localhost user=user password=pass dbname=notemark port=5432 sslmode=disable TimeZone=Europe/London
```
