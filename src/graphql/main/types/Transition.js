const { Condition } = require('./Condition')
const { Effect } = require('./Effect')
const { logger } = require('./constants')

class Transition {
  constructor(input) {
    const {
      properties,
      id,
      name,
      cost,
      description,
      conditions,
      effects,
      action
    } = input
    if (!name || name === '') {
      const msg = 'Cannot construct transaction.  The name is null or empty.'
      logger.error(msg)
      throw new Error(msg)
    }
    const cs = conditions || []
    const es = effects || []
    this.id = id
    this.name = name
    this.conditions = {}
    this.effects = {}
    this.description = description
    cs.map(x => this.addCondition({ ...x, properties }))
    es.map(x => this.addEffect({ ...x, properties }))
    this.action = action
    this.cost = cost == null ? 1.0 : cost
  }

  toGraphQL() {
    const json = { ...this }
    console.log(Object.keys)
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
