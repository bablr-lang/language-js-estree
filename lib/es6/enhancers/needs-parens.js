// Original Copyright (c) 2014-present Sebastian McKenzie and babel contributors
// Modifications Copyright (c) 2022-present Conrad Buck and @cst-tokens/js-grammar-estree contributors

const { objectEntries } = require('@cst-tokens/helpers/iterable');
const { Grammar } = require('@cst-tokens/helpers/grammar');

const { Check } = require('../../utils/ast.js');
const { callsMember, grammar: base } = require('../../es3/enhancers/needs-parens.js');
const { aliases } = require('../aliases.js');

const symbol = Symbol.for('@cst-tokens/enhancers/path/needsParens/es6');

const needsParensByPath = new WeakMap();

const productions = objectEntries({
  Node() {
    return false;
  },

  UpdateExpression({ path }, grammar) {
    return grammar.base.visit(path) || path.matchParent('Class', 'superClass');
  },

  ObjectExpression({ path }, grammar) {
    const { context } = grammar;
    const { isFirstInContext } = context;

    return grammar.base.visit(path) | isFirstInContext(path, Check.arrowBody);
  },

  DoExpression({ path }, grammar) {
    const { node } = path;
    const { isFirstInContext } = grammar.context;

    // `async do` can start an expression statement
    return !node.async && isFirstInContext(path, Check.expressionStatement);
  },

  Binary({ path }, grammar) {
    const { node, parentNode } = path;

    if (
      node.operator === '**' &&
      path.matchParent('BinaryExpression') &&
      parentNode.operator === '**'
    ) {
      return parentNode.left === node;
    }

    if (path.matchParent('Class', 'superClass') || path.matchParent('AwaitExpression')) {
      return true;
    }

    return grammar.base.visit(path);
  },

  YieldExpression({ path }, grammar) {
    const { node } = path;
    const { hasPostfixPart } = grammar.context;

    const isAwait = grammar.is('AwaitExpression', node.type);

    return (
      path.matchParent('Binary') ||
      path.matchParent('UnaryLike') ||
      hasPostfixPart(path) ||
      path.matchParent('ConditionalExpression', 'test') ||
      (!isAwait && path.matchParent('AwaitExpression')) ||
      path.matchParent('Class', 'superClass')
    );
  },

  AwaitExpression(props, grammar) {
    return grammar.get('YieldExpression')(props, grammar);
  },

  ClassExpression({ path }, grammar) {
    const { isFirstInContext } = grammar.context;

    return isFirstInContext(path, Check.expressionStatement | Check.exportDefault);
  },

  UnaryLike({ path }, grammar) {
    const { parentNode } = path;

    return (
      grammar.base.visit(path) ||
      (path.matchParent('BinaryExpression', 'left') && parentNode.operator === '**') ||
      path.matchParent('Class', 'superClass')
    );
  },

  FunctionExpression({ path, context, grammar }) {
    const { isFirstInContext } = context;

    return grammar.base.visit(path) || isFirstInContext(path, Check.exportDefault);
  },

  ArrowFunctionExpression(props, grammar) {
    const { path } = props;

    return path.matchParent('ExportDeclaration') || grammar.get('ConditionalExpression')(props);
  },

  LogicalExpression({ path, node }) {
    const { parentNode } = path;

    switch (node.operator) {
      case '||':
        return (
          path.matchParent('LogicalExpression') &&
          (parentNode.operator === '??' || parentNode.operator === '&&')
        );
      case '&&':
        return path.matchParent('LogicalExpression') && parentNode.operator === '??';
      case '??':
        return path.matchParent('LogicalExpression') && parentNode.operator !== '??';
    }
  },

  ConditionalExpression(props, grammar) {
    const { path } = props;

    if (grammar.base.visit(path) || path.matchParent('AwaitExpression')) {
      return true;
    }

    return grammar.for('UnaryLike')(props, grammar);
  },

  AssignmentExpression(props, grammar) {
    const { path } = props;
    const { node } = path;

    return grammar.base.visit(props) || grammar.is('ObjectPattern', node.left.type);
  },

  OptionalMemberExpression({ path }) {
    return (
      path.matchParent('CallExpression', 'callee') || path.matchParent('MemberExpression', 'object')
    );
  },

  OptionalCallExpression(props, grammar) {
    return grammar.get('OptionalMemberExpression')(props, grammar);
  },

  Identifier({ path }, grammar) {
    const { node, parentNode } = path;
    const { isFirstInContext } = grammar.context;

    // Non-strict code allows the identifier `let`, but it cannot occur as-is in
    // certain contexts to avoid ambiguity with contextual keyword `let`.
    if (node.name === 'let') {
      // Some contexts only forbid `let [`, so check if the next token would
      // be the left bracket of a computed member expression.
      const isFollowedByBracket =
        (grammar.matchParent('MemberExpression', 'object') && parentNode.computed) ||
        (grammar.matchParent('OptionalMemberExpression', 'object') &&
          parentNode.computed &&
          !parentNode.optional);

      return isFirstInContext(
        path,
        isFollowedByBracket
          ? Check.expressionStatement | Check.forHead | Check.forInHead | Check.forOfHead
          : Check.forOfHead,
      );
    }

    // ECMAScript specifically forbids a for-of loop from starting with the
    // token sequence `for (async of`, because it would be ambiguous with
    // `for (async of => {};;)`, so we need to add extra parentheses.
    //
    // If the parent is a for-await-of loop (i.e. parent.await === true), the
    // parentheses aren't strictly needed, but we add them anyway because
    // some tools (including earlier Babel versions) can't parse
    // `for await (async of [])` without them.
    return node.name === 'async' && grammar.matchParent('ForOfStatement', 'left');
  },

  Expression({ path, node }, grammar, next) {
    return (path.matchParent('NewExpression', 'callee') && callsMember(node)) || next(arguments[0]);
  },
});

const needsParensGrammar = new Grammar({ base, productions, aliases });

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

module.exports = { symbol, productions, plugin };
