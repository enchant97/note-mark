---
title: CLI
---

## How To Access
### Docker Install
Access from the official Docker image is easy! We can just use the "exec" command from either "docker" or "docker compose".

Example based off install guide:

```sh
docker compose exec note-mark /note-mark --help
```

#### Notes
Due to using a distro-less base image interactive tty sessions with a shell (sh, bash) are not possible.

### Bare Install
Assuming all of the environment variables are already set and Note Mark is accessible from path:

```sh
note-mark --help
```

## Available Commands
- `serve`: run the web API server, depending on install method may include UI
- `clean`: remove old and unused data
- `user`: user management such as: creation, setting a password, mapping oidc account
- `migrate`: import and export data out of the app
- `help`: shows the help for CLI
