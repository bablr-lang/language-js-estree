const { eat } = require('@cst-tokens/helpers');
const {
  StringStart,
  StringEnd,
  String,
  Number,
  Boolean,
  Null,
  RegularExpression,
} = require('../descriptors.js');
const { isObject } = require('../utils/object.js');

function* StringLiteral(path) {
  const { value } = path.node;
  const start = yield* eat(StringStart());
  const quot = start.find((token) => token.type === 'StringStart').value;
  yield* eat(String(value, [quot]), StringEnd(quot));
}

function* NumericLiteral(path) {
  const { value } = path.node;
  yield* eat(Number(value));
}

function* BooleanLiteral(path) {
  const { value } = path.node;
  yield* eat(Boolean(value));
}

function* NullLiteral() {
  yield* eat(Null());
}

function* RegExpLiteral(path) {
  const { pattern, regex } = path.node;
  if (isObject(pattern)) {
    // this is an embedded regexpp AST
    throw new Error('not implemented');
  } else {
    yield* eat(RegularExpression(`/${regex.pattern}/${regex.flags}`));
  }
}

const generators = {
  StringLiteral,
  NumericLiteral,
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
    } else {
      throw new SyntaxError('Unknown literal type');
    }
  },
};

module.exports = { generators };
