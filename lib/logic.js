const { take } = require('cst-tokens/commands');
const { KW, ref, _, __ } = require('@cst-tokens/js-descriptors');

const unaryExpressionOperators = new Set('+', '-', '~', 'typeof', 'void');
const binaryExpressionOperators = new Set(
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
);

const visitors = {
  *UnaryExpression(path) {
    const { node } = path;

    if (!node.prefix || !unaryExpressionOperators.has(node.operator)) {
      throw new Error('Unsupported unary expression operator');
    }

    const space = typeof node.operator === 'string' ? __ : _;
    yield take(KW(node.operator), space, ref`argument`);
  },

  *BinaryExpression(path) {
    const { node } = path;
    if (!binaryExpressionOperators.has(node.operator)) {
      throw new Error('Unsupported unary expression operator');
    }

    const space = typeof node.operator === 'string' ? __ : _;
    yield take(ref`left`, space, KW(node.operator), space, ref`right`);
  },
};

module.exports = { visitors };
