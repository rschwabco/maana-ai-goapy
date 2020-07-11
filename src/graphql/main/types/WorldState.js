const { Types } = require('./constants')

const { PropertyValue } = require('./PropertyValue')
class WorldState {
  constructor( input ){
    const properties = input.properties
    const bs = input.bindings || input.conditions || input.propertyValues || []
    if (!Array.isArray(bs)) { 
      for ( const b of Object.values(bs)) this[b.id] = new PropertyValue({...b, properties} )
    } else {
      for ( const b of bs) this[b.propertyId || b.id] = new PropertyValue({...b, properties})
    }
  }

  get id() {
    return `${Object.values(this).map(x=> `${x.id}=${x.value}`).join(',')}}`
  }

  toGraphQL() {
    return Object.values(this).map( x => x.toGraphQL() )
  }
}

module.exports = {
  WorldState
}