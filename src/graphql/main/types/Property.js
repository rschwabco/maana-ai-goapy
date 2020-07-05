const { Types } = require('./constants')


class Property {
  constructor( input ){
    const {name, typeOf, weight } = input
    if (typeof name !== "string") throw new Error('Cannot create property.  The name is not a string.')
    if (!name || name === "" ) throw new Error('Cannot create property.  The name is not a null or empty.')
    if (!Object.keys(Types).includes(typeOf)) throw new Error(`Cannot create property.  The type ${typeOf} is not supported`)
    this.name = name
    this.typeOf = typeOf
    this.weight = weight || 1.0
  }

  get id() { return `${this.name}:${this.typeOf}`}
}

module.exports = {
  Property
}