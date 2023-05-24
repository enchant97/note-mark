# syntax=docker/dockerfile:1.4

FROM golang:1.20 as builder

    WORKDIR /usr/src/note-mark

    COPY go.mod go.sum ./
    RUN go mod download && go mod verify

    COPY . .
    RUN CGO_ENABLED=0 go build -o /note-mark

FROM gcr.io/distroless/static-debian11

    COPY --from=builder --link /note-mark /

    EXPOSE 8000

    ENV HOST=0.0.0.0
    ENV PORT=8000
    ENV DATA_PATH=/data
    ENV DB__URI=/data/db.sqlite
    ENV DB__TYPE=sqlite

    CMD ["/note-mark"]
