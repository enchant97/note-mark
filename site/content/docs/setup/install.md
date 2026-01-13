---
title: 01 - Install
---

## Docker (Official)
Note Mark is installed by using the all-in-one image, making deployment easier and more consistent.

> Stuck? Watch the [demo video](https://youtu.be/rwL99Ac5g98).

### Pre-Built Image

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

### Build Your Own
This may take some time depending on your internet and processor speed (about 15 mins on RPI 4).

```sh
git clone --depth 1 --branch v{{< app-version >}} https://github.com/enchant97/note-mark.git note-mark-{{< app-version >}} && \
cd note-mark-{{< app-version >}} && \
docker build -t note-mark:{{< app-version >}} -f docker/Dockerfile .
```

### Basic Config
Here is an example to deploy though Docker Compose, using the all-in-one image.

```yaml
# file: docker-compose.yml
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
      PUBLIC_URL: "http://notemark.example.com"
    ports:
      - 80:8080
```

For [further configuration, click here]({{< ref "docs/setup/configuration" >}}).

> *TIP* A reverse proxy is recommended so a FQDN can be used and tls can be setup to secure the traffic

> *TIP* Take a look at the [example]({{< ref "examples" >}}) deployments

## Bare
Not officially supported, but you should be able to follow the steps that Docker build performs, find the Dockerfile in: `docker/Dockerfile`.
