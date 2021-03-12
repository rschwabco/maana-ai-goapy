import { gql } from 'apollo-server-express'

import { SELF_ID } from '../../constants'
import Persisters from './persist'
import Updaters from './update'
import Removers from './remove'
import { Types } from '../common/types/constants'
import { isGoapWorkspace } from './utils'

require('dotenv').config()

export const persistResolver = {
  Query: {
    info: async (_, args, ctxt) => {
      let remoteId = SELF_ID
      const { client } = ctxt
      try {
        if (client) {
          const query = gql`
            query info {
              info {
                id
              }
            }
          `
          const {
            data: {
              info: { id }
            }
          } = await client.query({ query })
          remoteId = id
        }
      } catch (e) {
        log(SELF_ID).error(
          `Info Resolver failed with Exception: ${e.message}\n${print.external(
            e.stack
          )}`
        )
      }

      return {
        id: SELF_ID,
        name: 'Maana AI Goap',
        description: `An implementation of goal oriented action planning (GOAP)`
      }
    }
  },
  Query: {
    assignmentOperators: (_,{variableType}) => Types[variableType] ? Object.keys(Types[variableType].assignmentOperators) : [],
    comparisonOperators: (_,{variableType}) => Types[variableType] ? Object.keys(Types[variableType].comparisonOperators) : [],
    variableTypes: _ => Object.keys(Types),
    isGoapWorkspace: isGoapWorkspace
  },
  Mutation: {
    ...Persisters,
    ...Removers,
    ...Updaters
  }
}
