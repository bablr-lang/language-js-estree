const { eat } = require('@cst-tokens/helpers/commands');
const {
  String,
  StringStart,
  StringEnd,
  Number,
  Boolean,
  Null,
  RegularExpression,
} = require('../descriptors.js');
const { isObject } = require('../utils/object.js');

function* StringLiteral(path) {
  const { value } = path.node;
  let q;
  [q] = yield* eat(StringStart());
  yield* eat(String(value, [q.value]));
  yield* eat(StringEnd(q.value));
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
