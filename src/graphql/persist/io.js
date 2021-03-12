import { persistlogger, logger } from '../common/types/constants'
import { gql } from 'apollo-server-express'
import { CKG_ENDPOINT_URL } from '../../constants'
import { initAuthenticatedClient } from '../../client'

export function workspaceUri(id) {
  return `${CKG_ENDPOINT_URL}/service/${id}/graphql`
}

export async function getService(input) {
  if (input.svc != null) {
    return input.svc
  }
  return initAuthenticatedClient(workspaceUri(input.workspaceId))
}

export const Fragments = {}
Fragments.VariableValue = 'id STRING FLOAT INT BOOLEAN'
Fragments.Behavior = 'id description transitions'
Fragments.VariableOrValue = 'id variableId STRING FLOAT INT BOOLEAN'
Fragments.Condition = `id variableId comparisonOperator argument{ ${Fragments.VariableOrValue} }`
Fragments.Effect = `id variableId assignmentOperator argument{ ${Fragments.VariableOrValue}}`
Fragments.Goal = `id variableId comparisonOperator argument{ ${Fragments.VariableOrValue}}`
Fragments.InitialValue = 'id variableId STRING FLOAT INT BOOLEAN'
Fragments.Scenario = `id behavior initialValues{ ${Fragments.VariableValue} } goals{ ${Fragments.Goal}}`
Fragments.Transition = `id description conditions{ ${Fragments.Condition} } action effects{ ${Fragments.Effect} } cost`
Fragments.Variable = 'id description typeOf weight'

export const queries = {
  behaviors: gql(
    `query SOME( $INPUT: [ID!]!){ behaviors( ids: $INPUT ){ ${Fragments.Behavior} }}`
  ),
  conditions: gql(
    `query SOME( $INPUT: [ID!]!){ conditions( ids: $INPUT ){ ${Fragments.Condition} }}`
  ),
  effects: gql(
    `query SOME( $INPUT: [ID!]!){ effects( ids: $INPUT ){ ${Fragments.Effect} }}`
  ),
  goals: gql(
    `query SOME( $INPUT: [ID!]!){ goals( ids: $INPUT ){ ${Fragments.Goal} }}`
  ),
  initalValues: gql(
    `query SOME( $INPUT: [ID!]!){ initialValues( ids: $INPUT ){ ${Fragments.InitialValues} }}`
  ),
  scenarios: gql(
    `query SOME( $INPUT: [ID!]!){ scenarios( ids: $INPUT ){ ${Fragments.Scenario} }}`
  ),
  transitions: gql(
    `query SOME( $INPUT: [ID!]!){ transitions( ids: $INPUT ){ ${Fragments.Transition} }}`
  ),
  variables: gql(
    `query SOME( $INPUT: [ID!]!){ variables( ids: $INPUT ){ ${Fragments.variables} }}`
  ),
  variableValues: gql(
    `query SOME( $INPUT: [ID!]!){ variableValues( ids: $INPUT ){ ${Fragments.variableValues} }}`
  ),
  variableOrValues: gql(
    `query SOME( $INPUT: [ID!]!){ variableOrValues( ids: $INPUT ){ ${Fragments.variableOrValues} }}`
  ),
  allBehaviors: gql(`query { allBehaviors{ ${Fragments.Behavior} }}`),
  allConditions: gql(`query { allConditions{${Fragments.Condition} }}`),
  allEffects: gql(`query { allEffects{ ${Fragments.Effect} }}`),
  allGoals: gql(`query { allGoals{ ${Fragments.Goal} }}`),
  allInitialValues: gql(
    `query { allInitialValues{ ${Fragments.InitialValue} }}`
  ),
  allScenarios: gql(`query { allScenarios{ ${Fragments.Scenario} }}`),
  allTransitions: gql(`query { allTransitions{ ${Fragments.Transition} }}`),
  allVariables: gql(`query { allVariables{ ${Fragments.Variable} }}`),
  allVariableValues: gql(
    `query { allVariableValues{ ${Fragments.VariableValue} }}`
  ),
  allVariableOrValues: gql(
    `query { allVariableOrValues{ ${Fragments.VariableOrValue} }}`
  )
}

