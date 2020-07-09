FROM node:alpine

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY src/ /app/src/
COPY .babelrc /app

ARG REACT_APP_PORTAL_AUTH_PROVIDER
ARG REACT_APP_AUTH_AUDIENCE
ARG REACT_APP_PORTAL_AUTH_IDENTIFIER
ARG REACT_APP_PORTAL_AUTH_CLIENT_ID
ARG REACT_APP_PORTAL_AUTH_DOMAIN
ARG REACT_APP_PORTAL_AUTH_CLIENT_SECRET
ARG MAINTENANCE_SECRET
ARG VERSION_TAG

ENV REACT_APP_PORTAL_AUTH_PROVIDER=${REACT_APP_PORTAL_AUTH_PROVIDER}
ENV REACT_APP_AUTH_AUDIENCE=${REACT_APP_AUTH_AUDIENCE}
ENV REACT_APP_PORTAL_AUTH_IDENTIFIER=${REACT_APP_PORTAL_AUTH_IDENTIFIER}
ENV REACT_APP_PORTAL_AUTH_CLIENT_ID=${REACT_APP_PORTAL_AUTH_CLIENT_ID}
ENV REACT_APP_PORTAL_AUTH_DOMAIN=${REACT_APP_PORTAL_AUTH_DOMAIN}
ENV REACT_APP_PORTAL_AUTH_CLIENT_SECRET=${REACT_APP_PORTAL_AUTH_CLIENT_SECRET}
ENV VERSION_TAG=${VERSION_TAG}

CMD npm start

EXPOSE 8050
