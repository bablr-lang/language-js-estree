const { map } = require('@cst-tokens/helpers/iterable');
const {
  isCallExpression,
  isMemberExpression,
  isNewExpression,
  isOptionalCallExpression,
  isOptionalMemberExpression,
  isTaggedTemplateExpression,
} = require('@babel/types');

const { WithSeparator } = require('../meta-productions.js');
const { isFirstInContext } = require('../utils/ast.js');
const { context: es5Context } = require('../es5/context.js');
const { needsParensGrammar } = require('./needs-parens-visitors.js');
const { getIdentifierDescriptor } = require('./identifier.js');
const { productions } = require('./productions/index.js');

const hasPostfixPart = (path) => {
  const { node, parentNode } = path;

  ((isMemberExpression(parentNode) || isOptionalMemberExpression(parentNode)) &&
    parentNode.object === node) ||
    ((isCallExpression(parentNode) ||
      isOptionalCallExpression(parentNode) ||
      isNewExpression(parentNode)) &&
      parentNode.callee === node) ||
    (isTaggedTemplateExpression(parentNode) && parentNode.tag === node);
};

const context = {
  ...es5Context,
  esVersion: 6,
  getIdentifierDescriptor,
  needsParensGrammar,
  hasPostfixPart,
  isFirstInContext: (path, check) => isFirstInContext(hasPostfixPart, path, check),
};

const grammar = {
  context,
  productions: map(productions, ([type, production]) => {
    return [type, type === 'CSTFragment' ? production : WithSeparator(production)];
  }),
};

module.exports = { grammar, context, productions, default: grammar };
