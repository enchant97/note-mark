# Configuration

[Home](index.md)

    You can configure the app using a .env file or through environment variables.

## Config Options
| Name                   | Description                            | Default   |
| :--------------------- | :------------------------------------- | :-------- |
| DB_URL                 | URI of where db is stored              |           |
| SECRET_KEY             | Your app secret (use something secure) |           |
| ADMIN_PASSWORD         | Admin password (use something secure)  |           |
| ALLOW_ACCOUNT_CREATION | Allow creation of new accounts         | True      |
| DATA_PATH              | Path to your data folder               | "./data"  |
| AUTH_COOKIE_SECURE     | Whether to require https for cookies   | False     |
| ADMIN_LOGIN_ALLOWED    | Allow to log in as admin               | True      |
| LOG_LEVEL              | What log level to use                  | "WARNING" |
| SERVER_NAME            | name of the server                     | -         |
| WORKERS                | Number of instances (docker only)      | 1         |

> When running in docker the DATA_PATH field will be set to: `/data`.
