const { Types } = require('./constants')


class Condition {
  constructor( input ){
    const { properties, propertyName, operator, argument } = input 
    if (!argument) throw new Error('Cannot construct condition.  No argument was provided')
    if (!propertyName || propertyName === "") throw new Error("Cannot construct condition.  Property name is null or empty")
    if (!operator || operator === "") throw new Error("Cannot construct condition.  Operator is null or empty")
    const keys = Object.keys(argument).filter(x => x !== "id" )
    if (keys.length === 0) throw new Error("Cannot contruct condition.  The argument must include either a property name or a literal value") 
    if (keys.length >1) throw new Error("Cannot contruct condition.  The argument must include exactly one property name or literal value") 
    const property = properties[propertyName]
    if (!property) throw new Error(`Cannot construct condition.  The "${propertyName}" property does not exist.`)
    if (!Types[property.typeOf].comparisonOperators[operator]) throw new Error(`Cannot construct condition.  The ${operator} operator is not supported for the ${property.typeOf} type.`)
    if (argument.propertyName != null) {
      const argument = properties[argument.propertyName]
      if (!argument) throw new Error(`Cannot construct condition.  The "${argumentName}" property does not exist.`) 
      if (argument.typeOf !== property.typeOf) throw new Error(`Cannot construct condition.  "${propertyName}" and "${argumentName} have different types.`) 
      this.argumentName = argument.propertyName
    } else {
      if (!Types[keys[0]]) throw new error `Cannot construct condition. The argument type ${keys[0]} is not supported`
      if (keys[0] !== property.typeOf) throw new Error(`Cannot construct condition.  "${propertyName}" and "${argument[keys[0]]}" have different types.`) 
      this.value = argument[keys[0]]
    }
    this.typeOf = property.typeOf
    this.propertyName = propertyName
    this.operator = operator
  }

  get id() { return `${this.propertyName}:${this.typeOf} ${this.operator} ${this.argumentName? this.argumentName : this.value }`}
}

module.exports = {
  Condition
}