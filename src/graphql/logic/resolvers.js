import { gql } from 'apollo-server-express'
import Updaters from './update'
import Removers from './remove'
import { getOperatorExample, getOperatorDescription, Types } from '../common/types/constants'
import { SELF_ID } from '../../constants'
import { areGoalsSatisfied, singleStep, enabledTransitions }  from './plan'
const workerFarm = require('worker-farm')

const workers = workerFarm({ maxRetries: 0 }, require.resolve('./plan'),['generateActionPlan'])

require('dotenv').config()

const constructOperator = (id) => {
 return {
  id,
  description: getOperatorDescription(id),
  example: getOperatorExample(id)
 }
}

export const logicResolver = {
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
        workers.generateActionPlan(input, function(err, out) {
          if (err) {
            reject(err)
          }
          resolve(out)
        })
      })
    },
    enabledTransitions,
    areGoalsSatisfied,
    singleStep,
    assignmentOperators: (_,{variableType}) => Types[variableType] ? Object.keys(Types[variableType].assignmentOperators).map(operator => constructOperator(operator)) : [],
    comparisonOperators: (_,{variableType}) => Types[variableType] ? Object.keys(Types[variableType].comparisonOperators).map(operator => constructOperator(operator)) : [],
    variableTypes: _ => Object.keys(Types),
    ...Updaters,
    ...Removers
  }
}
