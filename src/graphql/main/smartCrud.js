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

/** Smart constructor for single instances of the Variable type. */
function createVariable(input) {
  const model = new GoapModel(input)
  model.addVariable(input)
  return model.variables[input.id]
}

/** Smart constructor for multiple instances of the Variable type. */
function createVariables ( input) {
  const model = new GoapModel(input)
  for (const x of input.newVariables) {
  model.addVariable(x)
  }
  return input.newVariables.map(x => model.variables[x.id].toGraphQL())
}

/** Smart constructor for single instances of the Transition type. */
function createTransition ( input)  {
    const model = new GoapModel(input)
    return new Transition({
    ...input,
    variables: model.variables
    }).toGraphQL()
}

/** Smart constructor for multiple instances of the Transition type. */
function createTransitions ( input) {
    const model = new GoapModel(input)
    for (const x of input.newTransitions) {
    model.addTransition(x)
    }
    return input.newTransitions.map(x => model.transitions[x.id].toGraphQL())
}

/** Smart constructor for instances of the Effect type. */
function createEffect ( input)  {
    const model = new GoapModel(input)
    return new Effect({ ...input, variables: model.variables }).toGraphQL()
}

/** Smart constructor for instances of the Condition type. */
function createCondition ( input) {
    const model = new GoapModel(input)
    return new Condition({
    ...input,
    variables: model.variables
    }).toGraphQL()
}

/** Smart constructor for instances of the VariableValue type. */
function createVariableValue( input) {
    const model = new GoapModel(input)
    return new VariableValue({
    ...input,
    variables: model.variables
    }).toGraphQL()
}

/** Given a possibly incomplete GOAP problem statement, flatten 
    * all the data structures and return a GoapProblem containing 
    * flattened data structures suitable for use with the Maana Q
    * CRUD operators.
    * @param variables - (REQUIRED) The list of all the GOAP state
    *   variables in the model.
    * @param transitions - (OPTIONAL) The list of transitions in the
    *   goap model
    * @param initialValues - (OPTIONAL) A list of initial values for
    *   zero or more of the GOAP state variables
    * @param goals - (OPTIONAL) A list of conditions that must be met
    *   by the final state of the goap plan.
    * @throws graphQL errors when any of the provided data is ill formed.
    */
function flattenGoapModel( input) {
    // Construct a Goap model from the input.  This will check the 
    // well formedness of the variables and transitions.
    const model = new GoapModel(input)
    const variables = Object.values(model.variables)
    // Iterate over the transitions, replacing conditions and effects
    // with their identifiers.
    const transitions = Object.values(model.transitions).map(x => ({
    ...x,
    conditions: Object.values(x.conditions).map(y => y.id),
    effects: Object.values(x.effects).map(y => y.id    )
    }))
    // Iterate over the trasitions, aggregating the conditions, effects
    // and variable values.   Each condition, effect and variable value
    // will be added to a map, labeled by their id to ensure uniqueness.
    const conditions = {}
    const effects = {}
    const variableOrValues = {}
    for (const t of Object.values(model.transitions)) {
    for (const c of Object.values(t.conditions)) {
        // Append each condition of the current transition to the
        // map.   Append each condition's argument to the
        // variable or values map.
        conditions[c.id] = c.toGraphQL()
        const v = conditions[c.id].argument
        variableOrValues[v.id] = v
    }
    for (const e of Object.values(t.effects)) {
        // Append each effect of the current transition to the
        // map.   Append each effect's argument to the
        // variable or values map.
        effects[e.id] = e.toGraphQL()
        const v = effects[e.id].argument
        variableOrValues[v.id] = v
    }
    }
    // convert any provided initial values to a worldstate object.  This will ensure that 
    // they are well formed and distinct.
    const initialValues = new WorldState({
    variables: model.variables,
    variableValues: (input.initialValues || []) 
    }).toGraphQL()
    // Construct each of the goals.  The use of the Goals constructor ensures that the are
    // well formed.
    const goals = (input.goals || [])
    .map(x =>
        new Condition({
        variables: model.variables,
        ...x
        }).toGraphQL()
    )
    .map(x => ({
        ...x,
        argument: x.argument.id
    }))
    return {
    id: `{${transitions.map(x => x.id).join(",")}}`,
    variables,
    transitions,
    conditions: Object.values(conditions).map( x => ({ ...x, argument: x.argument.id }) ),
    effects: Object.values(effects).map( x => ({ ...x, argument: x.argument.id }) ),
    variableOrValues: Object.values(variableOrValues),
    initialValues,
    goals
    }
}

