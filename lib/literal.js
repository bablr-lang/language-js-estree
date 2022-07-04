const { take } = require('cst-tokens/commands');
const { STR, NUM, BOOL, NULL } = require('@cst-tokens/js-descriptors');
const { isObject } = require('./utils/object');

function* StringLiteral(path) {
  const { node } = path;
  yield take(STR(node.value));
}

function* NumericLiteral() {
  const { node } = path;
  yield take(NUM(node.value));
}

function* BooleanLiteral(path) {
  const { node } = path;
  yield take(BOOL(node.value));
}

function* NullLiteral() {
  yield take(NULL());
}

function* RegExpLiteral(path, context) {
  const { node } = path;
  if (isObject(node.pattern)) {
    // this is an embedded regexpp AST
    throw new Error('not implemented');
  } else {
    yield take(RE(`/${node.regex.pattern}/${node.regex.flags}`));
  }
}

const visitors = {
  StringLiteral,
  NumericLiteral,
  BigIntLiteral,
  BooleanLiteral,
  NullLiteral,
  RegExpLiteral,
  *Literal(path, context) {
    const { node } = path;
    if (node.regex) {
      yield* RegExpLiteral(path, context);
    } else if (typeof node.value === 'string') {
      yield* StringLiteral(path, context);
    } else if (typeof node.value === 'number') {
      yield* NumericLiteral(path, context);
    } else if (typeof node.value === 'boolean') {
      yield* BooleanLiteral(path, context);
    } else if (node.value === null) {
      yield* NullLiteral(path, context);
    }
  },
};

module.exports = { visitors };
