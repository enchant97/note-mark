# Configuration

[Home](index.md)

    You can configure the app using a .env file or through environment variables.

## Config Options
| Name                   | Description                            | Required | Default            |
|:-----------------------|:-------------------------------------- |:---------|:-------------------|
| DB_URL                 | URI of where db is stored              | YES      |                    |
| SECRET_KEY             | Your app secret (use something secure) | YES      |                    |
| ADMIN_PASSWORD         | Admin password (use something secure)  | YES      |                    |
| ALLOW_ACCOUNT_CREATION | Allow creation of new accounts         | NO       | True               |
| DATA_PATH              | Path to your data folder               | NO       | "./data"           |
| AUTH_COOKIE_SECURE     | Whether to require https for cookies   | NO       | False              |
| ADMIN_LOGIN_ALLOWED    | Allow to log in as admin               | NO       | True               |
| LOG_LEVEL              | What log level to use                  | NO       | "WARNING"          |
| HOST                   | host to listen for requests            | NO       | "127.0.0.1"        |
| PORT                   | port to listen for requests            | NO       | 8000               |
| BASE_URL               | The base url prefix                    | NO       | "/"                |
