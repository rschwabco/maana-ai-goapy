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
import { initAuthenticatedClient as authenticatedClient } from './client'
import { logicResolver } from './graphql/logic/resolvers'
import { persistResolver } from './graphql/persist/resolvers'
import {
  CKG_ENDPOINT_URL,
  HOSTNAME,
  LOGICPORT,
  BASE_ID,
  LOGIC_SVC_ID,
  PERSISTPORT,
  PERSIST_SVC_ID,
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
  // Create OIDC token URL for the specified auth provider (default to auth0).
  const client = await authenticatedClient(CKG_ENDPOINT_URL)

  const app = initApp()
  const app2 = initApp()
  const httpServer = http.createServer(app)
  const httpServer2 = http.createServer(app2)
  httpServer.listen({ port: LOGICPORT }, async () => {
    log(LOGIC_SVC_ID).info(
      `listening on ${print.external(`http://${PUBLICNAME}:${LOGICPORT}/graphql`)}`
    )
  })
  httpServer2.listen({ port: PERSISTPORT }, async () => {
    log(PERSIST_SVC_ID).info(
      `listening on ${print.external(`http://${PUBLICNAME}:${PERSISTPORT}/graphql`)}`
    )
  })
  const logicServer = new ApolloServer({
    resolvers: logicResolver,
    typeDefs: importSchema("./src/graphql/logic/schema.gql"),
    subscriptions: {
      onConnect: socketAuthMiddleware || defaultSocketMiddleware
    },
    context: async ({ req }) => {
      return {
        client
      }
    }
  })
  const persistServer = new ApolloServer({
    resolvers: persistResolver,
    typeDefs: importSchema("./src/graphql/persist/schema.gql"),
    subscriptions: {
      onConnect: socketAuthMiddleware || defaultSocketMiddleware
    },
    context: async ({ req }) => {
      return {
        client
      }
    }
  }) 
  logicServer.applyMiddleware({
    app,
    bodyParserConfig: {
      limit: '20mb'
    }
  })
  persistServer.applyMiddleware({
    app: app2,
    bodyParserConfig: {
      limit: '20mb'
    }
  })
  logicServer.installSubscriptionHandlers(httpServer)
  persistServer.installSubscriptionHandlers(httpServer2)
}

export default initServer
