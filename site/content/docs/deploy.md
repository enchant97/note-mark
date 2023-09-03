---
title: "Deploy"
---

# Deploy
This page documents how the app can be installed.

## Configuration
App configuration is accomplished via environment variables, listed below are the available options:

| Key          | Description                               | Default   | Docker Default  |
|:------------ |:----------------------------------------- |:----------|:--------------- |
| BIND__HOST   | What ip to listen on                      | 127.0.0.1 | 0.0.0.0         |
| BIND__PORT   | Port to bind to                           | 8000      | 8000            |
| DB__TYPE     | Type of DB (sqlite, mysql, postgres)      |           | sqlite          |
| DB__URI      | URI (or file path if using SQLite)        |           | /data/db.sqlite |
| JWT_SECRET   | base64 encoded secret                     |           |                 |
| TOKEN_EXPIRY | seconds until a token expires             | 259200    | 259200          |
| DATA_PATH    | Where to store app data                   |           | /data           |
| CORS_ORIGINS | Comma separated values of allowed origins |           |                 |
| ALLOW_SIGNUP | Whether to enable new accounts            |  true     | true            |

> *TIP* A secret can be generated using: `openssl rand -base64 32`


## Deploy With Docker
This app consists of two components, the backend (api) and the frontend.

> *TIP* Image labels follow Semantic Versioning, several choices are available:
>
> - `latest`
> - `<major>`
> - `<major>.<minor>`
> - `<major>.<minor>.<patch>`

```
ghcr.io/enchant97/note-mark-frontend:0.6.0-alpha.2
```

```
ghcr.io/enchant97/note-mark-backend:0.6.0-alpha.2
```

Here is an example using Docker Compose and a NGINX reverse proxy:

```yml
# file: docker-compose.yml
version: "3"

volumes:
  data:

services:
  backend:
    image: ghcr.io/enchant97/note-mark-backend:0.6.0-alpha.2
    restart: unless-stopped
    volumes:
      - data:/data
    environment:
      JWT_SECRET: "YourSecretHere"
      CORS_ORIGINS: "http://example.com"

  frontend:
    image: ghcr.io/enchant97/note-mark-frontend:0.6.0-alpha.2
    restart: unless-stopped

  proxy:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - 80:80
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

```properties
# file: nginx.conf
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:8080;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://frontend;
    }

    location /api {
        proxy_pass http://backend/api;
    }
}
```

## Deploy Bare
TBA.
