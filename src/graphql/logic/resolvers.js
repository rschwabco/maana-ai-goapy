import { gql } from 'apollo-server-express'

import { SELF_ID } from '../../constants'
import { logger } from '../common/types/constants'
import { GoapModel } from '../common/types/GoapModel'
import { Variable } from '../common/types/Variable'
import { Transition } from '../common/types/Transition'
import { Effect } from '../common/types/Effect'
import { Condition } from '../common/types/Condition'
import { VariableValue } from '../common/types/VariableValue'
import { objectFromInstance } from 'io.maana.shared/dist/KindDBSvc'
import { WorldState } from '../common/types/WorldState'
import { Goal }  from '../common/types/Goal'
import { areGoalsSatisfied, singleStep, enabledTransitions }  from './plan'
const workerFarm = require('worker-farm')

const workers = workerFarm({ maxRetries: 0 }, require.resolve('./plan'),['generateActionPlan'])

require('dotenv').config()

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
    singleStep
  }
}
