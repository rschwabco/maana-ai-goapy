# Goal-Oriented Action Planning (GOAP) in Python for Maana Q

- Uses the [Python (Ariadne) Maana Q Knowledge Service](https://github.com/maana-io/q-template-service-python-ariadne) template
- Containerization is done using the [Uvicorn+Gunicorn Docker](https://github.com/tiangolo/uvicorn-gunicorn-docker) base image
- Uses the [GOAPy](https://github.com/flags/GOAPy) library for AI planning

## Build

```
pip install uvicorn gunicorn ariadne graphqlclient asgi-lifespan
```

## Containerize

Then you can build your image from the directory that has your Dockerfile, e.g:

```
docker build -t maana-ai-goapy ./
```

## Run Debug Locally

To run the GraphQL service locally with hot reload:

```
./start-reload.sh
```

For details, please refer to the [official documentation](https://github.com/tiangolo/uvicorn-gunicorn-fastapi-docker#development-live-reload).

## Run Locally (via Docker)

To run the GraphQL service locally (Via Docker):

```
docker run -it -p 4000:80 -t maana-ai-goapy
```

## Run Debug Locally (via Docker)

To run the GraphQL service via Docker with hot reload:

```
docker run -it -p 4000:80 -v $(pwd):/app maana-ai-goapy /start-reload-docker.sh
```

For details, please refer to the [official documentation](https://github.com/tiangolo/uvicorn-gunicorn-fastapi-docker#development-live-reload).

## Deploy

```
gql mdeploy
```
