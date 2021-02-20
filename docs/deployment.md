# Deployment

[Home](index.md)

## Without Docker
1. To run this app you should have all the python requirements
2. Setup configs either with a .env file or environment variables (or both)
3. Easily run the app as `python -m note_mark`.
This is will run using [Hypercorn](https://pypi.org/project/Hypercorn/)
with the given configs
4. Use a reverse proxy like [nginx](https://nginx.org/)

## With [Docker](https://www.docker.com/)
1. create the docker image using the Dockerfile
2. Setup configs either with a .env file or environment variables (or both)
3. Run docker container, or you could use docker-compose with [nginx](https://nginx.org/)

Please note to use docker you may have to change
the BINDS config to ["0.0.0.0:8000"] to allow requests outside of the docker network,
unless you are using a reverse proxy that is on the same Docker network.
