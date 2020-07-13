'use-strict'
/* eslint-disable prettier/prettier */
// =============================================================================
// NAME: Plan
// DESCRIPTION: An implementation of a Goal Oriented Action Planner
// ===========================================================================*/
var SortedArrayMap = require("collections/sorted-array-map");
const { PlannerNode } = require("./types/PlannerNode")
const { PropertyValue } = require("./types/PropertyValue")
const { WorldState } = require("./types/WorldState")
const { Goal } = require("./types/Goal")
const { GoapModel } = require("./types/GoapModel")
const { Condition } = require("./types/Condition")
const { v4: uuid } = require("uuid")
const { logger, Types, MIN_PROPERTY_DISTANCE, ITERATION_LIMIT } = require('./types/constants');

function throwErr(id, reason){
  const msg = `Planning for ${id} failed.  ${reason}`
  logger.error(msg)
  throw new Error(msg)
}


function generatePlan( input ) {
  const planId = uuid()
  logger.info(`Staring planning for ${planId}`)
  const { properties:ps, transitions:ts, initialState: init, goal: goalinput } = input 
  const model = new GoapModel({properties:ps, transitions:ts })
  const {properties,transitions} = model
  const initPropValues = init.map( x => new PropertyValue({...x, properties}))
  const initialState = new WorldState({ propertyValues: initPropValues, properties})
  const worldstate = new WorldState({ propertyValues: initPropValues, properties} )
  const goal = new Goal({ properties, conditions: goalinput })
  const nonnullTransitions = Object.values(transitions)
  const initialDistance = distanceTo(planId, properties, worldstate, goal )
  let _id = 0
  const nextId = () => { _id++; return _id }
           
  const startNode = new PlannerNode( 
    0,
    initialDistance,   // the initial distance to the goal
    nextId(),      // a function for generating new identifiers from old ones
    0,               // the parent node id
    worldstate,         // the current worldstate
    )
  
  // open nodes is a chained heap (a map of lists) where each element is 
  // indexed by the distnace to the goal.   Use of the Sorted Map ensures
  // that we can find the minimum distance node efficiently.
  const openNodes = new SortedArrayMap({})
  openNodes.set( startNode.score, [startNode] )

  // closed nodes are a map where each element is a plan node that has been
  // visited.   nodes are indexed by their id.
  const closedNodes = new SortedArrayMap({})
  var currentIteration = 0
  
  if( initialDistance < MIN_PROPERTY_DISTANCE ) { 
    logger.warn("The current world state coincides with the goal world state");
    return mkActionPlan( planId, startNode, worldstate, worldstate, closedNodes)
  }
  

  while( openNodes.length > 0 ) {
    currentIteration += 1
    logger.info(`PLANNING ITERATION ${currentIteration} for ${planId}`)
    //Check and update iterations count
    if ( currentIteration >= ITERATION_LIMIT ) {
      logger.warn(planId, "Planning generations exceded max iteration.  Returning partial solution")
      return mkActionPlan(planId, currentNode, initialState, currentNode.resultantState, closedNodes, "FAILED TO CONVERGE")
    }

    
    //Select the lowest cost node from the list of openNodes
    var currentNode = closeNode(openNodes, closedNodes);
    
    //Check if the resultant world state of the current node is the goal world state
    if (distanceTo(planId, properties, currentNode.resultantState,goal) < MIN_PROPERTY_DISTANCE)  {
      logger.info(`Action plan for '${planId} completed in ${currentIteration} iterations.'`)
      return mkActionPlan( planId, currentNode, initialState, currentNode.resultantState, closedNodes, "SOLVED")
    }
    
    //Iterate over all the the enabled transitions transitions
    const enabledTransitions = nonnullTransitions.filter( 
      x => isEnabled(planId, properties, x,currentNode.resultantState)) 
    for (let transition of enabledTransitions) {
      //Compute the effect of applying the transition to the currentNode's 
      //resultant worldstate

      const newState = applyTransition(properties, transition, currentNode.resultantState);
      //Check if there is an action in the open list that can also reach 
      //the new current world state
      let inOpenNode = IsInOpenNodes(planId, properties, openNodes, newState);
      if( inOpenNode != null ) {
        //In true case check if the new node is better
        //The old node is better than this new one
        if(currentNode.cost + transition.cost > inOpenNode.cost){
         continue
        } 
        const dist = distanceTo(planId, properties, newState, goal);
        //The new node is better than the old, lets update the node data
        inOpenNode.parentId = currentNode.id;
        inOpenNode.cost = currentNode.g + transition.cost;
        inOpenNode.distance = dist
        inOpenNode.action = transition;
      } else {
        //In false case generate a new open node
        //Add the new node to the open list
        const newNode = new PlannerNode(
          currentNode.cost + transition.cost, 
          distanceTo(planId, properties, newState, goal), 
          nextId(), 
          currentNode.id, 
          newState, 
          transition);       

        AddToOpen(openNodes, newNode);
      }
    }
  } 
  //In no plan found case we return an empty plan 
  logger.warn(`There is no action plan for '${planId} for the given initial state and goal.'`)
  return null;
}

