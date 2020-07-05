const { Property } = require("./Property")
const { Transition } = require("./Transition")
class GoapModel {
    constructor( input ) {
      const {id, name, description, properties, transitions } = input 
      this._id = id
      this.name = name
      this.description = description
      this.properties = Object.fromEntries(
          properties.map(x => {const y = new Property(x); return [y.name,y]}))
      this.transitions = transitions.map(x => new Transition({...x, properties:this.properties}))    
    }
    
    get id() { return this._id }
}

module.exports = {
    GoapModel
}