/** smart constructor for an inital value */
function createInitialValue( input) {
    const model = new GoapModel(input)
    return new VariableValue({...input, variables: model.variables }).toGraphQL()
}

/** Given a possibly incomplete collection of initial values, verify that the
    * given values are well formed, and then returns those values and default 
    * values for any variables that were included in the original set.
    * @param input.variable - The complete set of variables in the goap model 
    * @param input.variableValues - The possibly null, empty or incomplete 
    *   list of initial values
    * @returns A exactly one initial value for each variable in the GOAP model.
    *   For variables where no value is explicitly provided, then the default 
    *   value for the appropriate datatype will be used instead.
    */

function createInitialValues( input) {
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

/*** Given a goap problem, update the name of one the variables
 * @param input.variables - the state variables of the GOAP model
*  @param input.transitions - the transitions of the GOAP model
 * @param input.initialValues - the initial values
 * @param input.goals - the conditions that must be met by the action plan
 * @param input.id - the identifier of the variable being renamed
 * @param input.newId - the new identifier for the variable
 * @returns a GOAP problem structure suitable for use with the Q
 *   CRUD operations
 * NOTE: This function may throw an error if the variable does not
 * exist, the new name would conflict with an existing variable.
 */
function updateVariableName(input) {
  // Construct a model from the variables and transitions.   This ensures
  // that they are well-formed and in normal form.
  const model = new GoapModel(input)
  // deconstruct the input
  const { id, newId } = input 
  // This function is used to make error handling within this funciton 
  // more consistent.  It will log the error, with the provided reason
  // and then throw an error with the same message.
  const throwErr = reason => {
    const msg = `Cannot rename variable. ${reason}`
    logger.error(msg)
    throw new Error(msg)
  }
  // Sanity check the inputs.
  if (!model.variables[id]) throwErr(`The variable "${id}" does not exist`)
  if (id === newId) throwErr(`The new and old names are identical`)
  if (model.variables[newId]) throwErr(`The variable "${newId}" already exists`)

  //If we made it here, then the model is well formed.   Rename the 
  //variable by adding a new variable with the given ID and then 
  //deleting the old variable.
  model.addVariable({ ...model.variables[id], id: newId })
  delete model.variables[id]
  
  // A helper function for performing the updates to the conditions, 
  // goals, inital values and effects.
  const update = x => {
    if (x.id === id ) x.id = newId 
    if (x.variableId === id ) x.variableId = newId
    if (x.argument && x.argument.variableId === id) x.argument.variableId = newId
    return x 
  }

  //Update the variable references that occur in the transitions.
  //Variables may occur in both the effects and conditions, 
  //either on the left hand side of the operation, or as an
  //argument on the right hand side. 
  const transitions = model.toGraphQL().transitions.map(t => {
    const conditions = t.conditions.map( x=> update(x) )
    const effects = t.effects.map( x => update(x))
    return {...t, conditions, effects}
  })
  // update the initial values
  const initialValues = (input.initialValues || [] ).map( x=> update(x))
  // update the goals.
  const goals = ( input.goals || [] ).map( x=> update(x))
  // finally, call flattenGoapModel.   This ensures that everything 
  // is in normal form and correctly indexed.
  return flattenGoapModel({variables: Object.values(model.variables), transitions, initialValues, goals})
}

/*** Given a goap problem, update the type of one the variables
 * @param input.variables - the state variables of the GOAP model
*  @param input.transitions - the transitions of the GOAP model
 * @param input.initialValues - the initial values
 * @param input.goals - the conditions that must be met by the action plan
 * @param input.id - the identifier of the variable being renamed
 * @param input.typeOf - the new type for the variable
 * @returns a GOAP problem structure suitable for use with the Q
 *   CRUD operations
 * NOTE: This function may throw an error if the variable does not
 * exist, the type does not exist, or if the new and old types are 
 * the same.  Where the variable occurs in the left hand side of an
 * assignment or operation, the right hand side will be replaced 
 * with a default value.   When the variable occurs on the right 
 * hand side of an assignment or comparison, it will be replaced
 * with the default value for the type of the variable on the left.
 */
function updateVariableType(input) {
  // Construct a model from the variables and transitions.   This ensures
  // that they are well-formed and in normal form.
  const model = new GoapModel(input)
  // destructure the input
  const { id, typeOf } = input 
  // This function is used to make error handling within this funciton 
  // more consistent.  It will log the error, with the provided reason
  // and then throw an error with the same message.
  const throwErr = reason => {
    const msg = `Cannot update type of ${input.id}. ${reason}`
    logger.error(msg)
    throw new Error(msg)
  }
  const v = model.variables[id]
  // sanity check the inputs
  if (!v) throwErr(`The variable "${id}" does not exist`)
  if (!Types[typeOf]) throwErr(`The type "${typeOf} does not exist`)
  if (v.typeOf === typeOf) throwErr(`The new and old types are the same`)
  // If we got here, it is safe to change the type of the variable.
  // we store the default value and the old type for use in the 
  // downstream transformations.
  const oldType = v.typeOf
  v.typeOf = typeOf
  const newValue = Types[typeOf].defaultValue
  // this helper function is used to transform the uses of the 
  // variable in assignments, goals, conditions and initial values
  // so that they are type consistent.
  const update = x => {
      // if the variable occurs on the left hand side of an 
      // operator, replace the right hand side of the argument
      // with the default value of the new type.
      if (x.id === id || x.variableId === id ) {
        if (x.argument !=null ) {
            delete x.argument[oldType]
            delete x.argument.variableId
            x.argument[typeOf] = newValue
        } else { 
            x[typeOf] = newValue
        }
      // if it occurs on the right hand side of an operation,
      // replace the variable reference with the default value
      // for the variable on the left.  
      } else if (x.argument && x.argument.variableId === id) {
        delete x.argument.variableId
        x.argument[oldType] = Types[oldType].defaultValue
      }
      return x
  }

  //Update the variables that occur in the transitions.
  //Variables may occur in both the effects and conditions, 
  //either on the left hand side of the operation, or as an
  //argument on the right hand side. 
  const transitions = model.toGraphQL().transitions.map(t => {
    const conditions = t.conditions.map( x => update(x) )
    const effects = t.effects.map( x => update(x) )
    return {...t, conditions, effects}
  })
  // update the initial values
  const initialValues = (input.initialValues || [] ).map( x => update(x) )
  // update the goals
  const goals = (input.goals || [] ).map( x => update(x))
  // finally, call flattenGoapModel.   This ensures that everything 
  // is in normal form and correctly indexed.
  return flattenGoapModel({variables: Object.values(model.variables), transitions, initialValues, goals})
}

/*** Given a goap problem, delete a variable.  Replace all references
 * to that variable on with the default value for that variable's 
 * type.
 * @param input.variables - the state variables of the GOAP model
*  @param input.transitions - the transitions of the GOAP model
 * @param input.initialValues - the initial values
 * @param input.goals - the conditions that must be met by the action plan
 * @param input.id - the identifier of the variable being removed
 * @returns a GOAP problem structure suitable for use with the Q
 *   CRUD operations
 * Where the variable occurs in the left hand side of an
 * assignment or operation, then the assignment or operation will
 * be removed.   When the variable occurs on the right 
 * hand side of an assignment or comparison, it will be replaced
 * with the default value for the type of the variable on the left.
 */
function removeVariable(input) {
  // Construct a model from the variables and transitions.   This ensures
  // that they are well-formed and in normal form.
  const model = new GoapModel(input)
  const gqlModel = model.toGraphQL()
  // destructure the input
  const { id } = input 
  const v = model.variables[id]
  // If the variable doesn't exist, then we can return the original
  // goap problem.
  if (!v) return flattenGoapModel(input)
  // If we reached here, then the variable exists and needs to be
  // removed.

  const variables = gqlModel.variables.filter( x => x.id !== id )
  // this helper function is used to transform the uses of the 
  // variable in assignments, goals, conditions and initial values
  // so that they are type consistent.
  const update = xs => xs.filter( x=> x.id !== id && x.variableId !== id )
    .map( x => {
      if (x.argument && x.argument.variableId === id) {
        delete x.argument.variableId
        x.argument[v.typeOf] = Types[v.typeOf].defaultValue
      }
      return x
  })

  //Update the variables that occur in the transitions.
  //Variables may occur in both the effects and conditions, 
  //either on the left hand side of the operation, or as an
  //argument on the right hand side. 
  const transitions = gqlModel.transitions.map(t => {
    const conditions = update(t.conditions)
    const effects = update(t.effects)
    return {...t, conditions, effects}
  })
  // update the initial values
  const initialValues = update(input.initialValues || [] )
  // update the goals
  const goals = update(input.goals || [] )
  // finally, call flattenGoapModel.   This ensures that everything 
  // is in normal form and correctly indexed.
  return flattenGoapModel({variables, transitions, initialValues, goals})
}

/** Given a goap problem description, return a goap problem containing 
 * all the objects that can be safely removed from the problem without   
 * changing the behavior
  */
function findUnusedInstances(input) {
  const model = new GoapModel({variables: input.variables })
  const variables = model.variables
  const transitions = model.transitions
  const illformedConditions = []
  const illformedEffects = []
  const mkId = x => `${x.variableId}${x.assignmentOperator||x.comparisonOperator}${x.argument.variableId||`"${x.argument.STRING}"`||x.argument.INT||x.argument.BOOLEAN||x.argument.FLOAT}`
  for (const t of input.transitions ) {
      model.addTransition({...t, conditions:[], effects:[]})
      for (const x of t.conditions) {
        try { model.transitions[t.id].addCondition({...x, variables}) } 
        catch (_) { 
            illformedConditions.push({...x,id:x.id?x.id:mkId(x),})
            logger.warn(`Condition ${x.id} it is ill-formed`)}
      } 
      for (const x of t.effects) {
        try { model.transitions[t.id].addEffect({...x, variables}) } 
        catch (_) { 
            illformedEffects.push({...x,id:x.id?x.id:mkId(x)})
            logger.warn(`Effects ${x.id} it is ill-formed`)}
      }
  }
  const illformedGoals = []
  const goals = []
  for (const g of input.goals) {
      try{ goals.push( new Condition({variables, ...g}).toGraphQL())} 
      catch (_) { 
          illformedGoals.push({...g,id:g.id?g.id:mkId(g),})
          logger.warn(`goal ${g.id} it is ill-formed`)
        }
  }
  const illformedInitialValues = []
  const initialValues = []
  for (const v of input.initialValues ) {
      try{ initialValues.push(new VariableValue({ variables, ...v}).toGraphQL())} 
      catch (_) { 
          illformedInitialValues.push(v)
          logger.warn(`initial condition ${x.id} is ill-formed`)}
  }
  const gqlModel = model.toGraphQL()
  const usedObjects = flattenGoapModel( { variables: gqlModel.variables, transitions: gqlModel.transitions, goals, initialValues })
  const usedConditionIds = usedObjects.conditions.map( x => x.id)
  const usedEffectIds = usedObjects.effects.map( x => x.id)
  const usedVariableOrValueIds = usedObjects.variableOrValues.map( x => x.id)
  
  
  const unusedConditions = (input.conditions||[]).map( x => ({...x, id:x.id? x.id: mkId(x), argument: x.argument.id})).filter( x => !usedConditionIds.includes(x.id) )
  const unusedEffects = (input.effects||[]).map( x => ({...x, id:x.id? x.id: mkId(x), argument: x.argument.id})).filter( x => !usedEffectIds.includes(x.id) )
  const unusedVariableOrValues = (input.variableOrValues || []).map( x => ({...x,id: x.id? x.id : `${x.variableId||`"${x.STRING}"`||x.INT||x.BOOLEAN||x.FLOAT}`})).filter( x => !usedVariableOrValueIds.includes(x.id))
  

  console.log(usedVariableOrValueIds)
  return {
    variables:[],
    transitions: [],
    conditions: illformedConditions.concat(unusedConditions),
    effects: illformedEffects.concat(unusedEffects).map( x => ({...x, argument: x.argument.id})),
    goals: illformedGoals.map( x => ({...x,argument: x.argument.id})),
    initialValues: illformedInitialValues,
    variableOrValues: unusedVariableOrValues
  }
}  

module.exports = { 
    variableTypes: async () => Object.keys(Types),
    assignmentOperators: ( { variableType }) =>
      Object.keys(
        (Types[variableType] || { assignmentOperators: {} }).assignmentOperators
      ),
    comparisonOperators: async (_,  { variableType }) =>
      Object.keys(
        (Types[variableType] || { comparisonOperators: {} }).comparisonOperators
      ),
    createVariable: async (_, input) => createVariable(input),
    createVariables: async (_, input) => createVariables(input),
    createTransition: async (_, input) => createTransition(input),
    createTransitions: async (_, input) => createTransitions(input),
    createCondition: async (_, input) => createCondition(input),
    createEffect: async (_, input) => createEffect(input),
    createInitialValue: async (_, input) => createInitialValue(input),
    createInitialValues: async (_, input) => createInitialValues(input),
    flattenGoapModel: async (_, input) => flattenGoapModel(input),
    updateVariableName: async (_, input) => updateVariableName(input),
    updateVariableType: async (_, input) => updateVariableType(input),
    removeVariable: async (_, input) => removeVariable(input),
    findUnusedInstances: async (_, input) => findUnusedInstances(input)
}

