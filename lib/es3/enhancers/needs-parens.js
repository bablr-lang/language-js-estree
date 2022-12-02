// Original Copyright (c) 2014-present Sebastian McKenzie and babel contributors
// Modifications Copyright (c) 2022-present Conrad Buck and @cst-tokens/js-grammar-estree contributors

const { objectEntries } = require('@cst-tokens/helpers/iterable');
const { Grammar } = require('@cst-tokens/helpers/grammar');

const { Check } = require('../../utils/ast.js');
const { precedence } = require('../../precedence.js');
const { aliases } = require('../aliases.js');

const symbol = Symbol.for('@cst-tokens/enhancers/path/needsParens/es3');

const needsParensByPath = new WeakMap();

function callsMember(node) {
  return (
    needsParensGrammar.is('CallExpression', node.type) ||
    (needsParensGrammar.is('MemberExpression', node.type) && callsMember(node.object))
  );
}

const productions = objectEntries({
  Node() {
    return false;
  },

  UpdateExpression({ path }, grammar) {
    const { hasPostfixPart } = grammar.context;

    return hasPostfixPart(path);
  },

  ObjectExpression({ path }, grammar) {
    const { isFirstInContext } = grammar.context;

    return isFirstInContext(path, Check.expressionStatement);
  },

  Binary({ path }, grammar) {
    const { node, parentNode, parentNodeProperty } = path;
    const { hasPostfixPart } = grammar.context;

    if (hasPostfixPart(path) || path.matchParent('UnaryLike')) {
      return true;
    }

    if (path.matchParent('Binary')) {
      const parentOp = parentNode.operator;
      const parentPrec = precedence[parentOp];
      const nodeOp = node.operator;
      const nodePrec = precedence[nodeOp];

      if (
        // Logical expressions with the same precedence don't need parens.
        (parentPrec === nodePrec &&
          parentNodeProperty === 'right' &&
          !path.matchParent('LogicalExpression')) ||
        parentPrec > nodePrec
      ) {
        return true;
      }
    }
  },

  BinaryExpression({ path }) {
    const { node } = path;

    // let i = (1 in []);
    // for ((1 in []);;);
    return (
      node.operator === 'in' && (path.matchParent('VariableDeclarator') || path.matchParent('For'))
    );
  },

  SequenceExpression({ path }) {
    if (
      // Although parentheses wouldn't hurt around sequence
      // expressions in the head of for loops, traditional style
      // dictates that e.g. i++, j++ should not be wrapped with
      // parentheses.
      path.matchParent('ForStatement') ||
      path.matchParent('ThrowStatement') ||
      path.matchParent('ReturnStatement') ||
      path.matchParent('IfStatement', 'test') ||
      path.matchParent('WhileStatement', 'test') ||
      path.matchParent('ForInStatement', 'right') ||
      path.matchParent('SwitchStatement', 'discriminant') ||
      path.matchParent('ExpressionStatement', 'expression')
    ) {
      return false;
    }

    // Otherwise err on the side of overparenthesization, adding
    // explicit exceptions above if this proves overzealous.
    return true;
  },

  UnaryLike({ path }, grammar) {
    const { hasPostfixPart } = grammar.context;

    return hasPostfixPart(path);
  },

  FunctionExpression({ path }, grammar) {
    const { isFirstInContext } = grammar.context;

    return isFirstInContext(path, Check.expressionStatement);
  },

  ConditionalExpression({ path }, grammar) {
    return (
      path.matchParent('UnaryLike') ||
      path.matchParent('Binary') ||
      path.matchParent('ConditionalExpression', 'test') ||
      grammar.productionFor('UnaryLike')(arguments[0])
    );
  },

  AssignmentExpression(props, grammar) {
    return grammar.get('ConditionalExpression')(props);
  },

  OptionalMemberExpression({ path }) {
    return (
      path.matchParent('CallExpression', 'callee') || path.matchParent('MemberExpression', 'object')
    );
  },

  LogicalExpression({ path, node }) {
    return node.operator === '||' && path.parentNode.operator === '&&';
  },

  Expression({ path, node }, grammar, next) {
    return (path.matchParent('NewExpression', 'callee') && callsMember(node)) || next(arguments[0]);
  },
});

const needsParensGrammar = new Grammar({ productions, aliases });

const plugin = {
  symbol,
  version: '0.0.0',
  transformProduction(production) {
    return function withNeedsParens(props, grammar, next) {
      const { path, node } = props;

      needsParensByPath.set(path, needsParensGrammar.get(node.type)(props));

      return production(props, grammar, next);
    };
  },
};

module.exports = { symbol, grammar: needsParensGrammar, plugin, callsMember };
