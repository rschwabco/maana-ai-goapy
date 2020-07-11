const { Types, logger } = require('./constants')

class PropertyValue {
  constructor(input) {
    const { properties, id } = input
    const property = properties[id]
    const throwErr = reason => {
      const msg = `Cannot construct Property Value.  ${reason}`
      logger.error(msg)
      throw new Error(msg)
    }
    if (!property) throwErr(`The "${id}" property does not exist.`)
    const keys = Object.keys(input).filter(
      x => x !== 'id' && x !== 'properties' && x !== 'typeOf'
    )

    this.id = id
    this.typeOf = property.typeOf
    this.value =
      input.value != null
        ? input.value
        : keys.length === 0
          ? Types[property.typeOf].defaultValue
            : input[this.typeOf]!= null
              ? input[this.typeOf]
              : throwErr(`"${id}" does not have the same type as the provided value.`)
  }

  toGraphQL() {
    const json = { id: this.id }
    json[this.typeOf] = this.value
    return json
  }
}

module.exports = {
  PropertyValue
}
