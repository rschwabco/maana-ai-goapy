const { log } = require('io.maana.shared')

function assignEqual(prop, value) {
  prop.operator = '='
  prop.setValue(value)
}

const MIN_PROPERTY_DISTANCE = 0.00001
const ITERATION_LIMIT = 100
const logiclogger = log(`${process.env.SERVICE_ID}-logic` || 'maana-service')
const persistlogger = log(`${process.env.SERVICE_ID}-persist` || 'maana-service')
const logger = log(`${process.env}-persist` || 'maana-service')

function equalityDistance(lhs, rhs) { return lhs === rhs ? 0.0 : 1.0 }
function disequalityDistance(lhs, rhs) { return lhs !== rhs ? 0.0 : 1.0 }
function partialOrderDistance(op) {
  return function (lhs, rhs) {
    return op(lhs, rhs) ? 0.0 : Math.abs(lhs - rhs)
  }
}
function totalOrderDistance(op) {
  return function (lhs, rhs) {
    return op(lhs - rhs, 0) ? 0 : Math.abs(rhs - lhs) < 2 * MIN_PROPERTY_DISTANCE ? 2 * MIN_PROPERTY_DISTANCE : Math.abs(lhs - rhs)
  }
}

function assignOp(op) {
  return function (prop, value) {
    prop.setValue(op(prop.value, value))
  }
}

function getOperatorDescription(id) {
 const tooltips = {
  '==': 'Is equal to',
  '!=': 'Is not equal to',
  '>': 'Greater than',
  '>=': 'Equal or greater than',
  '<': 'Less than',
  '<=': 'Equal or less than',
  '=': 'Assign to',
  '+=': 'Add',
  '-=': 'Subtract',
  '&=': 'Logical AND',
  '^=': 'Logical exclusive OR',
  '|=': 'Logical OR',
  '/=': 'Divide by',
  '%=': 'Integer remainder',
  '*=': 'Multiply by'
 }
 
 return tooltips[id] ? tooltips[id] : ''
}

function getOperatorExample(id) {
 const tooltips = {
  '==': '',
  '!=': '',
  '>': '',
  '>=': '',
  '<': '',
  '<=': '',
  '=': '',
  '+=': '',
  '-=': '',
  '/=': '',
  '*=': '',
  '&=': 'Needs example',
  '^=': 'Needs example',
  '|=': 'Needs example',
  '%=': 'Needs example',
 }
 
 return tooltips[id] ? tooltips[id] : ''
}

module.exports = {
  MIN_PROPERTY_DISTANCE,
  ITERATION_LIMIT,
  logiclogger,
  logger,
  persistlogger,
  getOperatorDescription,
  getOperatorExample,
  Types: {
    "BOOLEAN": {
      defaultValue: false,
      comparisonOperators: {
        '==': equalityDistance,
        '!=': disequalityDistance
      },
      assignmentOperators: {
        '=': assignEqual,
        '&=': assignOp((x, y) => x && y),
        '^=': assignOp((x, y) => (x && !y) || (y && !x)),
        '|=': assignOp((x, y) => x || y),
      },
    },
    "STRING": {
      defaultValue: "",
      comparisonOperators: {
        '==': equalityDistance,
        '!=': disequalityDistance
      },
      assignmentOperators: {
        '=': assignEqual,
      },
    },
    "INT": {
      defaultValue: 0,
      comparisonOperators: {
        '==': equalityDistance,
        '!=': disequalityDistance,
        '>': totalOrderDistance((a, b) => a > b),
        '>=': partialOrderDistance((a, b) => a >= b),
        '<': totalOrderDistance((a, b) => a < b),
        '<=': partialOrderDistance((a, b) => a <= b)
      },
      assignmentOperators: {
        '=': assignEqual,
        '+=': assignOp((x, y) => x + y),
        '-=': assignOp((x, y) => x - y),
        '*=': assignOp((x, y) => x * y),
        '/=': assignOp((x, y) => Math.round(x / y)),
        '%=': assignOp((x, y) => x % y)
      }
    },
    "FLOAT": {
      defaultValue: 0,
      comparisonOperators: {
        '==': equalityDistance,
        '!=': disequalityDistance,
        '>': totalOrderDistance((a, b) => a > b),
        '>=': partialOrderDistance((a, b) => a >= b),
        '<': totalOrderDistance((a, b) => a < b),
        '<=': partialOrderDistance((a, b) => a <= b)
      },
      assignmentOperators: {
        '=': assignEqual,
        '+=': assignOp((x, y) => x + y),
        '-=': assignOp((x, y) => x - y),
        '*=': assignOp((x, y) => x * y),
        '/=': assignOp((x, y) => x / y)
      }

    }
  }
}
