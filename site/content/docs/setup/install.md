---
title: 01 - Install
---

## Docker (Official)
Note Mark is installed by using the all-in-one image, making deployment easier and more consistent.

> Stuck? Watch the [demo video](https://youtu.be/rwL99Ac5g98).

Below is the image name:

```text
ghcr.io/enchant97/note-mark-aio
```

The following labels are available:

> *TIP* Image labels follow Semantic Versioning

```text
<major>

<major>.<minor>

<major>.<minor>.<patch>
```

> *IMPORTANT:* The `latest` label is deprecated and does not get updated

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
      JWT_SECRET: "!!! REPLACE ME !!!"
      CORS_ORIGINS: "http://example.com"
    ports:
      - 80:8000
```

For [further configuration, click here]({{< ref "docs/setup/configuration" >}}).

> *TIP* A reverse proxy is recommended so a FQDN can be used and tls can be setup to secure the traffic

> *TIP* Take a look at the [example]({{< ref "examples" >}}) deployments

## Bare
Not officially supported, but you should be able to follow the steps that the Dockerfile's perform.