// Add a new node to the _open node collection.   If the key already exists
// then append it to the array at that key.
function AddToOpen( openNodes, newNode ) {
  let targetList = openNodes.get(newNode.score)
  if (targetList != undefined ) {
    //If the list exists we simply add the new node into it
    targetList.push(newNode);
  } else {
    //If the new node is the only one with a f value of X we have to allocate a new list for him
    openNodes.set(newNode.score, [newNode]);
  }
}

function closeNode( openNodes, closedNodes ) { // PlannerNode_GS 
  //Get open nodes listed with the cheapest cost
  let cheapestNodes = openNodes.min();
  //Get target node
  let target = cheapestNodes[0];
  //Store the last cheap node in the closed list
  closedNodes.set(target.id, target);
  //Remove the close node from the open list
  //If the removed node was the last we can remove the entire list for this key
  if (cheapestNodes.length == 1 ){
    openNodes.delete( target.score );
  } else {
    openNodes.set(target.score, cheapestNodes.slice(1));
  }
  //Return the closed node
  return target;
}

//Iterate all the open nodes and check if anyone has the target world 
// state as resultant world state
function IsInOpenNodes(modelId, properties, _open, target_worldstate) { // , out PlannerNode_GS found
  for (let [_,open_nodes] of _open.entries()) {
    for (let open_node of open_nodes) {
      const dist = distanceTo(modelId, properties, open_node.resultantState, target_worldstate, true)
      if ( dist === 0) return open_node
      return null
    }
  }
}

function TryGetValue( state, key, defaultValue ){
  const existingValue = state[key]
  if (existingValue) return existingValue
  if (defaultValue && key) state[key] = defaultValue
  return defaultValue
}

function isEnabled(modelId, properties, transition, state) {
  for ( const condition of Object.values(transition.conditions) ) {
    const currentProp = TryGetValue(state, condition.propertyId )
    if (!currentProp) {
      throwErr(modelId, `Can't determine if transition '${transition.id}' is enabled.  I refers to a property ${condition.propertyId} which cannot be found.`)
    }
    
    const { weight } = properties[ condition.propertyId ]
    if (condition.argumentId && condition.argumentId !== "") {
      const arg = {...TryGetValue(state, condition.argumentId,new PropertyValue({properties, id:condition.argumentId})), comparisonOperator: condition.comparisonOperator || "=="}
      const dist = distanceToProperty( currentProp, arg, weight, true )
      if (dist > MIN_PROPERTY_DISTANCE) {
        logger.info(`Transition ${transition.id} is DISABLED`)
        return false
      }
    } else {
      const dist = distanceToProperty( currentProp, { ...condition, comparisonOperator: condition.comparisonOperator || "=="}, weight, true )
      if (dist > MIN_PROPERTY_DISTANCE ) {
        logger.info(`Transition ${transition.id} is DISABLED`)
        return false
      }
    }
  }
  logger.info(`Transition ${transition.id} is ENABLED`)
  return true
}

