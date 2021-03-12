const { logger } = require('./constants')


class Behavior {
  constructor(input) {
    const { id, description, transitions, allTransitions } = input
    if (!id || id === '') {
      const msg = 'Cannot construct behavior.  The id is null or empty.'
      logger.error(msg)
      throw new Error(msg)
    }
    const ts = Array.isArray(transitions) ? transitions : []
    this.id = id
    this.transitions = {}
    this.description = description
    ts.map(x => this.addTransition( x, allTransitions))
  }

  toGraphQL() {
    const json = { ...this, transitions: Object.values(this.transitions).map( x => x.id) }
    return json
  }

  addTransition(id, allTransitions) {
    const x = allTransitions[id]
    if (x!= null) {
      this.transitions[id] = x
    } else {
      const msg = `Cannot add transition ${id} to behavior ${this.id}.  Transition does not exist.`
      logger.error(msg)
      throw new Error(msg)
    }
  }
}

module.exports = {
  Behavior
}
