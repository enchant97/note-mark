# syntax=docker/dockerfile:1.4

FROM node:20-bullseye as builder

    WORKDIR /app

    RUN \
        curl --proto '=https' --tlsv1.2 -sSf --output /tmp/rustup https://sh.rustup.rs && \
        chmod +x /tmp/rustup && \
        /tmp/rustup -y && \
        rustup target add wasm32-unknown-unknown

    COPY package.json package-lock.json ./

    RUN npm ci

    COPY . .

    RUN npm run wasm
    RUN npm run build

FROM nginxinc/nginx-unprivileged:1.24-alpine

    COPY --from=builder --link /app/dist /usr/share/nginx/html
    COPY --link nginx.conf /etc/nginx/conf.d/default.conf
