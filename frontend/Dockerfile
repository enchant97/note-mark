# syntax=docker/dockerfile:1

FROM node:20-slim AS node-base
    ENV PNPM_HOME="/pnpm"
    ENV PATH="$PNPM_HOME:$PATH"

    # ensure running latest corepack: https://github.com/nodejs/corepack/issues/612
    RUN npm install --global corepack@latest
    RUN corepack enable

FROM node-base AS builder

    WORKDIR /app

    RUN \
        curl --proto '=https' --tlsv1.2 -sSf --output /tmp/rustup https://sh.rustup.rs && \
        chmod +x /tmp/rustup && \
        bash /tmp/rustup -y
    ENV PATH="$PATH:/root/.cargo/bin"
    RUN rustup target add wasm32-unknown-unknown

    COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

    RUN pnpm i

    COPY . .

    RUN pnpm run wasm
    RUN pnpm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine3.21

    COPY --from=builder --link /app/dist /usr/share/nginx/html
    COPY --link nginx.conf /etc/nginx/conf.d/default.conf
