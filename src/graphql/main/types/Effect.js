const { logger, Types } = require('./constants')

class Effect {
  constructor(input) {
    const throwErr = reason => {
      const msg = `Cannot construct effect. ${reason}`
      logger.error(msg)
      throw new Error(msg)
    }
    const { properties, propertyId, operator, argument } = input
    if (!argument) {
      throwErr('No argument was provided')
    }
    if (!propertyId || propertyId === '') {
      throwErr('Property id is null or empty')
    }
    if (!operator || operator === '') {
      throwErr('Operator is null or empty')
    }
    const keys = Object.keys(argument).filter(x => x !== 'id')
    if (keys.length === 0) {
      throwErr(
        'The argument must include either a property name or a literal value'
      )
    }
    if (keys.length > 1) {
      throwErr(
        'The argument must include exactly one property name or literal value'
      )
    }
    const property = properties[propertyId]
    if (!property) {
      throwErr(`The "${propertyId}" property does not exist.`)
    }
    if (!Types[property.typeOf].assignmentOperators[operator]) {
      throwErr(
        `The ${operator} operator is not supported for the ${property.typeOf} type.`
      )
    }
    if (argument.propertyId != null && argument.propertyId !== '') {
      const arg = properties[argument.propertyId]
      if (!arg) {
        throwErr(`The "${argument.propertyId}" property does not exist.`)
      }
      if (arg.typeOf !== property.typeOf) {
        throwErr(`"${propertyId}" and "${arg.name} have different types.`)
      }
      this.argumentName = arg.name
    } else {
      if (!Types[keys[0]]) {
        throwErr`The argument type ${keys[0]} is not supported`
      }
      if (keys[0] !== property.typeOf) {
        throwErr(
          `"${propertyId}" and "${argument[keys[0]]}" have different types.`
        )
      }
      this.value = argument[keys[0]]
    }
    this.typeOf = property.typeOf
    this.propertyId = propertyId
    this.operator = operator
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
            propertyId: this.argumentName
          }
        : lit()
    return {
      id: this.id,
      propertyId: this.propertyId,
      operator: this.operator,
      argument
    }
  }

  get id() {
    return `${this.propertyId}${this.operator}${this.argumentName ? this.argumentName : this.value}`
  }
}

module.exports = {
  Effect
}
