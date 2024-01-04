---
title: Backups
---
To avoid data-loss it is important for you to backup your application data.

## What Do I Need To Backup?
Here's a simple list:

- Notes & Assets, located at configured `DATA_PATH`.
    - **DO NOT** edit any of these files outside of Note Mark.
- Database, located at configured: `DB__URI`.
    - If using a database server, you will need to perform a database dump.
    - The database must be backed-up, important note metadata is stored there.


## How Is Data Stored?
Note Mark uses a custom flat-file based storage mechanism. It also utilises a database for storing note/book metadata.

Here is a example of how data is stored at `DATA_PATH`:

```text
notes/
    16/
        16e29b6a-4798-4615-b186-a24b046a20ee/
            note.md
            assets/
                fca590d9-dbfc-4b8b-b5b3-1e8359af7e1d.bin
```

As you can see there is very little information stored outside of the database. However should something bad happen to the database the note content and any assets could be recovered from this folder.
