/* eslint-disable prettier/prettier */
const { Variable } = require('./Variable')
const { Transition } = require('./Transition')
import { Behavior } from './Behavior'
const { logger } = require('./constants')
const { v4: uuid } = require('uuid')

class GoapModel {
  constructor(input) {
    const { variables, transitions, behaviors, id } = input
    this.id = id
    this.variables = {}
    this.id = uuid()
    this.transitions = {}
    this.behaviors = {}
    const ps = variables || []
    ps.map( variableInput => this.addVariable(variableInput))
    const ts = transitions || []
    ts.map( transitionInput => this.addTransition({...transitionInput, variables: this.variables})
    )
    const bs = behaviors || [] 
    bs.map( behaviorInput => this.addBehavior({... behaviorInput}))
    //logger.info(`Created GOAP Model '${this.id}'`)
  }


  toGraphQL() {
    const json = { }
    json.variables = Object.values(this.variables).map( x => x.toGraphQL() )
    json.transitions = Object.values(this.transitions).map( x => x.toGraphQL() )
    return json
  }

  addVariable ( variableInput ) {
    const id = variableInput.id
    if ( this.variables[id]) {
        const newt = variableInput.typeOf
        const oldt = this.variables[id].typeOf
        if (newt !== oldt) {
            const msg = `Cannot update variable '${id}'.  The old type and the new type are not the same (${oldt}!=${newt}).`
            logger.error(msg)
            throw new Error(msg)
        }
        try {
          this.variables[id] = new Variable({...this.variables[id],...variableInput})
        } catch (e) {
          throw new Error(e.message)
        }
        //logger.info(`Updated variable '${id}' in GOAP model.`)
    } else {
        try {
            this.variables[id] = new Variable({...variableInput})
          } catch (e) {
            throw new Error(e.message)
        }
        //logger.info(`Added variable '${id}' to GOAP model.`)
    }
  }

  addTransition ( transitionInput ) {
    const id = transitionInput.id
    const action = (Object.keys( this.transitions).includes(id))? "update" : "add"

    try { 
        const existingT = this.transitions[id] 
        const x = existingT ? existingT.toGraphQL() : {}
        this.transitions[id] = new Transition({...x,...transitionInput, variables: this.variables})
    } catch (e) {
      throw new Error(e.message)
    }
    //logger.info(`${action==="add"?"Added":"Updated"} transition '${id}' in GOAP model.`)
  }

  addBehavior ( behaviorInput ) {
    const id = behaviorInput.id
    const action = this.behaviors[id] != null ? "update" : "add"
    try { 
      const existingB = this.behaviors[id] 
      const x = existingB ? existingB.toGraphQL() : {}
      this.behaviors[id] = new Behavior({...x,...behaviorInput, allTransitions: this.transitions })
    } catch (e) {
        throw new Error(e.message)
    }
    //logger.info(`${action==="add"?"Added":"Updated"} behavior '${id}' in GOAP model.`)
  }
}

module.exports = {
  GoapModel
}
