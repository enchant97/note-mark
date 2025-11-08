---
title: Environment Setup
---

## Requirements
- [Run Tool](https://github.com/enchant97/run-tool)
- Backend Development
    - Go (1.24)
- Frontend Development
    - Rust
    - Node.js (24) & pnpm
- Site
    - Install [Hugo](https://gohugo.io/)

## Frontend

Install Requirements:

```sh
run-tool run deps-frontend
```

Run Dev Environment:

```sh
run-tool run dev-frontend
```

## Backend

Install Requirements:

```sh
run-tool run deps-backend
```

Add Environment Variables:

```sh
touch .env
```

Run Dev Environment:

```sh
run-tool run dev-backend
```

## Site

```sh
run-tool run dev-site
```
