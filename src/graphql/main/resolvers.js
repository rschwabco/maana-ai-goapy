import { gql } from 'apollo-server-express'

import { SELF_ID } from '../../constants'
import { logger, Types } from './types/constants'
import { GoapModel } from './types/GoapModel'
import { Property } from './types/Property'
import { Transition } from './types/Transition'
import { Effect } from './types/Effect'
import { Condition } from './types/Condition'
import { PropertyValue } from './types/PropertyValue'
import { objectFromInstance } from 'io.maana.shared/dist/KindDBSvc'
const workerFarm = require('worker-farm')

const workers = workerFarm({ maxRetries: 0 }, require.resolve('./plan'))

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
    generateActionPlan: async (_root, input) => {
      return new Promise((resolve, reject) => {
        workers(input, function(err, out) {
          if (err) reject(err)
          resolve(out)
        })
      })
    },
    propertyTypes: async () => Object.keys(Types),
    assignmentOperators: async (_, { propertyType }) =>
      Object.keys(
        (Types[propertyType] || { assignmentOperators: {} }).assignmentOperators
      ),
    comparisonOperators: async (_, { propertyType }) =>
      Object.keys(
        (Types[propertyType] || { comparisonOperators: {} }).comparisonOperators
      ),
    createProperty: async (_, input) => {
      const model = new GoapModel(input)
      return new Property({
        ...input,
        properties: model.properties
      }).toGraphQL()
    },
    createTransition: async (_, input) => {
      const model = new GoapModel(input)
      return new Transition({
        ...input,
        properties: model.properties
      }).toGraphQL()
    },
    createEffect: async (_, input) => {
      const model = new GoapModel(input)
      return new Effect({ ...input, properties: model.properties }).toGraphQL()
    },
    createCondition: async (_, input) => {
      const model = new GoapModel(input)
      return new Condition({
        ...input,
        properties: model.properties
      }).toGraphQL()
    },
    createPropertyValue: async (_, input) => {
      const model = new GoapModel(input)
      return new PropertyValue({
        ...input,
        properties: model.properties
      }).toGraphQL()
    },
    createInitialValues: async (_, input) => {
      const model = new GoapModel(input)
      const vs = (input.propertyValues || [])
        .filter(x => x != null)
        .map(x => new PropertyValue({ ...x, properties: model.properties }))
      const obj = {}
      for (const v of vs) {
        if (obj[v.id])
          throw new Error(
            `Duplicate property ${id}.  Cannot create property value.`
          )
        obj[v.id] = v
      }
      for (const p of Object.keys(model.properties)) {
        if (obj[p] != null) continue
        obj[p] = new PropertyValue({ properties: model.properties, id: p})
      }
      const result = Object.values(obj).map( x => x.toGraphQL())
      return result
    }
  }
}
