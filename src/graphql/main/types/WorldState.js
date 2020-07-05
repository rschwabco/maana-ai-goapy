const { Types } = require('./constants')

const { Binding } = require('./Binding')
class WorldState {
  constructor( input ){
    const properties = input.properties
    const bs = input.bindings || input.conditions || input.properties || []
    this.bindings = !Array.isArray(bs) ? bs : Object.fromEntries(
        bs.map( x => [x.propertyName,new Binding({...x, properties})])
    )
  }
  
  get id() { return `{${Object.values(this.bindings).map(x=> x.id).join(',')}}`}
}

module.exports = {
  WorldState
}