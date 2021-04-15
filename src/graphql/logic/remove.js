import { Types, logiclogger } from '../common/types/constants'
const logger = logiclogger

/** Given a goap model and an identifier for a variable,
 * remove the instance from the variables, transitions, initial valuses and goals of the model.  
 * If the variable occurs in initial values, or on the right hand side of a goal or condition,
 * then delete those instances as well.   If it occurs on the right hand side of a goal or 
 * condition then replace the reference with the default value for that variable's type.
 * @param args.model - the model to mutate
 *   will be removed
 * @param args.id - the identifier of the instance to remove
 * @param name - the name of the delete query to run
 * @return - THe modified model, or null if an error is encountered
 */
async function removeVariable(args) {
  // Construct a model from the variables and transitions.   This ensures
  // that they are well-formed and in normal form.
  const { id, model } = args
  const allVS = model.variables
  const its = allVS.filter( x => x.id === id )
  // if the variable does not exist, then there is no work to do.   Exit.
  if (its.length === 0) {
    logger.warn(`Variable ${id} does not exist in ${model.id}.  Aborting removeVariable.`)
    return model
  }
  //Otherwise, if it does exist, then we need to remove all references 
  //to it.
  const it = its[0]
  const itsType = it.typeOf
  const itsValue = Types[itsType].defaultValue

  const variables = allVS.filter(x => x.id !== id)

  const { transitions, name, allGS, allIVS } = model
  const goals = allGS.filter(x => x.variableId !== id)
  const initialValues = allIVS.filter(x => x.variableId !== id)

  const replaceArg = x => {
    if (x.argument.variableId === id) {
      x.argument.variableId = null
      x.argument[itsType] = itsValue
    }
  }
  for (const t of transitions) {
    t.conditions = t.conditions.filter(c => c.variableId !== id )
    t.effects = t.effects.filter(e => e.variableId !== id )
    for (const x of t.conditions) {
      replaceArg(x)
    }
    for (const x of t.effects) {
      replaceArg(x)
    }
  }
  for (const x of goals) {
    replaceArg(x)
  }
  logger.info(`Removed variable ${id} from model ${model.id}`)
  return { id: model.id, name, variables, transitions, initialValues, goals }
}

module.exports = {
  removeVariable: async (_, input) => removeVariable(input),
  removeTransition: async (_, input) => { return {...input.model, transitions: model.transitions.filter(x=>x.id!==id)}},
  removeGoal: async (_, input) => { return {...input.model, goals: model.goals.filter(x=>x.id!==id)}},
  removeInitialValue: async (_, input) => { return {...input.model, initialValues: model.initialValues.filter(x=>x.id!==id)}}
}
