const { Types, logger } = require('./constants')


class Variable {
  constructor( input ){
    const throwErr = reason => {
      const msg = `Cannot create variable ${input.id}:${input.typeOf}. ${reason}`
      logger.error(msg)
      throw new Error(msg)
    }
    const { id, typeOf, weight, description } = input
    if (!id || id === "" ) throwErr('The id is null or empty.')
    if (!Object.keys(Types).includes(typeOf)) throwErr(`The type ${typeOf} is not supported`)
    this.id = id
    this.description = description
    this.typeOf = typeOf
    this.weight = weight || 1.0
  }

  toGraphQL() {
    return this
  }

}

module.exports = {
  Variable
}