import { gql } from 'apollo-server-express'

import { SELF_ID } from '../../constants'
import { generatePlanAsync } from './plan'
import { logger, Types } from './types/constants'
import { GoapModel } from './types/GoapModel'
import { Property } from './types/Property'
import { Transition } from './types/Transition'
import { Effect } from './types/Effect'
import { Condition } from './types/Condition'


require('dotenv').config()

export const resolver = {
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
    },
    generateActionPlan: generatePlanAsync,
    propertyTypes: async () => Object.keys(Types),
    assignmentOperators: async (_, { propertyType }) =>
      Object.keys(
        (Types[propertyType] || { assignmentOperators: {} }).assignmentOperators
      ),
    comparisonOperators: async (_, { propertyType }) =>
      Object.keys(
        (Types[propertyType] || { comparisonOperators: {} }).comparisonOperators
      ),
    createProperty: async (_,input) => {
      const model = new GoapModel( input )
      return new Property({...input, properties: model.properties }).toGraphQL()
    },
    createTransition: async (_,input) => {
      const model = new GoapModel( input )
      return new Transition({...input, properties: model.properties }).toGraphQL()
    },
    createEffect: async (_,input) => {
      const model = new GoapModel( input )
      return new Effect({...input, properties: model.properties }).toGraphQL()
    },
    createCondition: async (_,input) => {
      const model = new GoapModel( input )
      return new Condition({...input, properties: model.properties }).toGraphQL()
    }
  }
}
