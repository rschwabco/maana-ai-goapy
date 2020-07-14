const { Types } = require('./constants')

const { VariableValue } = require('./VariableValue')
class WorldState {
  constructor( input ){
    const variables = input.variables
    const bs = input.bindings || input.conditions || input.variableValues || []
    if (!Array.isArray(bs)) { 
      for ( const b of Object.values(bs)) this[b.id] = new VariableValue({...b, variables} )
    } else {
      for ( const b of bs) this[b.variableId || b.id] = new VariableValue({...b, variables})
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