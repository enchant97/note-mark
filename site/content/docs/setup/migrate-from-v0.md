---
title: Migrate From V0.19
---
This guide is aimed at admins wishing to migrate data from V0.19 of Note Mark to V1. New users can skip this guide.

This guide will assume you have a working V0.19 app and working V1 app and they are following the official install method.

## 1 - Export From V0.19
V0.19 added a dedicated export tool to make exporting to the V1 format as easy as running one command.

Assuming your compose file is setup similar to shown in the [V0.19 guide]({{< ref "v0" >}}). You can amend the volumes section:

```yaml
    volumes:
      - data:/data
      - ./notemark-export:/export
```

Then run this command to export the data:

```sh
docker compose exec note-mark migrate export-v1 --export-dir /export
```

## 2 - Import Into V1
Once you have your exported data, you simply need to move/copy into your V1 Note Mark volume.

If you have used Docker managed volumes, you can find where the data is stored by using:

```sh
docker volume inspect data
```

Now copy the contents from `./note-mark-export` into `{docker volume path}/notes`.

It should look similar to this structure once complete:

```text
/{docker volume path}
    /db.sqlite <--- will only exist if you have previously run Note Mark V1
    /notes
        /leo
            /my-note.md
            /my-note
                /my-asset.jpg
```

## 3 - Final Steps
Note Mark V1 uses a SQLite database for caching and storing user info. To ensure the data will be read by Note Mark, it is a good idea to clear the cache, you can do this by running:

```sh
docker compose exec note-mark clear-cache
```

> *TIP* Anytime note data is changed outside of Note Mark you will need to run "clear-cache".

If you have not created the users in Note Mark V1 before import, you will need to either set passwords or assign OIDC mappings after Note Mark V1 is running. You can find available commands by running:

```sh
docker compose exec note-mark user --help
```
