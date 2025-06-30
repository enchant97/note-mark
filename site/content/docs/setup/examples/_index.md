---
title: Examples
---
Shown examples use official Docker images. Examples also show links to download the files, to provide easier deployment.

> Example deployments use insecure credentials, you **MUST** change them

> You **MUST** specify a versioned image tag, latest is: `{{< app-version >}}`

## SQLite
This example shows how to use the all-in-one image with the built-in SQLite database.


- [Download: docker-compose.yml](docker-compose.yml)

{{< highlight-resource file="docker-compose.yml" lang="yml" >}}

## PostgreSQL
This example shows how to use the all-in-one image with a PostgreSQL database.

- [Download: docker-compose.yml](postgres-docker-compose.yml)

{{< highlight-resource file="postgres-docker-compose.yml" lang="yml" >}}
