const { Goal } = require('./Goal')
const { VariableValue } = require('./VariableValue')
const { logger } = require('./constants')

class Scenario {
  constructor(input) {
    const {
      id,
      description,
      behavior,
      goals,
      initialValues
    } = input
    if (!id || id === '') {
      const msg = 'Cannot construct behavior.  The id is null or empty.'
      logger.error(msg)
      throw new Error(msg)
    }
    this.id = id
    this.description = description
    const cs = Array.isArray(goals) ? goals : []
    const vs = Array.isArray(initialValues) ? initialValues : []
    this.initialValues = Object.fromEntries(
      Object.entries( ([k,v]) => new VariableValue({ variableId: k, value: Types[v.typeOf].defaultValue, variables: model.variables}))
    )
    cs.map(x => this.addGoal({ ...x, variables: model.variables }))
    vs.map(x => this.addInitialValue({ ...x, variables: model.variables }))
  }

  toGraphQL() {
    const json = { id: this.id, description: this.description, behavior: this.behavior }
    json.goals = Object.values(this.goals).map(x => x.id ) 
    json.initialValues = Object.values(this.effects).map(x => x.id) 
    return json
  }

  addInitialValue(input) {
    const v = this.initialValues[input.id] || {}
    const ival = new VariableValue({ ...v, ...input })
    this.initialValues[ival.id] = ival
  }

  addGoal(input) {
    const goal = new Goal(input)
    this.goals[goal.id] = goal
  }

}

module.exports = {
  Scenario
}
