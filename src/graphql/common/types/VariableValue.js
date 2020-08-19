const { Types, logger } = require('./constants')

class VariableValue {
  constructor(input) {
    const { variables, variableId } = input
    const variable = variables[variableId]
    const throwErr = reason => {
      const msg = `Cannot construct Variable Value.  ${reason}`
      logger.error(msg)
      throw new Error(msg)
    }
    if (!variable) throwErr(`The "${variableId}" variable does not exist.`)
    const keys = Object.keys(input).filter(
      x => x!=='id' && x !== 'variableId' && x !== 'variables' && x !== 'typeOf' && input[x]!==null
    )
    this.variableId = variableId
    this.typeOf = variable.typeOf
    this.value =
      input.value != null
        ? input.value
        : keys.length === 0
          ? Types[variable.typeOf].defaultValue
            : input[this.typeOf]!= null
              ? input[this.typeOf]
              : throwErr(`"${id}" does not have the same type as the provided value.`)
    this.id = `${this.variableId}=${this.typeOf=='STRING'? `"${this.value}"`:this.value}`
  }

  setValue(v) {
    this.value = v
    this.id = `${this.variableId}=${this.typeOf=='STRING'? `"${this.value}"`:this.value}`
  }

  toGraphQL() {
    const json = { id: this.id, variableId: this.variableId }
    json[this.typeOf] = this.value
    return json
  }
}

module.exports = {
  VariableValue
}
