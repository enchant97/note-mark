# Deployment

[Home](index.md)

## Without Docker
1. To run this app you should have all the python requirements
2. Setup configs with a .env file or environment variables (or both)
3. Easily run the app as `hypercorn 'note_mark.main:create_app()' --bind '0.0.0.0:8000'`.
4. Use a reverse proxy like [nginx](https://nginx.org/)

## With [Docker](https://www.docker.com/)
1. create the docker image using the Dockerfile
2. Setup configs with a .env file (mount as `/app/.env:ro`) or environment variables (or both)
3. Run docker container, or you could use docker-compose with [nginx](https://nginx.org/)
