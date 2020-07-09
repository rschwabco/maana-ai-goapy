const { log } = require('io.maana.shared')

function assignEqual(prop, value) {
  prop.operator = '='
  prop.value = value
}

const MIN_PROPERTY_DISTANCE = 0.00001
const ITERATION_LIMIT = 100000
const logger = log(process.env.SERVICE_ID || 'maana-service')

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
    prop.value = op(prop.value, value)
  }
}


module.exports = {
  MIN_PROPERTY_DISTANCE,
  ITERATION_LIMIT,
  logger,
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
        '^=': assignOp((x, y) => x ? !y : y),
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
        '-=': assignOp((x, y) => x - y)
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
      }

    }
  }
}
