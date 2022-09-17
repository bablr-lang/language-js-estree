const { eat, ref } = require('@cst-tokens/helpers');
const { KW } = require('../descriptors.js');

const unaryExpressionOperators = new Set(['+', '-', '~', 'typeof', 'void', 'delete']);
const binaryExpressionOperators = new Set([
  '+',
  '-',
  '*',
  '**',
  '/',
  '&&',
  '||',
  '&',
  '|',
  '^',
  '==',
  '===',
  '!=',
  '!==',
  '<',
  '<=',
  '>',
  '>=',
  'instanceof',
  '<<',
  '>>',
]);

const generators = {
  *UnaryExpression(path) {
    const { node } = path;

    if (!node.prefix || !unaryExpressionOperators.has(node.operator)) {
      throw new Error('Unsupported unary expression operator');
    }

    const operator = typeof node.operator === 'string' ? KW(node.operator) : PN(node.operator);
    yield* eat(operator, ref`argument`);
  },

  *BinaryExpression(path) {
    const { node } = path;
    if (!binaryExpressionOperators.has(node.operator)) {
      throw new Error('Unsupported binary expression operator');
    }

    const operator = typeof node.operator === 'string' ? KW(node.operator) : PN(node.operator);
    yield* eat(ref`left`, operator, ref`right`);
  },
};

module.exports = { generators };
