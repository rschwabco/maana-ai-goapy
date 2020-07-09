import { gql } from 'apollo-server-express'

import { SELF_ID } from '../../constants'
import { generatePlanAsync } from './plan'
import { logger, Types } from './types/constants'
import { GoapModel } from './Types/GoapModel'

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
    createModel: async (_, input) => {
      const x = new GoapModel(input).toGraphQL()
      logger.info(JSON.stringify(x,null,2))
      return x
    },
    addProperty: async (_,input) => {
      const model = new GoapModel(input.model)
      model.addProperty(input)
      return model.toGraphQL()
    },
    addTransition: async (_,input) => {
      const model = new GoapModel(input.model)
      model.addTransition(input)
      return model.toGraphQL()
    },
    addEffect: async (_,input) => {
      const model = new GoapModel(input.model)
      const transition = model.transitions[input.transitionName]
      transition.addEffect({...input, properties:model.properties, modelId: model.id})
      return model.toGraphQL()
    },
    addCondition: async (_,input) => {
      const model = new GoapModel(input.model)
      const transition = model.transitions[input.transitionName]
      transition.addEffect({...input, properties:model.properties, modelId: model.id})
      return model.toGraphQL()
    }
  }
}
