const { Types } = require('./constants')
const { Condition } = require('./Condition')

class Goal {
  constructor( input ){
    const { variables, conditions } = input
    this.conditions = Object.fromEntries(
        conditions.map( x => { const y = new Condition({...x, variables}); return [y.id,y]})
    )
  }

  get id() { return `{${Object.values(this.conditions).map(x=> x.id).join(',')}}`}
}

module.exports = {
  Goal
}