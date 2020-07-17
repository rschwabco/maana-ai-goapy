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
    const cs = Array.isArray(conditions) ? conditions : []
    const es = Array.isArray(effects) ? effects : []
    this.id = id
    this.conditions = {}
    this.effects = {}
    this.seq = {}
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
    if (effect.order == null) {
      const ks = Object.keys(this.seq)
      const ns = ks.map( x => Number.parseInt(x) )
      const n = ns.reduce((z,x) => Math.max(z,x),0) +1
      effect.order =n
    }
    if (this.seq[effect.order]==null) {
      this.effects[effect.id] = effect
      this.seq[effect.order] = effect.id
    } else {
      const msg = `Cannot add effect ${effect.id} to '${this.id}'.   Cannot determine ordinal position.`
      logger.error(msg)
      throw new Error(msg)
    }
  }

  addCondition(input) {
    const condition = new Condition(input)
    this.conditions[condition.id] = condition
  }

  orderedEffects() {
    const ords = Object.keys(this.seq).map(x =>Number.parseInt(x)).sort()
    const effects = ords.map( i => this.effects[this.seq[`${i}`]])
    return effects
  }
}

module.exports = {
  Transition
}
