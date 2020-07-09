'use-strict'

class PlannerNode {
    constructor( cost, dist, node_id, parent_node_id, resultantState, node_action ) {
      this.cost = cost,
      this.distance = dist,
      this.id = node_id,
      this.parentId = parent_node_id,
      this.resultantState = resultantState,
      this.action = node_action
    }

    get score() { return this.cost + this.distance }
  }
  
module.exports = { 
  PlannerNode 
}