const { Types, logger } = require('./constants')


class Property {
  constructor( input ){
    const throwErr = reason => {
      const msg = `Cannot create property ${input.name}:${input.typeOf}. ${reason}`
      logger.error(msg)
      throw new Error(msg)
    }
    const { id, name, typeOf, weight, description } = input
    if (!name || name === "" ) throwErr('The name is not a null or empty.')
    if (!Object.keys(Types).includes(typeOf)) throwErr(`The type ${typeOf} is not supported`)
    this.id = id ? id : `${name}:${typeOf}`
    this.name = name
    this.description = description
    this.typeOf = typeOf
    this.weight = weight || 1.0
  }

  toGraphQL() {
    return this
  }

}

module.exports = {
  Property
}