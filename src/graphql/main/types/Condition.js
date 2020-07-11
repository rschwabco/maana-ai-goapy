const { logger, Types } = require('./constants')


class Condition {
  constructor( input ){
    const { properties, propertyId, operator, argument} = input 
    const throwErr = reason => {
      const msg = `Cannot construct condition for "${propertyId}". ${reason}`
      logger.error(msg)
      throw new Error(msg)
    }
    if (!argument) throwErr('No argument was provided')
    if (!propertyId || propertyId === '')
      throwErr('Property id is null or empty')
    if (!operator || operator === '') throwErr(`Operator is null or empty`)
    const keys = Object.keys(argument).filter(x => x !== "id" )
    if (keys.length === 0) throwErr(`The argument must include either a property name or a literal value`) 
    if (keys.length >1) throwErr("The argument must include exactly one property name or literal value") 
    const property = properties[propertyId]
    if (!property) throwErr(`The property does not exist.`)
    if (!Types[property.typeOf].comparisonOperators[operator]) throwErr(`The ${operator} operator is not supported for the ${property.typeOf} type.`)
    if (argument.propertyId != null) {
      const rhs = properties[argument.propertyId]
      if (!rhs) throwErr(`The "${argument.propertyId}" property does not exist.`) 
      if (rhs.typeOf !== property.typeOf) throwErr(`"${propertyId}" and "${argument.id} have different types.`) 
      this.argumentId = rhs.id
    } else {
      if (!Types[keys[0]]) throwErr(`The argument type ${keys[0]} is not supported`)
      if (keys[0] !== property.typeOf) throwErr(`"${propertyId}" and "${argument[keys[0]]}" have different types.`) 
      this.value = argument[keys[0]]
    }
    this.typeOf = property.typeOf
    this.propertyId = propertyId
    this.operator = operator
  }

  toGraphQL() {
    const lit = () => { 
      const obj = { id: `${this.value}`}; obj[this.typeOf]=this.value; return obj 
    } 
    const argument = (this.argumentId && this.argumentId !== null) 
      ? { id: `${this.argumentId}`, propertyId: this.argumentId }
      : lit()
    return { 
      id: this.id,
      operator: this.operator,
      propertyId: this.propertyId,
      argument
    }
  }

  get id() { return `${this.propertyId}${this.operator}${this.argumentId? this.argumentId : this.value }`}
}

module.exports = {
  Condition
}