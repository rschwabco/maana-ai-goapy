/* eslint-disable prettier/prettier */
const { GoapModel } = require ('./GoapModel')
const { logger } = require('./constants')

class GoapEnvironment {
  constructor(input) {
    const { id, model, scenarios } = input
    this.id = id
    this.model = new GoapModel({ ...model, id })
    const ss = scenarios || []
    ss.map( scenarioInput => this.addScenario({...scenarioInput})
    )
    logger.info(`Created GOAP Environment '${this.id}'`)
  }


  toGraphQL() {
    const json = { }
    json.id = this.id
    json.model = this.model.toGraphQL()
    json.scenarios = this.scenarios.map( x => x.id )
    return json
  }

  addScenario ( scenarioInput ) {
    this.scenarios[scenario.id] = new scenario( scenarioInput, this.model)
  }

}

module.exports = {
  GoapEnvironment
}
