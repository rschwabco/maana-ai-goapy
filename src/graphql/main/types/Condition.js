const { logger, Types } = require('./constants')


class Condition {
  constructor( input ){
    const { properties, propertyName, operator, argument} = input 
    const throwErr = reason => {
      const msg = `Cannot construct condition for "${propertyName}". ${reason}`
      logger.error(msg)
      throw new Error(msg)
    }
    if (!argument) throwErr('No argument was provided')
    if (!propertyName || propertyName === '')
      throwErr('Property name is null or empty')
    if (!operator || operator === '') throwErr(`Operator is null or empty`)
    const keys = Object.keys(argument).filter(x => x !== "id" )
    if (keys.length === 0) throwErr(`The argument must include either a property name or a literal value`) 
    if (keys.length >1) throwErr("The argument must include exactly one property name or literal value") 
    const property = properties[propertyName]
    if (!property) throwErr(`The property does not exist.`)
    if (!Types[property.typeOf].comparisonOperators[operator]) throwErr(`The ${operator} operator is not supported for the ${property.typeOf} type.`)
    if (argument.propertyName != null) {
      const rhs = properties[argument.propertyName]
      if (!rhs) throwErr(`The "${argument.propertyName}" property does not exist.`) 
      if (rhs.typeOf !== property.typeOf) throwErr(`"${propertyName}" and "${argument.name} have different types.`) 
      this.argumentName = rhs.name
    } else {
      if (!Types[keys[0]]) throwErr(`The argument type ${keys[0]} is not supported`)
      if (keys[0] !== property.typeOf) throwErr(`"${propertyName}" and "${argument[keys[0]]}" have different types.`) 
      this.value = argument[keys[0]]
    }
    this.typeOf = property.typeOf
    this.propertyName = propertyName
    this.operator = operator
  }

  toGraphQL() {
    const lit = () => { 
      const obj = { id: `${this.value}:${this.typeOf}`}; obj[this.typeOf]=this.value; return obj 
    } 
    const argument = (this.argumentName && this.argumentName !== null) 
      ? { id: `${this.argumentName}:${this.typeOf}`, propertyName: this.argumentName }
      : lit()
    return { 
      id: this.id,
      operator: this.operator,
      propertyName: this.propertyName,
      argument
    }
  }

  get id() { return `${this.propertyName}:${this.typeOf}${this.operator}${this.argumentName? this.argumentName : this.value }`}
}

module.exports = {
  Condition
}