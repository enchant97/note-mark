# syntax=docker/dockerfile:1.4

FROM node:20-alpine3.17 as builder

    WORKDIR /app

    COPY package.json package-lock.json ./

    RUN npm ci

    COPY . .

    RUN npm run build

FROM nginxinc/nginx-unprivileged:1.24-alpine

    COPY --from=builder --link /app/dist /usr/share/nginx/html
    COPY --link nginx.conf /etc/nginx/conf.d/default.conf
