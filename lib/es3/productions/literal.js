const { eat } = require('@cst-tokens/helpers/commands');
const { objectEntries } = require('@cst-tokens/helpers/iterable');

const {
  String,
  StringStart,
  StringEnd,
  Number,
  Boolean,
  Null,
  RegularExpression,
  SymbolReference,
} = require('../../descriptors.js');
const { isObject } = require('../../utils/object.js');

function* StringLiteral({ node }) {
  let q;

  [q] = yield* eat(StringStart());
  yield* eat(String(node.value, [q.value]));
  yield* eat(StringEnd(q.value));
}

function* NumericLiteral({ node }) {
  yield* eat(Number(node.value));
}

function* BooleanLiteral({ node }) {
  yield* eat(Boolean(node.value));
}

function* NullLiteral() {
  yield* eat(Null());
}

function* RegExpLiteral({ node }) {
  if (isObject(node.pattern)) {
    // this is an embedded regexpp AST
    throw new Error('not implemented');
  } else {
    yield* eat(RegularExpression(`/${node.regex.pattern}/${node.regex.flags}`));
  }
}

const productions = objectEntries({
  *Identifier({ path, node, grammar }) {
    const { getIdentifierDescriptor } = grammar.context;
    const Descriptor = getIdentifierDescriptor(path) || SymbolReference;

    yield* eat(Descriptor(node.name));
  },

  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  NullLiteral,
  RegExpLiteral,
  *Literal(props) {
    const { node } = props;

    if (node.regex) {
      yield* RegExpLiteral(props);
    } else if (typeof node.value === 'string') {
      yield* StringLiteral(props);
    } else if (typeof node.value === 'number') {
      yield* NumericLiteral(props);
    } else if (typeof node.value === 'boolean') {
      yield* BooleanLiteral(props);
    } else if (node.value === null) {
      yield* NullLiteral(props);
    } else {
      throw new SyntaxError('Unknown literal type');
    }
  },
});

module.exports = { productions };
