'use-strict'
import { BuildGraphqlClient } from 'io.maana.shared'
import querystring from 'querystring'
import request from 'request-promise-native'
import { logger } from './graphql/common/types/constants'
import { gql } from 'apollo-server-express'

// load .env into process.env.*
require('dotenv').config()

function clientSetup(token, url) {
  if (url) {
    // construct graphql client using endpoint and context
    return BuildGraphqlClient(url, (_, { headers }) => {
      // return the headers to the context so httpLink can read them
      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : ''
        }
      }
    })
  }
}

const PortalAuthProvider =
  process.env.REACT_APP_PORTAL_AUTH_PROVIDER || 'keycloak'
const PortalAuthIdentifier =
  process.env.REACT_APP_PORTAL_AUTH_IDENTIFIER || 'maanaLastKnownGood'
const PortalAuthDomain =
  process.env.REACT_APP_PORTAL_AUTH_DOMAIN ||
  'https://keycloakdev.knowledge.maana.io:8443'
const PortalAuthClientId = process.env.REACT_APP_PORTAL_AUTH_CLIENT_ID
const PortalAuthClientSecret = process.env.REACT_APP_PORTAL_AUTH_CLIENT_SECRET

async function requestAuthToken() {
  if (PortalAuthDomain) {
    const tokenUri =
      PortalAuthProvider === 'keycloak'
        ? `${PortalAuthDomain}/auth/realms/${PortalAuthIdentifier}/protocol/openid-connect/token`
        : `https://${PortalAuthDomain}/oauth/token`

    const form = {
      grant_type: 'client_credentials',
      client_id: PortalAuthClientId,
      client_secret: PortalAuthClientSecret,
      audience: PortalAuthIdentifier
    }
    const formData = querystring.stringify(form)
    const contentLength = formData.length
    const requestConfig = {
      headers: {
        'Content-Length': contentLength,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      uri: tokenUri,
      body: formData,
      method: 'POST'
    }
    const response = JSON.parse(await request(requestConfig))
    return response.access_token
  }
}

export async function initAuthenticatedClient(url) {
  const token = await requestAuthToken()
  return clientSetup(token, url)
}


export async function initAuthenticatedGraphQLClient(url) {
  const client = await initAuthenticatedClient(url)
  try { 
    const query = gql("query {__schema{ queryType{ name }}}")
    const result = await client.query({ query })
    logger.info(`lieveness test returns ${result}`)
    if (result != null) return client
    throw new Error('null query result')
  } catch (e) {
    logger.error(e.message)
    logger.error(`Could not initialize connection to ${url}`)
    return null
  }
}


export default initAuthenticatedClient
