'use strict'
const { generatePlan } = require('./plan')
const { Worldstate } = require('./types/WorldState')
const { Binding } = require('./types/Binding')
const { Transition } = require('./types/Transition')
const { Property } = require('./types/Property')

const properties = [
  new Property({ id: 'hunger', typeOf: 'INT' }),
  new Property({ id: 'tired', typeOf: 'INT' }),
  new Property({ id: 'toggle', typeOf: 'BOOLEAN' })
]

const goal = [
  {
    propertyId: 'hunger',
    operator: '<',
    argument: { propertyId: 'tired' }
  }
]

const eat = {
  id: 'eat',
  description: '',
  cost: 1,
  conditions: [
    {
      propertyId: 'hunger',
      operator: '>=',
      argument: { id: '0:INT', propertyId: 'tired' }
    }
  ],
  action: 'EAT',
  effects: [
    {
      propertyId: 'hunger',
      operator: '-=',
      argument: { id: '1:INT', INT: 1 }
    },
    {
      propertyId: 'tired',
      operator: '+=',
      argument: { id: '0.5:FLOAT', INT: 1 }
    },
    {
      propertyId: 'toggle',
      operator: '^=',
      argument: { BOOLEAN: true }
    }
  ]
}

const transitions = [eat]

const initialState = [
  {
    id: 'hunger',
    INT: 5
  },
  {
    id: 'tired',
    INT: 0
  },
  {
    id: 'toggle',
    BOOLEAN: true
  }
]

// console.debug(
//   JSON.stringify(
//     generatePlan({ properties, transitions, initialState, goal }),
//     null,
//     2
//   )
// )
