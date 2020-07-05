const { Condition } = require('./Condition')
const { Effect } = require('./Effect')

class Transition {
    constructor( input ) {
      const { properties, id, name, cost, description, conditions, effects, action } = input
      this.id = id,
      this.name = name,
      this.description = description,
      this.conditions = conditions.map(x => new Condition({ ...x, properties })), 
      this.effects = effects.map(x => new Effect({ ...x, properties })), 
      this.action = action
      this.cost = cost
    }
  }

  module.exports = {
    Transition
  }