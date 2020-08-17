import { getService, allInstances, deleteInstances } from './io'
import { persist } from './persist'
import { Types, persistlogger } from '../common/types/constants'
const logger = persistlogger

/** Given a workspace identifier and an identifier,
 * remove the instance from the workspace.
 * @param args.workspaceId - the workspace from which the instance
 *   will be removed
 * @param args.id - the identifier of the instance to remove
 * @param name - the name of the delete query to run
 * @return - A boolean value which is true if and only if the 
 *   deletion is successful.
 */
async function removeOne(name, args) {
  try {
    const svc = await getService(args)
    await deleteInstances(name, { svc }, { INPUT: [args.id] })
    return true
  } catch (e) {
    return false
  }
}

/** Given a workspace identifier and an identifier for a variable,
 * remove the instance from the workspace.  If the variable occurs
 * in initial values, or on the right hand side of a goal or condition,
 * then delete those instances as well.   If it occurs on the right
 * hand side of a goal or condition then replace the reference with
 * the default value for that variable's type.
 * @param args.workspaceId - the workspace from which the instance
 *   will be removed
 * @param args.id - the identifier of the instance to remove
 * @param name - the name of the delete query to run
 * @return - A boolean value which is true if and only if the
 *   deletion is successful.
 */
async function removeVariable(args) {
  // Construct a model from the variables and transitions.   This ensures
  // that they are well-formed and in normal form.
  const { id, workspaceId } = args
  const svc = await getService(args)
  // read in the existing model
  const allVS = await allInstances('allVariables',{ svc })
  const its = allVS.filter( x => x.id === id )
  // if the variable does not exist, then there is no work to do.   Exit.
  if (its.length === 0) {
    logger.warn(`Variable ${id} does not exist in ${workspaceId}.  Aborting removeVariable.`)
    return true
  }
  //Otherwise, if it does exist, then we need to remove all references 
  //to it.
  const it = its[0]
  const itsType = it.typeOf
  const itsValue = Types[itsType].defaultValue

  const variables = allVS.filter( x => x.id !== id)

  const transitions = await allInstances('allTransitions',{ svc })
  const allGS = await allInstances('allGoals',{ svc })
  const goals = allGS.filter( x => x.variableId !== id )
  const allIVS = await allInstances('allInitialValues',{ svc })
  const initialValues = allIVS.filter( x => x.variableId !== id )

  const replaceArg = x => {
    if (x.argument.variableId === id) {
      x.argument.variableId = null
      x.argument[itsType] = itsValue
    }
  }
  for (const t of transitions) {
    t.conditions = t.conditions.filter(c => c.variableId !== id )
    t.effects = t.effects.filter(e => e.variableId !== id )
    for( const x of t.conditions ) replaceArg(x)
    for( const x of t.effects ) replaceArg(x)
  }
  for (const x of goals) replaceArg(x)
  await persist( null , {variables, transitions,goals,initialValues,svc,workspaceId})
  logger.info(`Removed variable ${id} from workspace ${workspaceId}`)
  return true
}

module.exports = {
  removeVariable: async (_, input) => removeVariable(input),
  removeTransition: async (_, input) => removeOne('deleteTransitions', input),
  removeGoal: async (_, input) => removeOne('deleteGoal',input),
  removeInitialValue: async (_, input) => removeOne('deleteInitialValue', input)
}
