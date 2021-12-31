ARG PYTHON_VERSION=3.9

# metadata for docker
LABEL maintainer="enchant97"
EXPOSE 8000

FROM python:${PYTHON_VERSION}-slim as builder
    WORKDIR /app

    # setup python environment
    COPY requirements.txt requirements.txt

    # create python environment
    RUN python -m venv .venv
    ENV PATH="/app/.venv/bin:$PATH"

    # make sure pip is up to date
    RUN ["pip", "install", "pip", "--upgrade"]

    # add pip requirements
    # with caching allowing for DOCKER_BUILDKIT=1 to be used
    RUN --mount=type=cache,target=/root/.cache \
        pip install --user -r requirements.txt

FROM python:${PYTHON_VERSION}-alpine3.15
    WORKDIR /app
    ENV PATH="/app/.venv/bin:$PATH"
    ENV DATA_PATH=/data

    # copy python environment
    COPY --from=builder /app/.venv .venv

    # copy required files
    COPY src/note_mark note_mark

    # start the server
    CMD hypercorn 'note_mark.main:create_app()' --bind '0.0.0.0:8000' --workers "$WORKERS"

    HEALTHCHECK --interval=1m --start-period=30s \
        CMD python -m web_health_checker 'http://127.0.0.1:8000/is-healthy'
