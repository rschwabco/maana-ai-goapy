const { logger, Types } = require('./constants')

class Effect {
  constructor(input) {
    const throwErr = reason => {
      const msg = `Cannot construct effect. ${reason}`
      logger.error(msg)
      throw new Error(msg)
    }
    const { variables, variableId, assignmentOperator, argument } = input
    if (!argument) {
      throwErr('No argument was provided')
    }
    if (!variableId || variableId === '') {
      throwErr('Variable id is null or empty')
    }
    if (!assignmentOperator || assignmentOperator === '') {
      throwErr('assignmentOperator is null or empty')
    }
    const keys = Object.keys(argument).filter(x => x !== 'id')
    if (keys.length === 0) {
      throwErr(
        'The argument must include either a variable name or a literal value'
      )
    }
    if (keys.length > 1) {
      throwErr(
        'The argument must include exactly one variable name or literal value'
      )
    }
    const variable = variables[variableId]
    if (!variable) {
      throwErr(`The "${variableId}" variable does not exist.`)
    }
    if (!Types[variable.typeOf].assignmentOperators[assignmentOperator]) {
      throwErr(
        `The ${assignmentOperator} assignmentOperator is not supported for the ${variable.typeOf} type.`
      )
    }
    if (argument.variableId != null && argument.variableId !== '') {
      const arg = variables[argument.variableId]
      if (!arg) {
        throwErr(`The "${argument.variableId}" variable does not exist.`)
      }
      if (arg.typeOf !== variable.typeOf) {
        throwErr(`"${variableId}" and "${arg.name} have different types.`)
      }
      this.argumentName = arg.name
    } else {
      if (!Types[keys[0]]) {
        throwErr`The argument type ${keys[0]} is not supported`
      }
      if (keys[0] !== variable.typeOf) {
        throwErr(
          `"${variableId}" and "${argument[keys[0]]}" have different types.`
        )
      }
      this.value = argument[keys[0]]
    }
    this.typeOf = variable.typeOf
    this.variableId = variableId
    this.assignmentOperator = assignmentOperator
    logger.info(`created effect ${this.id}`)
  }

  toGraphQL() {
    const lit = () => {
      const obj = { id: `${this.value}` }
      obj[this.typeOf] = this.value
      return obj
    }
    const argument =
      this.argumentName && this.argumentName !== null
        ? {
            id: `${this.argumentName}:${this.typeOf}`,
            variableId: this.argumentName
          }
        : lit()
    return {
      id: this.id,
      variableId: this.variableId,
      assignmentOperator: this.assignmentOperator,
      argument
    }
  }

  get id() {
    return `${this.variableId}${this.assignmentOperator}${this.argumentName ? this.argumentName : this.value}`
  }
}

module.exports = {
  Effect
}
