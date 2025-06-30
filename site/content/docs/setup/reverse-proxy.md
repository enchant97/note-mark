---
title: Reverse Proxy
---
To run the backend and frontend over one FQDN and port can be done via a reverse proxy.

> *IMPORTANT:* This tutorial is deprecated, use "note-mark-aio" Docker image and setup

## Routes
Depending on the request they need to be routed to either app. These are documented below:

Backend:

- `/api/*`

Frontend:

- `/*`

If you are not using the Docker image then all requests that are not found for the frontend routes need to navigate to the `index.html` file.

## Nginx - Docker
This example assumes you already have the Docker Compose shown in the install section.

```yaml
# file: docker-compose.yml
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
    server frontend:8000;
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
