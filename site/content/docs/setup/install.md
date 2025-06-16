---
title: 01 - Install
---

## Docker (Official)
Both the backend and frontend are distributed by as Docker images, making deployment consistent. Using the all-in-one image may be preferred as everything is bundled together.

> Stuck? Watch the [demo video](https://youtu.be/rwL99Ac5g98).

Below are the image names:

```text
ghcr.io/enchant97/note-mark-backend

ghcr.io/enchant97/note-mark-frontend

ghcr.io/enchant97/note-mark-aio
```

The following labels are available:

> *TIP* Image labels follow Semantic Versioning

```text
<major>

<major>.<minor>

<major>.<minor>.<patch>
```

> *TIP* The `latest` label is deprecated and does not get updated

Here is an example to deploy though Docker Compose, using the all-in-one image.

```yaml
# file: docker-compose.yml
version: "3"

volumes:
  data:

services:
  note-mark:
    image: ghcr.io/enchant97/note-mark-aio:{{< app-version >}}
    restart: unless-stopped
    volumes:
      - data:/data
    environment:
      # !!! REPLACE These !!!
      JWT_SECRET: "bXktc2VjcmV0"
      CORS_ORIGINS: "http://example.com:8000"
    ports:
      - 8000:8000
```

> *TIP* A reverse proxy is recommended so a FQDN can be used and tls can be setup to secure the traffic

> *TIP* Take a look at the [example]({{< ref "examples" >}}) deployments

## Bare
Not officially supported, but you should be able to follow the steps that the Dockerfile's perform.
