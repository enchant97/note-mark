---
title: Data Migratation
---

Importing and exporting data is handled via the `migrate` CLI command. This section documents the file structure that can be expected when exporting and what is required when importing.

## Import

> NOTE: Currently note assets cannot be imported via the CLI migrate command.

> NOTE: It is expected that all users are created before the import is started.

```text
{username}/
    {book-slug}/
        {note-slug}.md
```

## Export

```text
{username}/
    {book-slug}/
        {note-slug}/
            _index.md
            assets/
                {asset-id}.{asset-name}
```


## Export For V1
This produces a V1 compatible structure, so you can continue to use Note Mark. Please note, you will need to create your users before import.

```text
{username}/
    {book-slug}/
        {note-slug}.md
        {note-slug}/
            {asset-name}
```
