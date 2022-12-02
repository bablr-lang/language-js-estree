// Original Copyright (c) 2014-present Sebastian McKenzie and babel contributors
// Modifications Copyright (c) 2022-present Conrad Buck and @cst-tokens/js-grammar-estree contributors

const {
  isArrowFunctionExpression,
  isAssignmentExpression,
  isBinary,
  isUpdateExpression,
  isConditional,
  isExportDefaultDeclaration,
  isExpressionStatement,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isNewExpression,
  isSequenceExpression,
} = require('@babel/types');

const Check = {
  none: 0,
  expressionStatement: 1 << 0,
  arrowBody: 1 << 1,
  exportDefault: 1 << 2,
  forHead: 1 << 3,
  forInHead: 1 << 4,
  forOfHead: 1 << 5,
};

// Walk up the print stack to determine if our node can come first
// in a particular context.
function isFirstInContext(hasPostfixPart, path, check) {
  const expressionStatement = check & Check.expressionStatement;
  const arrowBody = check & Check.arrowBody;
  const exportDefault = check & Check.exportDefault;
  const forHead = check & Check.forHead;
  const forInHead = check & Check.forInHead;
  const forOfHead = check & Check.forOfHead;

  let node = path;
  let { parent } = path;

  if (!parent) return false;

  while (parent) {
    if (
      (expressionStatement && isExpressionStatement(parent, { expression: node })) ||
      (exportDefault && isExportDefaultDeclaration(parent, { declaration: node })) ||
      (arrowBody && isArrowFunctionExpression(parent, { body: node })) ||
      (forHead && isForStatement(parent, { init: node })) ||
      (forInHead && isForInStatement(parent, { left: node })) ||
      (forOfHead && isForOfStatement(parent, { left: node }))
    ) {
      return true;
    }

    if (
      parent.parent &&
      ((hasPostfixPart(path) && !isNewExpression(parent)) ||
        (isSequenceExpression(parent) && parent.expressions[0] === node) ||
        (isUpdateExpression(parent) && !parent.prefix) ||
        isConditional(parent, { test: node }) ||
        isBinary(parent, { left: node }) ||
        isAssignmentExpression(parent, { left: node }))
    ) {
      node = parent;
      ({ parent } = node);
    } else {
      return false;
    }
  }

  return false;
}

module.exports = { Check, isFirstInContext };
