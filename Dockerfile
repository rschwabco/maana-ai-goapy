FROM node:alpine

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY src/ /app/src/
COPY .babelrc /app

# RUN npm build
CMD npm start

EXPOSE 8050
