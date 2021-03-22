FROM python:3.9-slim

LABEL maintainer="enchant97"

EXPOSE 8000

# add curl for health checks
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y curl \
    && apt-get clean
    && rm -rf /var/lib/apt/lists/*

# setup python environment
COPY requirements.txt requirements.txt

# make sure pip is up to date
RUN ["pip", "install", "pip", "--upgrade"]

# build/add base-requirements
# also allow for DOCKER_BUILDKIT=1 to be used
RUN --mount=type=cache,target=/root/.cache \
    pip install -r requirements.txt

# copy required files
COPY src/note_mark note_mark

# start the server
CMD python -m note_mark
