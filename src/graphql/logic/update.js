import { persistlogger, Types } from '../common/types/constants'
const logger = persistlogger


/** * Given a GOAP model, update the type of one the variables
 * @param input.GoapModel - the goap models to be modified.
 *  @param input.id - the identifier for the variable
 * @param input.typeOf - the new type for the variable
 * @returns A boolean variable which is true if and only if the
 *   variable type has been updated.
 */
async function retypeVariable(args) { 
  const { id, model, typeOf } = args 

  const variables = model.variables
  const oldVs = variables.filter(v => v.id === id)

  // SANITY CHECKS
  if (!Object.keys(Types).includes(typeOf)) {
    const msg = `Cannot retype Variable ${id}.   ${typeOf} is not a valid type`
    logger.error(msg)
    throw new Error(msg)
  }
  if (oldVs.length === 0) {
    logger.warn(
      `Variable ${id} does not exist in given models.  Aborting retypeVariable.`
    )
    return model
  }
  if (oldVs[0].typeOf === typeOf) {
    logger.warn(
      `Variable ${id} is already of type ${typeOf}.  Aborting retypeVariable.`
    )
    return model
  }

  const v = oldVs[0]
  const oldType = v.typeOf
  const itsValue = Types[typeOf].defaultValue
  const oldValue = Types[oldType].defaultValue
  const { transitions, goals, initialValues } = model

  const update = (x, op) => {
    if (x.variableId === v.id) {
      if (x.assignmentOperator) {
        x.assignmentOperator = op
      }
      if (x.comparisonOperator) {
        x.comparisonOperator = op
      }
      x.argument[typeOf] = itsValue
      x.argument[oldType] = null
      x.argument.variableId = null
      x.argument.id = `${x.argument[typeOf]}:${typeOf}`
    }
    if (x.argument && x.argument.variableId === v.id) {
      x.argument.variableId = null
      x.argument[oldType] = oldValue
      x.argument.id = `${x.argument[oldType]}:${oldType}`
    }
    x.id = x.assignmentOperator 
      ? `${x.variableId}${x.assignmentOperator}${x.argument.id}`
      : `${x.variableId}${x.comparisonOperator}${x.argument.id}` 
  }

  for (const x of variables) {
    if (x.id === v.id) {
      x.typeOf = typeOf
    }
  }
  for (const t of transitions) {
    for (const x of t.conditions) {
      update(x, '==')
    }
    for (const x of t.effects) {
      update(x, '=')
    }
  }
  for (const x of goals) {
    update(x, '==')
  }
  for (const x of initialValues) {
    if (x.variableId === v.id) {
      x.id = `${v.id}=${itsValue}:${typeOf}`
      x[typeOf] = itsValue
      x[oldType] = null
    }
  }

  logger.info(`Retyped variable ${v.id} to ${typeOf} in model ${model.id}`)
  return { ...model, variables, transitions, goals, initialValues }
}

module.exports = {
  retypeVariable: async (_, input) => retypeVariable(input)
}