export const mutations = {
  addBehaviors: gql(
    `mutation ADD( $INPUT: [AddBehaviorInput!]!){ addBehaviors( input: $INPUT )}`
  ),
  addConditions: gql(
    `mutation ADD( $INPUT: [AddConditionInput!]!){ addConditions( input:$INPUT) }`
  ),
  addEffects: gql(
    `mutation ADD( $INPUT: [AddEffectInput!]!){ addEffects( input:$INPUT) }`
  ),
  addGoals: gql(
    `mutation ADD( $INPUT: [AddGoalInput!]!){ addGoals( input:$INPUT) }`
  ),
  addInitialValues: gql(
    `mutation ADD( $INPUT: [AddInitialValueInput!]!){ addInitialValues( input:$INPUT) }`
  ),
  addScenarios: gql(
    `mutation ADD( $INPUT: [AddScenarioInput!]!){ addScenarios( input: $INPUT )}`
  ),
  addTransitions: gql(
    `mutation ADD( $INPUT: [AddTransitionInput!]!){ addTransitions( input:$INPUT) }`
  ),
  addVariables: gql(
    `mutation ADD( $INPUT: [AddVariableInput!]!){ addVariables( input:$INPUT) }`
  ),
  addVariableOrValues: gql(
    `mutation ADD( $INPUT: [AddVariableOrValueInput!]!){ addVariableOrValues( input:$INPUT) }`
  ),
  addVariableValues: gql(
    `mutation ADD( $INPUT: [AddVariableValueInput!]!){ addVariableValues( input:$INPUT) }`
  ),
  deleteBehaviors: gql(
    'mutation DEL( $INPUT: [ID!]!){ deleteBehaviors( ids:$INPUT){id} }'
  ),
  deleteConditions: gql(
    'mutation DEL( $INPUT: [ID!]!){ deleteConditions( ids:$INPUT){id} }'
  ),
  deleteGoals: gql(
    'mutation DEL( $INPUT: [ID!]!){ deleteGoals( ids:$INPUT){id} }'
  ),
  deleteEffects: gql(
    'mutation DEL( $INPUT: [ID!]!){ deleteEffects( ids:$INPUT){id} }'
  ),
  deleteInitialValues: gql(
    `mutation DEL( $INPUT: [ID!]!){ deleteInitialValues( ids:$INPUT){id} }`
  ),
  deleteScenarios: gql(
    'mutation DEL( $INPUT: [ID!]!){ deleteScenarios( ids:$INPUT){id} }'
  ),
  deleteTransitions: gql(
    'mutation DEL( $INPUT: [ID!]!){ deleteTransitions( ids:$INPUT){id} }'
  ),
  deleteVariables: gql(
    `mutation DEL( $INPUT: [ID!]!){ deleteVariables( ids:$INPUT){id} }`
  ),
  deleteVariableOrValues: gql(
    `mutation DEL( $INPUT: [ID!]!){ deleteVariableOrValues( ids:$INPUT){id} }`
  ),
  deleteVariableValues: gql(
    `mutation DEL( $INPUT: [ID!]!){ deleteVariableValues( ids:$INPUT){id} }`
  )
}

export async function runQuery(name, svc, variables) {
  const result = await svc.query({ query: queries[name], variables })
  if (result && result.data && result.data[name]) {
    return result.data[name]
  } else {
    const msg = `call to ${name} failed. ${result.errors[0].message}`
    persistlogger.error(msg)
    throw new Error(msg)
  }
}

export async function allInstances(name, input) {
  const svc = await getService(input)
  return runQuery(name, svc)
}

export async function runMutation(name, svc, variables) {
  const throwErr = reason => {
    const msg = `call to ${name} failed. ${reason}`
    persistlogger.error(msg)
    throw new Error(msg)
  }
  try {
    const { data, errors } = await svc.mutate({
      mutation: mutations[name],
      variables
    })
    if (data && data[name]) {
      return data[name]
    } else {
      throwErr(errors[0].message)
    }
  } catch (e) {
    throwErr(e.message)
  }
}

export async function addInstances(name, input, variables) {
  if (variables.INPUT && variables.INPUT.length > 0) {
    const svc = await getService(input)
    try {
      const result = await runMutation(name, svc, variables)
      return result
    } catch (e) {
      throw new Error(e.message)
    }
  } else {
    return []
  }
}

export async function someInstances(name, input, variables) {
  const svc = await getService(input)
  try {
    const result = await runQuery(name, svc, variables)
    return result
  } catch (e) {
    throw new Error(e.message)
  }
}




export async function deleteInstances(name, input, ids) {
  if (ids.INPUT && ids.INPUT.length > 0) {
    const svc = await getService(input)
    try {
      const result = await runMutation(name, svc, ids)
      return result
    } catch (e) {
      throw new Error(e.message)
    }
  } else {
    return []
  }
}
