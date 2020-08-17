import { persistlogger, Types } from '../common/types/constants'
import { getService, allInstances } from './io'
import { persist } from './persist'
const logger = persistlogger

/** * Given a goap problem, update the name of one the variables
 * @param input.workspaceId - the state variables of the GOAP model
 *  @param input.oldId - the old identifier for the variable
 * @param input.newId - the new identifier for the variable
  * @returns A boolean variable which is true if and only if the 
  *   variable name has been updated.
 */
async function renameVariable(args) {
  const { oldId, workspaceId, newId } = args
  if (oldId === newId) {
    logger.warn(`The new id and old id are the same.  Aborting rename of variable in workspace ${workspaceId}`)
    return true
  }

  const svc = await getService(args)
  // read in the existing model
  const variables = await allInstances('allVariables',{ svc })
  const oldVs = variables.filter( x => x.id === oldId )
  const newVs = variables.filter( x => x.id === newId )
  // if the variable does not exist, then there is no work to do.   Exit.
  if (oldVs.length === 0) {
    logger.warn(`Variable ${oldId} does not exist in ${workspaceId}.  Aborting renameVariable.`)
    return true
  }
  if (newVs.length !== 0) {
    const msg = `Variable ${newId} already exists in ${workspaceId}.`
    logger.error(msg)
    throw new Error(msg)
  }
  
  const transitions = await allInstances('allTransitions',{ svc })
  const goals = await allInstances('allGoals',{ svc })
  const initialValues = await allInstances('allInitialValues',{ svc })

  const replaceVarId = x => { 
    if (x.variableId === oldId ) x.variableId = newId
  }
  const replaceArg = x => replaceVarId(x.argument)
  for (const x of variables )  { 
    if (x.id === oldId ) x.id = newId
  }
  for (const t of transitions) {
    for( const x of t.conditions ) {
      replaceVarId(x)
      replaceArg(x)
    }
    for( const x of t.effects ) {
      replaceVarId(x)
      replaceArg(x)
    }
  }
  for (const x of goals) {
    replaceVarId(x)
    replaceArg(x)
  }
  for (const x of initialValues) replaceVarId(x)
  await persist( null , {variables, transitions,goals,initialValues,svc,workspaceId})
  logger.info(`Renamed variable ${oldId} to ${newId} in workspace ${workspaceId}`)
  return true
}



/** * Given a goap problem, update the type of one the variables
 * @param input.workspaceId - the state variables of the GOAP model
 *  @param input.id - the identifier for the variable
 * @param input.typeOf - the new type for the variable
  * @returns A boolean variable which is true if and only if the 
  *   variable type has been updated.
 */
async function retypeVariable(args) {
  const { id, workspaceId, typeOf } = args
  if ( !Object.keys(Types).includes(typeOf)) {
    const msg = `Cannot retype Variable ${id} in ${workspaceId}.   ${typeOf} is not a valid type`
    logger.error(msg)
    throw new Error(msg)
  }
  const svc = await getService(args)
  // read in the existing model
  const variables = await allInstances('allVariables',{ svc })
  const oldVs = variables.filter( x => x.id === id )
  // if the variable does not exist, then there is no work to do.   Exit.
  if (oldVs.length === 0) {
    logger.warn(`Variable ${id} does not exist in ${workspaceId}.  Aborting retypeVariable.`)
    return true
  }
  if (oldVs[0].typeOf === typeOf ) {
    logger.warn(`Variable ${id} in ${workspaceId} is already of type ${typeOf}.  Aborting retypeVariable.`)
    return true
  }
  const oldType = oldVs[0].typeOf
  const itsValue = Types[typeOf].defaultValue
  const oldValue = Types[oldType].defaultValue
  const transitions = await allInstances('allTransitions',{ svc })
  const goals = await allInstances('allGoals',{ svc })
  const initialValues = await allInstances('allInitialValues',{ svc })

  const update = (x,op) => {
    if (x.variableId === id ) {
      if (x.operator) x.operator = op 
      x.argument[typeOf] = itsValue
      x.argument[oldType] = null
      x.argument.variableId = null
    }
    if (x.argument && x.argument.variableId === id ) {
      x.argument.variableId = null
      x.argument[oldType] = oldValue
    }
  }

  for (const x of variables )  {
    if (x.id === id ) x.typeOf = typeOf
  }
  for (const t of transitions) {
    for( const x of t.conditions ) {
      update(x,"==")
    }
    for( const x of t.effects ) {
      update(x,"=")
    }
  }
  for (const x of goals) {
    update(x,"==")
  }
  for (const x of initialValues) {
    if (x.variableId === id ) {
      x[typeOf] = itsValue
      x[oldType] = null
    }
  }
  await persist( null , {variables, transitions,goals,initialValues,svc,workspaceId})
  logger.info(`Retyped variable ${id} to ${typeOf} in workspace ${workspaceId}`)
  return true
}

module.exports = {
  renameVariable: async (_, input) => renameVariable(input),
  retypeVariable: async (_, input) => retypeVariable(input)
}