/** Given two worldstates, compute the distance between them. 
 * Distance is computed as a weighted sum of the distance 
 * between their individual properties.
 * @param source - the source worldstate
 * @param target - the target worldstate
 * @param no_weighting - an optional parameter which controls whether
 *   how the weighted distance is computed.   When the parameter is true, 
 *   the distances are weighted equally, otherwise it uses the 
 *   planningCost for each parameter
 * NOTE: The the distance between two worldstates is NOT 
 *   symmetric.  This is due to the fact that the goal worldstate
 *   may have inequalities as goals, while the current state 
 *   will generally have only equality constraints.
 * Also note that the empty target state will match any worldstate.
 * This is consistent with our interpretation that a goal state is 
 * a list of conditions which all must be met.  Then the collection
 * is empty, then the goal is trivially satisfied.
*/
function distanceTo( modelId, properties, source, target, no_weighting=false ){
  let totalDistance = 0
  // Iterate over the conditions in the target state.
  // and compute the weighted sum of the distances between 
  // the corresponding properties in the source and target
  // worldstates.
  const makeArg = x => {
    const obj = {}
    obj[x.typeOf] = x.Value
    return obj
  }
  const objs = target.constructor.name === "Goal"
    ? Object.values(target.conditions)
    : Object.values(target).map( x => new Condition({properties, propertyId: x.id, comparisonOperator:"==", argument: makeArg(x) }))
  for (const v of objs) {
    // get the corresponding property from the current state
    const prop = TryGetValue( source, v.propertyId, new PropertyValue({properties, id: v.propertyId }) )
    if (prop == null) 
      throwErr(modelId,'Cannot compute distance between worldstates.'
        +`The target world state uses variable ${v.propertyId} that is not defined`)
    const {weight} = properties[prop.id]
    if (v.argumentId) {
      const temp = { ... TryGetValue( source, v.argumentId, new PropertyValue({properties, id: v.argumentId }) )}
      if (temp == null) 
        throwErr(modelId, 'Cannot compute distance between worldstates.'
        +`The goal state uses variable ${v.argumentId} that is not defined`)
      const arg = { ...temp, comparisonOperator: v.comparisonOperator  }
      // compute the weighted distance between the source and 
      // target properties and add it to the sum
      totalDistance += distanceToProperty(prop, arg, weight, no_weighting)
    } else {
      // compute the weighted distance between the source and 
      // target properties and add it to the sum
      totalDistance += distanceToProperty(prop, v, weight, no_weighting)
    }
  }
  return totalDistance
}

/** Given two properties, compute the weighted distance between them. 
 * @param source - the source property
 * @param target - the target property
 * @param no_weighting - an optional parameter which controls whether
 *   how the weighted distance is computed.   When the parameter is true, 
 *   the distances are multiplied by unity, otherwise distances are
 *   multiplied by teh planningCost
 * NOTE: The the distance between two worldstates is NOT 
 *   symmetric.  This is due to the fact that the goal worldstate
 *   may have inequalities as goals, while the current state 
 *   will generally have only equality constraints.
 * Also note that the empty target state will match any worldstate.
 * This is consistent with our interpretation that a goal state is 
 * a list of conditions which all must be met.  Then the collection
 * is empty, then the goal is trivially satisfied.
*/
function distanceToProperty( lhsProperty, rhsProperty, weight, no_weighting=false){
  // deconstruct the input to get the individual properties.
  const { typeOf: lhsType, value: lhsValue } = lhsProperty
  const { typeOf: rhsType, comparisonOperator:op, value: rhsValue } = rhsProperty
  const operator = op || "=="
  // If the types are incompatible, then throw an error.  In the future
  // we might consider upcasting (e.g. Int to Float) when possible.
  if ( lhsType !== rhsType ) throw new Error(`Comparsion type between variable: ${lhsType} and variable: ${rhsType} not supported!`)
  // Lookup the distance calculation to perform based on the 
  // type of the arguments and the comparison operation.
  const typeDef = Types[lhsType]
  if (typeDef == null) throw new Error(`Unsupported type ${lhsType} in distanceToProperty function`)
  const distance = typeDef.comparisonOperators[operator]
  if (distance == null) throw new Error( `The selected comparison operation ${operator} is not supported for ${lhsProperty.propertyId}: ${lhsType}.` ) 
  // compute and return the weighted distance
  const wt = no_weighting ? 1.0 : weight
  const d = distance(lhsValue, rhsValue) * wt
  return d
}

