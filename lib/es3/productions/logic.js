const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { KW, PN, LPN, RPN, ref } = require('@cst-tokens/helpers/shorthand');
const { objectEntries } = require('@cst-tokens/helpers/iterable');

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
  'in',
  '<<',
  '>>',
]);

const productions = objectEntries({
  *UnaryExpression({ node }) {
    const lpn = yield* eatMatch(LPN`(`);

    if (!node.prefix || !unaryExpressionOperators.has(node.operator)) {
      throw new Error('Unsupported unary expression operator');
    }

    const operator = typeof node.operator === 'string' ? KW(node.operator) : PN(node.operator);
    yield* eat(operator, ref`argument`);

    if (lpn) yield* eat(RPN`)`);
  },

  *BinaryExpression({ node }) {
    if (!binaryExpressionOperators.has(node.operator)) {
      throw new Error('Unsupported binary expression operator');
    }

    const lpn = yield* eatMatch(LPN`(`);

    const operator = typeof node.operator === 'string' ? KW(node.operator) : PN(node.operator);
    yield* eat(ref`left`, operator, ref`right`);

    if (lpn) yield* eat(RPN`)`);
  },
});

module.exports = { productions };
