---
title: Backups
---
To avoid data-loss it is important for you to backup your application data.

## What Do I Need To Backup?
Everything in the configured `DATA_PATH`. Just copy and store.

## How Is Data Stored?
Note Mark V1 stores your note data in a normal file/folder structure. It utilises a SQLite database for storing user details and the file/folder structure cache (called a tree-cache).

Here is a example of how data is stored at `DATA_PATH`:

```text
/data
    /db.sqlite
    /notes
        /leo
            /my-note.md
            /my-note
                /my-asset.jpg
```

## Restore
To restore you should just be able to copy all data back into the configured `DATA_PATH`.

If you happen to loose/corrupt the database file, you will need to copy just the `notes` folder and then create the users and run the clear-cache command from the CLI.
