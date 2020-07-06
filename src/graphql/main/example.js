'use strict'
const { generatePlan } = require('./plan')
const { Worldstate } = require('./Types/WorldState')
const { Binding } = require('./types/Binding')
const { Transition } = require('./Types/Transition')
const { Property } = require('./Types/Property')

const properties =  [
    new Property( { name: "hunger", typeOf: "INT" } ),
    new Property( { name: "tired", typeOf: "INT" } )
]

  const goal = {
    conditions:[{
        propertyName: 'hunger',
        operator: '<',
        argument: { id: "1:INT", propertyName: "tired"},
      }
    ]
  }
  
  const eat = {
    id: 'eat',
    description: '',
    cost: 1,
    conditions: [
      {
        propertyName: 'hunger',
        operator: '>=',
        argument: { id: "0:INT", propertyName:"tired"},
      }
    ],
    action:"EAT",
    effects: [{
      propertyName: 'hunger',
      operator: '-=',
      argument:{ id: "1:INT", INT: 1 }
    },
    {
      propertyName: 'tired',
      operator: '+=',
      argument: { id: "0.5:FLOAT", INT: 1}
    }
  ]
  }
  
const goapmodel = {
    id: "my-goap-model",
    description: "Things and stuff",
    properties,
    transitions: [eat]
}

const initialState = {
  bindings: [{ 
      propertyName: 'hunger',
      value: { id: "5:INT", INT: 5 }
    
    },
    { 
      propertyName: 'tired',
      value: { id: "0:INT", INT: 0 }}]
}

console.debug(JSON.stringify(generatePlan({model:goapmodel,initialState,goal}),null,2))
