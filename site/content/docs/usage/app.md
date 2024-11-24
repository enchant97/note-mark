---
title: App
---

## Supported Devices
This app is built to run on the latest devices and web browsers. See below supported browsers:

> Other browsers may work, however no support will be given.

Supported Browsers:

- Safari >= 17
- Chrome >= 124
- Firefox >= 125

## Key Bindings
Depending on the operating system keybindings may be slightly different. On Windows/Linux `<mod>` represents `<ctrl>` and on MacOS it represents `<cmd>`.

### General
- Open note/book search: `<ctrl>k`

### Editor

> To exit the editor via keyboard control you will need to press `<esc><tab>`, due to `<tab>` being bound to indentation.

- Save: `<mod>s`
- Indent: `<mod>]` or `<tab>`
- De-Indent: `<mod>[` or `<shift><tab>`
- Bold: `<mod>b`
- Italic: `<mod>i`

## Templating
Note Mark supports certain templating features; to assist in your note creation. You can use these features inside of the note editor and when the note is rendered the resulting item will be shown. See the below examples:

- `{{ note.name }}`
- `{{ book.name }}`
