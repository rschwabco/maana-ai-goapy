const { Condition } = require('./Condition')
const { Effect } = require('./Effect')
const { logger } = require('./constants')

class Transition {
  constructor(input) {
    const {
      variables,
      id,
      cost,
      description,
      conditions,
      effects,
      action
    } = input
    if (!id || id === '') {
      const msg = 'Cannot construct transaction.  The id is null or empty.'
      logger.error(msg)
      throw new Error(msg)
    }
    console.log(input)
    const cs = Array.isArray(conditions) ? conditions : []
    const es = Array.isArray(effects) ? effects : []
    this.id = id
    this.conditions = {}
    this.effects = {}
    this.description = description
    cs.map(x => this.addCondition({ ...x, variables }))
    es.map(x => this.addEffect({ ...x, variables }))
    this.action = action
    this.cost = cost == null ? 1.0 : cost
  }

  toGraphQL() {
    const json = { ...this }
    json.conditions = Object.values(this.conditions).map(x => x.toGraphQL()) 
    json.effects = Object.values(this.effects).map(x => x.toGraphQL()) 
    logger.info(`Created transition ${this.id}`)
    return json
  }

  addEffect(input) {
    const effect = new Effect(input)
    this.effects[effect.id] = effect
  }

  addCondition(input) {
    const condition = new Condition(input)
    this.conditions[condition.id] = condition
  }
}

module.exports = {
  Transition
}
