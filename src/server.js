'use-strict'
import { initMetrics, log, print } from 'io.maana.shared'

// middleware to support GraphQL
import { ApolloServer } from 'apollo-server-express'
// middleware to allow cross-origin requests
import cors from 'cors'
// routing engine
import express from 'express'
// Keep GraphQL stuff nicely factored
import http from 'http'
// GraphQL schema compilation
import { logicResolver } from './graphql/logic/resolvers'
import {
  CKG_ENDPOINT_URL,
  HOSTNAME,
  LOGICPORT,
  BASE_ID,
  LOGIC_SVC_ID,
  PUBLICNAME
} from './constants'
import { importSchema } from 'graphql-import'

// load .env into process.env.*
require('dotenv').config()

function initApp() {
  const app = express()
  const corsOptions = {
    origin: `http://${PUBLICNAME}:3000`,
    credentials: true // <-- REQUIRED backend setting
  }
  app.use(cors(corsOptions)) // enable all CORS requests
  app.options('*', cors()) // enable pre-flight for all routes

  app.get('/', (req, res) => {
    res.send(`${BASE_ID}\n`)
  })

  return app
}

const defaultSocketMiddleware = (connectionParams, webSocket) => {
  return new Promise(function(resolve, reject) {
    log(BASE_ID).warn(
      'Socket Authentication is disabled. This should not run in production.'
    )
    resolve()
  })
}

const initServer = async options => {
  // eslint-disable-next-line no-unused-vars
  const { httpAuthMiddleware, socketAuthMiddleware } = options
  initMetrics(BASE_ID.replace(/[\W_]+/g, ''))

  const app = initApp()
  const httpServer = http.createServer(app)
  httpServer.listen({ port: LOGICPORT }, async () => {
    log(LOGIC_SVC_ID).info(
      `listening on ${print.external(`http://${PUBLICNAME}:${LOGICPORT}/graphql`)}`
    )
  })
  const logicServer = new ApolloServer({
    resolvers: logicResolver,
    typeDefs: importSchema("./src/graphql/logic/schema.gql"),
    subscriptions: {
      onConnect: socketAuthMiddleware || defaultSocketMiddleware
    }
  })
  logicServer.applyMiddleware({
    app,
    bodyParserConfig: {
      limit: '20mb'
    }
  })
  logicServer.installSubscriptionHandlers(httpServer)
}

export default initServer
