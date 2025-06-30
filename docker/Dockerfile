# syntax=docker/dockerfile:1.4

FROM node:20-bookworm AS node-base

    ENV PNPM_HOME="/pnpm"
    ENV PATH="$PNPM_HOME:$PATH"

    # ensure running latest corepack: https://github.com/nodejs/corepack/issues/612
    RUN npm install --global corepack@latest
    RUN corepack enable

FROM node-base AS frontend

    WORKDIR /usr/src/note-mark

    RUN \
        curl --proto '=https' --tlsv1.2 -sSf --output /tmp/rustup https://sh.rustup.rs && \
        chmod +x /tmp/rustup && \
        bash /tmp/rustup -y
    ENV PATH="$PATH:/root/.cargo/bin"
    RUN rustup target add wasm32-unknown-unknown

    COPY frontend/pnpm-workspace.yaml frontend/package.json frontend/pnpm-lock.yaml ./

    RUN pnpm i

    COPY frontend .

    RUN pnpm run wasm
    RUN pnpm run build --outDir /dist

FROM golang:1.24 as backend

    WORKDIR /usr/src/note-mark

    COPY ./backend/go.mod ./backend/go.sum ./
    RUN go mod download && go mod verify

    COPY ./backend .
    RUN CGO_ENABLED=0 go build -o /note-mark

FROM gcr.io/distroless/static-debian12

    COPY --from=backend --link /note-mark /
    COPY --from=frontend /dist /static

    EXPOSE 8000

    ENV BIND__HOST=0.0.0.0
    ENV BIND__PORT=8000
    ENV DB__URI=/data/db.sqlite
    ENV DB__TYPE=sqlite
    ENV DATA_PATH=/data
    ENV STATIC_PATH=/static

    ENTRYPOINT [ "./note-mark" ]
    CMD [ "serve" ]
