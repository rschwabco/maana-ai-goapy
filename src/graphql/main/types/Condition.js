const { logger, Types } = require('./constants')


class Condition {
  constructor( input ){
    const { variables, variableId, comparisonOperator, argument} = input 
    const throwErr = reason => {
      const msg = `Cannot construct condition for "${variableId}". ${reason}`
      logger.error(msg)
      throw new Error(msg)
    }
    if (!argument) throwErr('No argument was provided')
    if (!variableId || variableId === '')
      throwErr('Variable id is null or empty')
    if (!comparisonOperator || comparisonOperator === '') throwErr(`comparisonOperator is null or empty`)
    const keys = Object.keys(argument).filter(x => x !== "id" )
    if (keys.length === 0) throwErr(`The argument must include either a variable id or a literal value`) 
    if (keys.length >1) throwErr("The argument must include exactly one variable id or literal value") 
    const variable = variables[variableId]
    if (!variable) throwErr(`The variable does not exist.`)
    if (!Types[variable.typeOf].comparisonOperators[comparisonOperator]) throwErr(`The ${comparisonOperator} comparisonOperator is not supported for the ${variable.typeOf} type.`)
    if (argument.variableId != null) {
      const rhs = variables[argument.variableId]
      if (!rhs) throwErr(`The "${argument.variableId}" variable does not exist.`) 
      if (rhs.typeOf !== variable.typeOf) throwErr(`"${variableId}" and "${argument.id} have different types.`) 
      this.argumentId = rhs.id
    } else {
      if (!Types[keys[0]]) throwErr(`The argument type ${keys[0]} is not supported`)
      if (keys[0] !== variable.typeOf) throwErr(`"${variableId}" and "${argument[keys[0]]}" have different types.`) 
      this.value = argument[keys[0]]
    }
    this.typeOf = variable.typeOf
    this.variableId = variableId
    this.comparisonOperator = comparisonOperator
  }

  toGraphQL() {
    const lit = () => { 
      const obj = { id: `${this.value}`}; obj[this.typeOf]=this.value; return obj 
    } 
    const argument = (this.argumentId && this.argumentId !== null) 
      ? { id: `${this.argumentId}`, variableId: this.argumentId }
      : lit()
    return { 
      id: this.id,
      comparisonOperator: this.comparisonOperator,
      variableId: this.variableId,
      argument
    }
  }

  get id() { return `${this.variableId}${this.comparisonOperator}${this.argumentId? this.argumentId : this.value }`}
}

module.exports = {
  Condition
}