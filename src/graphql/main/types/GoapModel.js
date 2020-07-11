/* eslint-disable prettier/prettier */
const { Property } = require('./Property')
const { Transition } = require('./Transition')
const { logger } = require('./constants')

class GoapModel {
  constructor(input) {
    const { properties, transitions } = input
    this.properties = {}
    this.transitions = {}
    const ps = properties || []
    ps.map( propertyInput => this.addProperty(propertyInput))
    const ts = transitions || []
    ts.map( transitionInput => this.addTransition({...transitionInput, properties: this.properties})
    )
    logger.info(`Created GOAP Model '${this.id}'`)
  }

  get id() {
    return this._id
  }

  toGraphQL() {
    const json = { }
    json.properties = Object.values(this.properties).map( x => x.toGraphQL() )
    json.transitions = Object.values(this.transitions).map( x => x.toGraphQL() )
    return json
  }

  addProperty ( propertyInput ) {
    const id = propertyInput.id
    if ( this.properties[id]) {
        const newt = propertyInput.typeOf
        const oldt = this.properties[id].typeOf
        if (newt !== oldt) {
            const msg = `Cannot update property '${id}'.  The old type and the new type are not the same (${oldt}!=${newt}).`
            logger.error(msg)
            throw new Error(msg)
        }
        try {
          this.properties[id] = new Property({...propertyInput})
        } catch (e) {
          throw new Error(e.message)
        }
        logger.info(`Updated property '${id}' in GOAP model.`)
    } else {
        try {
            this.properties[id] = new Property({...propertyInput})
          } catch (e) {
            throw new Error(e.message)
        }
        logger.info(`Added property '${id}' to GOAP model.`)
    }
  }

  addTransition ( transitionInput ) {
    const id = transitionInput.id
    const action = (Object.keys( this.transitions).includes(id))? "update" : "add"

    try { 
      this.transitions[id] = new Transition({...transitionInput, properties: this.properties})
    } catch (e) {
      throw new Error(e.message)
    }
    logger.info(`${action==="add"?"Added":"Updated"} transition '${id}' in GOAP model.`)
  }
}

module.exports = {
  GoapModel
}
