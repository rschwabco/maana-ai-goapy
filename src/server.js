'use-strict'
import { initMetrics, log, print } from 'io.maana.shared'

// middleware to support GraphQL
import { ApolloServer } from 'apollo-server-express'
// middleware to allow cross-origin requests
import cors from 'cors'
// routing engine
import express from 'express'
// Keep GraphQL stuff nicely factored
import glue from 'schemaglue'
import http from 'http'
// GraphQL schema compilation
import { makeExecutableSchema } from 'graphql-tools'
import path from 'path'
import { initAuthenticatedClient as authenticatedClient } from './client'
import { resolver } from './graphql/main/resolvers'
import {
  CKG_ENDPOINT_URL,
  HOSTNAME,
  PORT,
  PUBLICNAME,
  SELF_ID
} from './constants'

// load .env into process.env.*
require('dotenv').config()

const options = {
  mode: 'js' // default
}
const schemaPath = path.join(
  '.',
  `${__dirname}`.replace(process.cwd(), ''),
  'graphql/'
)
const glueRes = glue(schemaPath, options)

// Compile schema
export const schema = makeExecutableSchema({
  typeDefs: glueRes.schema,
  resolvers: glueRes.resolver
})

function initApp() {
  const app = express()
  const corsOptions = {
    origin: `http://${PUBLICNAME}:3000`,
    credentials: true // <-- REQUIRED backend setting
  }
  app.use(cors(corsOptions)) // enable all CORS requests
  app.options('*', cors()) // enable pre-flight for all routes

  app.get('/', (req, res) => {
    res.send(`${SELF_ID}\n`)
  })

  return app
}

const defaultSocketMiddleware = (connectionParams, webSocket) => {
  return new Promise(function(resolve, reject) {
    log(SELF_ID).warn(
      'Socket Authentication is disabled. This should not run in production.'
    )
    resolve()
  })
}

const initServer = async options => {
  // eslint-disable-next-line no-unused-vars
  const { httpAuthMiddleware, socketAuthMiddleware } = options
  initMetrics(SELF_ID.replace(/[\W_]+/g, ''))
  // Create OIDC token URL for the specified auth provider (default to auth0).
  const client = await authenticatedClient(CKG_ENDPOINT_URL)

  const app = initApp()
  const httpServer = http.createServer(app)
  httpServer.listen({ port: PORT }, async () => {
    log(SELF_ID).info(
      `listening on ${print.external(`http://${HOSTNAME}:${PORT}/graphql`)}`
    )
  })

  const server = new ApolloServer({
    resolvers: resolver,
    schema,
    subscriptions: {
      onConnect: socketAuthMiddleware || defaultSocketMiddleware
    },
    context: async ({ req }) => {
      return {
        client
      }
    }
  })
  server.applyMiddleware({
    app,
    bodyParserConfig: {
      limit: '20mb'
    }
  })
  server.installSubscriptionHandlers(httpServer)
}

export default initServer
