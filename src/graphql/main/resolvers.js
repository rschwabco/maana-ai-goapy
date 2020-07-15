import { gql } from 'apollo-server-express'

import { SELF_ID } from '../../constants'
import { logger, Types } from './types/constants'
import { GoapModel } from './types/GoapModel'
import { Variable } from './types/Variable'
import { Transition } from './types/Transition'
import { Effect } from './types/Effect'
import { Condition } from './types/Condition'
import { VariableValue } from './types/VariableValue'
import { objectFromInstance } from 'io.maana.shared/dist/KindDBSvc'
import { WorldState } from './types/WorldState'
import { Goal }  from './types/Goal'
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
          if (err) {
            reject(err)
          }
          resolve(out)
        })
      })
    },
    variableTypes: async () => Object.keys(Types),
    assignmentOperators: async (_, { variableType }) =>
      Object.keys(
        (Types[variableType] || { assignmentOperators: {} }).assignmentOperators
      ),
    comparisonOperators: async (_, { variableType }) =>
      Object.keys(
        (Types[variableType] || { comparisonOperators: {} }).comparisonOperators
      ),
    createVariable: async (_, input) => {
      const model = new GoapModel(input)
      model.addVariable(input)
      return model.variables[input.id]
    },
    createVariables: async (_, input) => {
      const model = new GoapModel(input)
      for (const x of input.newVariables) {
        model.addVariable(x)
      }
      return input.newVariables.map(x => model.variables[x.id].toGraphQL())
    },
    createTransition: async (_, input) => {
      const model = new GoapModel(input)
      return new Transition({
        ...input,
        variables: model.variables
      }).toGraphQL()
    },
    createTransitions: async (_, input) => {
      const model = new GoapModel(input)
      for (const x of input.newTransitions) {
        model.addTransition(x)
      }
      return input.newTransitions.map(x => model.transitions[x.id].toGraphQL())
    },
    createEffect: async (_, input) => {
      const model = new GoapModel(input)
      return new Effect({ ...input, variables: model.variables }).toGraphQL()
    },
    createCondition: async (_, input) => {
      const model = new GoapModel(input)
      return new Condition({
        ...input,
        variables: model.variables
      }).toGraphQL()
    },
    createVariableValue: async (_, input) => {
      const model = new GoapModel(input)
      return new VariableValue({
        ...input,
        variables: model.variables
      }).toGraphQL()
    },
    flattenGoapModel: async (_, input) => {
      const model = new GoapModel(input)
      const variables = Object.values(model.variables)
      const transitions = Object.values(model.transitions).map(x => ({
        ...x,
        conditions: Object.values(x.conditions).map(y => y.id),
        effects: Object.values(x.effects).map(y => y.id)
      }))
      const conditions = {}
      const effects = {}
      const variableOrValues = {}
      for (const t of Object.values(model.transitions)) {
        for (const c of Object.values(t.conditions)) {
          conditions[c.id] = c.toGraphQL()
          const v = conditions[c.id].argument
          variableOrValues[v.id] = v
        }
        for (const e of Object.values(t.effects)) {
          effects[e.id] = e.toGraphQL()
          const v = effects[e.id].argument
          variableOrValues[v.id] = v
        }
      }
      const initialValues = new WorldState({ variables: model.variables, variableValues: (input.initialValues || []) }).toGraphQL()
      const goals = ( input.goals || []).map( x => new Condition({variables: model.variables, ...x }).toGraphQL()).map(x => ({...x,argument:x.argument.id}))
      return {
        variables,
        transitions,
        conditions: Object.values(conditions).map( x => ({ ...x, argument: x.argument.id }) ),
        effects: Object.values(effects).map( x => ({ ...x, argument: x.argument.id }) ),
        variableOrValues: Object.values(variableOrValues),
        initialValues,
        goals
      }
    },

    createInitialValues: async (_, input) => {
      const model = new GoapModel(input)
      const vs = (input.variableValues || [])
        .filter(x => x != null)
        .map(x => new VariableValue({ ...x, variables: model.variables }))
      const obj = {}
      for (const v of vs) {
        if (obj[v.id]) {
          throw new Error(
            `Duplicate variable ${id}.  Cannot create variable value.`
          )
        }
        obj[v.id] = v
      }
      for (const p of Object.keys(model.variables)) {
        if (obj[p] != null) {
          continue
        }
        obj[p] = new VariableValue({ variables: model.variables, id: p })
      }
      const result = Object.values(obj).map(x => x.toGraphQL())
      return result
    }
  }
}
