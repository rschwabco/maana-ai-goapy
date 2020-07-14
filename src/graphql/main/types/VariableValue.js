const { Types, logger } = require('./constants')

class VariableValue {
  constructor(input) {
    const { variables, id } = input
    const variable = variables[id]
    const throwErr = reason => {
      const msg = `Cannot construct Variable Value.  ${reason}`
      logger.error(msg)
      throw new Error(msg)
    }
    if (!variable) throwErr(`The "${id}" variable does not exist.`)
    const keys = Object.keys(input).filter(
      x => x !== 'id' && x !== 'variables' && x !== 'typeOf'
    )

    this.id = id
    this.typeOf = variable.typeOf
    this.value =
      input.value != null
        ? input.value
        : keys.length === 0
          ? Types[variable.typeOf].defaultValue
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
  VariableValue
}
