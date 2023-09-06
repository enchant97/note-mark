---
title: 01 - Install
---

## Docker (Official)
Both the backend and frontend are distributed by as Docker images, making deployment easier.

Below are the image names:

```text
ghcr.io/enchant97/note-mark-backend

ghcr.io/enchant97/note-mark-frontend
```

The following labels are available:

> *TIP* Image labels follow Semantic Versioning

```text
<major>

<major>.<minor>

<major>.<minor>.<patch>
```

Deploying both apps can be done using Docker Compose, shown below:

> *TIP* Using a reverse proxy can allow you to have the app on a single domain & port

```yaml
# file: docker-compose.yml
version: "3"

volumes:
  data:

services:
  backend:
    image: ghcr.io/enchant97/note-mark-backend:{{< app-version >}}
    restart: unless-stopped
    volumes:
      - data:/data
    environment:
      # !!! REPLACE These !!!
      JWT_SECRET: "bXktc2VjcmV0"
      CORS_ORIGINS: "*"
    ports:
      - 8001:8000

  frontend:
    image: ghcr.io/enchant97/note-mark-frontend:{{< app-version >}}
    restart: unless-stopped
    ports:
      - 8000:8000
```

Once running you should be able to visit at `http://<your ip>:8000/` and see the UI. Navigate to the login page and change the port to `8001` and ensure the URL ends with `/api`. These steps would not be required if you ran the app over the same FQDN and port (using a reverse proxy).

> *TIP* A reverse proxy is recommended so a FQDN can be used and tls can be setup to secure the traffic

> *TIP* Take a look at the [example]({{< ref "examples" >}}) deployments

## Bare
TBA
