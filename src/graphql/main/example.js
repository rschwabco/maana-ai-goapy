'use strict'
const { generatePlan } = require('./plan')
const { Worldstate } = require('./Types/WorldState')
const { Binding } = require('./types/Binding')
const { Transition } = require('./Types/Transition')
const { Property } = require('./Types/Property')

const properties =  [
    new Property( { name: "hunger", typeOf: "INT" } ),
    new Property( { name: "tired", typeOf: "FLOAT" } )
]

  const goal = {
    conditions:[{
        propertyName: 'hunger',
        operator: '<',
        argument: { id: "1:INT", INT: 1},
      },
      {
        propertyName: 'tired',
        operator: '<',
        argument: { id: "5:FLOAT", FLOAT: 5},
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
        operator: '>',
        argument: { id: "0:INT", INT:0},
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
      argument: { id: "0.5:FLOAT", FLOAT: 0.5}
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
    }]
}


generatePlan({model:goapmodel,initialState,goal})