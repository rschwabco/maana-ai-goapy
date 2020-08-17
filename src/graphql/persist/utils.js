import { logger, Types } from '../common/types/constants'
import { GoapModel } from '../common/types/GoapModel'
import { Variable } from '../common/types/Variable'
import { Condition } from '../common/types/Condition'
import { VariableValue } from '../common/types/VariableValue'
import { WorldState } from '../common/types/WorldState'
const { v4: uuid } = require('uuid')
import { gql } from 'apollo-server-express'
import { initAuthenticatedClient } from '../../client'
import { CKG_ENDPOINT_URL } from '../../constants'

/** A helper founction for creating an ID for a condition, goal, variable or effect */
function mkId(x) {
  const ifnotnull = (x, f) => (x == null ? null : f(x))
  if (x.argument) {
    return `${x.variableId}${x.assignmentOperator ||
      x.comparisonOperator}${mkId(x.argument)}`
  } else {
    return `${x.variableId ||
      ifnotnull(x.STRING, z => `"${z}"`) ||
      ifnotnull(x.INT, z => `${z}`) ||
      ifnotnull(x.BOOLEAN, z => `${z}`) ||
      ifnotnull(x.FLOAT, z => `${z}`)}`
  }
}

/** Given a possibly incomplete GOAP problem statement, flatten
 * all the data structures and return a GoapProblem containing
 * flattened data structures suitable for use with the Maana Q
 * CRUD operators.
 * @param model - The goap model to flatten.
 * @return an object with collections of flattened objects that 
 *   can be written to a workspace's store
 * @throws graphQL errors when any of the provided data is ill formed.
 */
function flattenGoapModel(input) {
  const model = new GoapModel({id: input.workspaceId, ...input})
  const variables = Object.values(model.variables)
  // Iterate over the transitions, replacing conditions and effects
  // with their identifiers.
  const transitions = Object.values(model.transitions).map(x => ({ 
    id: x.id,
    description: x.description,
    action: x.action,
    cost: x.cost,
    conditions: Object.values(x.conditions).map(y => y.id),
    effects: Object.values(x.effects).map(y => y.id)
  }))
  // Iterate over the trasitions, aggregating the conditions, effects
  // and variable values.   Each condition, effect and variable value
  // will be added to a map, labeled by their id to ensure uniqueness.
  const conditions = {}
  const effects = {}
  const variableOrValues = {}
  for (const t of Object.values(model.transitions)) {
    for (const x of Object.values(t.conditions)) {
      // Append each condition of the current transition to the
      // map.   Append each condition's argument to the
      // variable or values map.

      const z = x.toGraphQL()
      conditions[z.id] = z
      const v = { ...z.argument, id: mkId(z.argument) }
      variableOrValues[v.id] = v
      z.argument = v.id
    }
    for (const x of Object.values(t.effects)) {
      // Append each effect of the current transition to the
      // map.   Append each effect's argument to the
      // variable or values map.
      const z = x.toGraphQL()
      effects[z.id] = z
      const v = { ...z.argument, id: mkId(z.argument) }
      variableOrValues[v.id] = v
      z.argument = v.id
    }
  }
  // convert any provided initial values to a worldstate object.  This will ensure that
  // they are well formed and distinct.
  const initialValues = new WorldState({
    variables: model.variables,
    variableValues: input.initialValues || []
  }).toGraphQL()
  // Construct each of the goals.  The use of the Goals constructor ensures that the are
  // well formed.
  const goals = (input.goals || []).map(x => {
    const z = new Condition({ ...x, variables: model.variables }).toGraphQL()
    const v = { ...z.argument, id: mkId(z.argument) }
    variableOrValues[v.id] = v
    z.argument = v.id
    return z
  })
  return {
    id: `{${transitions.map(x => x.id).join(',')}}`,
    variables,
    transitions,
    conditions: Object.values(conditions),
    effects: Object.values(effects),
    variableOrValues: Object.values(variableOrValues),
    initialValues,
    goals
  }
}

/** given a collection of objects which have ids, return
 * a list where the entries have distinct ids by removing
 * keeping the first entry for any given identifier.
 */
function distinct(xs) {
  return Object.values(Object.fromEntries(xs.reverse().map(x => [x.id, x])))
}


const expectedSchema = {
  Effect: ['id', 'variableId', 'assignmentOperator', 'argument'],
  VariableOrValue: ['id', 'variableId', 'STRING', 'FLOAT', 'INT', 'BOOLEAN'],
  Transition: ['id', 'description', 'conditions', 'action', 'effects', 'cost'],
  Condition: ['id', 'variableId', 'comparisonOperator', 'argument'],
  Variable: ['id', 'description', 'typeOf', 'weight'],
  Goal: ['id', 'variableId', 'comparisonOperator', 'argument'],
  InitialValue: ['id', 'STRING', 'FLOAT', 'INT', 'BOOLEAN'],
  ActionPlan: [
    'id',
    'actions',
    'transitions',
    'totalSteps',
    'totalCost',
    'initialState',
    'finalState',
    'status'
  ],
  VariableValue: ['id', 'STRING', 'FLOAT', 'INT', 'BOOLEAN'],
  Scenario: ['id', 'description', 'behavior', 'initialValues', 'goals'],
  Behavior: ['id', 'description', 'transitions']
}
async function isGoapWorkspace(input) {
  const { workspaceId: id } = input
  const uri = `${CKG_ENDPOINT_URL}/service/${id}/graphql`
  const svc = await initAuthenticatedClient(uri)
  const query = gql('query { __schema{ types{ name fields{ name }}}}')
  const result = await svc.query({ query })
  const schema = Object.fromEntries(
    result.data.__schema.types.map(({ name, fields }) => [
      name,
      (fields || []).map(({ name }) => name)
    ])
  )
  const isValid = Object.entries(expectedSchema).every(
    ([type, fields]) =>
      schema[type] != null && fields.every(name => schema[type].includes(name))
  )
  return isValid
}

module.exports = {
  variableTypes: async () => Object.keys(Types),
  assignmentOperators: ({ variableType }) =>
    Object.keys(
      (Types[variableType] || { assignmentOperators: {} }).assignmentOperators
    ),
  comparisonOperators: async (_, { variableType }) =>
    Object.keys(
      (Types[variableType] || { comparisonOperators: {} }).comparisonOperators
    ),
  flattenGoapModel: async (_, input) => flattenGoapModel(input),
  isGoapWorkspace: async (_, input, ctxt) => isGoapWorkspace(input, ctxt)
}
