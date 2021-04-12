FROM node:alpine

WORKDIR /app

COPY package*.json /app/


RUN npm install --silent
COPY src/ /app/src/
COPY .babelrc /app

CMD npm start

EXPOSE 8050

