# syntax=docker/dockerfile:1.4
FROM golang:1.21 as backend
RUN apt update \
    && apt install -y tini
WORKDIR /backend-build
COPY backend/go.mod backend/go.sum ./
RUN go mod download \
    && go mod verify
COPY backend .
RUN CGO_ENABLED=0 go build -o /backend-build/note-mark

FROM node:20-bookworm as frontend
WORKDIR /frontend-build
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -y

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY frontend/package.json frontend/pnpm-lock.yaml /frontend-build/
RUN pnpm install # --frozen-lockfile --prod
COPY frontend .

RUN pnpm run wasm
RUN pnpm run build

FROM debian:bookworm-slim AS FINAL
ARG USER=note-mark
RUN useradd -d /app --shell /bin/bash $USER \
    && mkdir -p /app/data && chown $USER:$USER /app/data
USER $USER

WORKDIR /app
COPY --from=frontend --chown=$USER:$USER /frontend-build/dist /app/web/
COPY --from=backend --chown=$USER:$USER /backend-build/note-mark /usr/bin/tini /usr/local/bin/

ENV BIND__HOST=0.0.0.0
ENV BIND__PORT=8000
ENV DB__URI=/app/data/db.sqlite
ENV DB__TYPE=sqlite
ENV DATA_PATH=/app/data
ENV STATIC_PATH=/app/web

EXPOSE 8000/tcp

VOLUME /app/data
ENTRYPOINT [ "tini", "--", "note-mark", "serve" ]