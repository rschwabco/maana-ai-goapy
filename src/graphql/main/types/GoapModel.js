/* eslint-disable prettier/prettier */
const { Property } = require('./Property')
const { Transition } = require('./Transition')
const { v4: uuid } = require('uuid')
const { logger } = require('./constants')

class GoapModel {
  constructor(input) {
    const { name, description, properties, transitions } = input
    if (!name || name === '') {
      logger.error('Cannot create GOAP model.  Name is empty or missing')
      throw new Error('Cannot create GOAP model.  Name is empty or missing')
    }
    this._id = (input.id && input.id!=="")? input.id : `${name}-${uuid()}`
    this.name = name
    if (description) {
      this.description = description
    }
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
    const json = {id: this.id, name: this.name }
    if (this.description) json.description = this.description
    json.properties = Object.values(this.properties).map( x => x.toGraphQL() )
    json.transitions = Object.values(this.transitions).map( x => x.toGraphQL() )
    return json
  }

  addProperty ( propertyInput ) {
    const id = `${propertyInput.name}:${propertyInput.typeOf}`
    if ( this.properties[propertyInput.name]) {
        const newt = propertyInput.typeOf
        const oldt = this.properties[propertyInput.name].typeOf
        if (newt !== oldt) {
            const msg = `Cannot update property '${id}'.  The old type and the new type are not the same (${oldt}!=${newt}).`
            logger.error(msg)
            throw new Error(msg)
        }
        try {
          this.properties[propertyInput.name] = new Property({...propertyInput, id})
        } catch (e) {
          throw new Error(e.message)
        }
        logger.info(`Updated property '${id}' in GOAP model.`)
    } else {
        try {
            this.properties[propertyInput.name] = new Property({...propertyInput, id})
          } catch (e) {
            throw new Error(e.message)
        }
        logger.info(`Added property '${id}' to GOAP model.`)
    }
  }

  addTransition ( transitionInput ) {
    const id = `${transitionInput.name}`
    const action = (Object.keys( this.transitions).includes(transitionInput.name))? "update" : "add"

    try { 
      this.transitions[transitionInput.name] = new Transition({...transitionInput, id, properties: this.properties})
    } catch (e) {
      throw new Error(e.message)
    }
    logger.info(`${action==="add"?"Added":"Updated"} transition '${id}' in GOAP model.`)
  }
}

module.exports = {
  GoapModel
}
