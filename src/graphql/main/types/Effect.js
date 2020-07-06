const { Types } = require('./constants')


class Effect {
  constructor( input ){
    const { properties, propertyName, operator, argument } = input 
    if (!argument) throw new Error('Cannot construct effect.  No argument was provided')
    if (!propertyName || propertyName === "") throw new Error("Cannot construct effect.  Property name is null or empty")
    if (!operator || operator === "") throw new Error("Cannot construct effect.  Operator is null or empty")
    const keys = Object.keys(argument).filter(x => x !== "id" )
    if (keys.length === 0) throw new Error("Cannot contruct effect.  The argument must include either a property name or a literal value") 
    if (keys.length >1) throw new Error("Cannot contruct effect.  The argument must include exactly one property name or literal value") 
    const property = properties[propertyName]
    if (!property) throw new Error(`Cannot construct effect.  The "${propertyName}" property does not exist.`)
    if (!Types[property.typeOf].assignmentOperators[operator]) throw new Error(`Cannot construct effect.  The ${operator} operator is not supported for the ${property.typeOf} type.`)
    if (argument.propertyName != null && argument.propertyName !== "" ) {
      const arg = properties[argument.propertyName]
      if (!arg) throw new Error(`Cannot construct effect.  The "${argument.propertyName}" property does not exist.`) 
      if (arg.typeOf !== property.typeOf) throw new Error(`Cannot construct effect.  "${propertyName}" and "${arg.name} have different types.`) 
      this.argumentName = arg.name
    } else {
      if (!Types[keys[0]]) throw new error `Cannot construct effect. The argument type ${keys[0]} is not supported`
      if (keys[0] !== property.typeOf) throw new Error(`Cannot construct effect.  "${propertyName}" and "${argument[keys[0]]}" have different types.`) 
      this.value = argument[keys[0]]
    }
    this.typeOf = property.typeOf
    this.propertyName = propertyName
    this.operator = operator
  }

  get id() { return `${this.propertyName}:${this.typeOf} ${this.operator} ${this.argumentName? this.argumentName : this.value }`}
}

module.exports = {
  Effect
}