/** Given a transition and the current worldstate, compute
 * the result of applying the transition.   
 * @param transition - the transition to apply
 * @param current - the current worldstate
 * @returns a new worldstate representing the result of 
 *   apply the trasition to the the current state.
 * NOTE: This funciton does not check that the conditions for the 
 * transition are satisfied by the given worldstate; this
 * must be verified by the caller.
 */
function applyTransition(properties, transition, current) {
  //Allocate the new world state based in the current
  const newWorldState = new WorldState({ propertyValues: current,properties})
  // Apply each of the effects of the transition
  for (let effect of Object.values(transition.effects) ) {
    applyEffectToWorldstate(properties, newWorldState, effect)
  }
  return newWorldState
  
}

/** Given a worldstate and an effect, mutate the worldsate
 * to reflect the application of the effect.
 * @param worldstate - the worldstate to be mutated
 * @param effect - the effect to apply
 * @returns null (mutates the worldstate)
 */
function applyEffectToWorldstate( properties, worldstate, effect ) {
  let {propertyId, argumentId, typeOf } = effect
  let variable = TryGetValue( worldstate, propertyId, new PropertyValue({properties, id:propertyId} /* use default value */) )
  let rhs = TryGetValue( worldstate, argumentId, new PropertyValue({properties, id:propertyId ,typeOf,value:effect.value}))
  ApplyPropertyEffect( variable, effect.assignmentOperator, rhs )
}


function ApplyPropertyEffect( property, operator, argument ) {
  const typeDef = Types[property.typeOf]
  if (typeDef == null ) throw new Error (`Cannot apply effects.  Type ${property.typeOf} is not supported`)
  const op = typeDef.assignmentOperators[operator]
  if (op == null) throw new Error(`Cannot apply ${operator} operator to ${property.typeOf}`)
  op(property, argument.value)
}

function mkActionPlan( modelId, currentNode, initialState, worldstate, closedNodes, status ){
  //Allocate a new queue of actions to store the plan
  let actions = (currentNode.action)? [currentNode.action.action]: [];
  let firingSequence = (currentNode.action) ? [currentNode.action.id] : []
  const totalCost = currentNode.cost
  //Iterate goal node "childs" to start node using the parent id
  let i = 0
  while (i<ITERATION_LIMIT && currentNode.parentId != 0) {
    i ++
    //Update current node 
    currentNode = closedNodes.get(currentNode.parentId)
    //Check if the node has an action assigned.  If it is, add it 
    // to the action plan
    if (currentNode.action != null) {
      actions.push(currentNode.action.action);
      firingSequence.push(currentNode.action.id)
    }
  } 
  return {
    id: `${modelId}`,
    totalCost,
    totalSteps: firingSequence.length,
    transitions: firingSequence,
    actions,
    initialState: initialState.toGraphQL(),
    finalState: worldstate.toGraphQL(),
    status
  }
}

module.exports = (input,callback) => {
  try { 
    const data = generatePlan(input)
    callback(null,data)
  } catch (e) {
    callback(e,null)
  }
}