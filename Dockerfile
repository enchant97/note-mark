FROM python:3.9.2-alpine

LABEL maintainer="enchant97"

EXPOSE 8000

# add curl for health checks
RUN apk add --no-cache curl

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
