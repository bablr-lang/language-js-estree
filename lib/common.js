const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, ref } = require('@cst-tokens/helpers/shorthand');
const { Bag } = require('@cst-tokens/helpers/generators');
const { LineBreak } = require('@cst-tokens/helpers/descriptors');

const {
  LineCommentStart,
  LineComment,
  BlockCommentStart,
  BlockComment,
  BlockCommentEnd,
  Whitespace,
} = require('./descriptors.js');

function* Comment(path, context, getState) {
  if (!getState().source) {
    return null;
  }

  if (yield* eatMatch(BlockCommentStart())) {
    yield* eatMatch(BlockComment());
    yield* eat(BlockCommentEnd());
  } else if (yield* eatMatch(LineCommentStart())) {
    yield* eatMatch(LineComment());
    yield* eat(LineBreak());
  }
}

function* Separator(path, context, getState) {
  return getState().source
    ? yield* Bag([Whitespace(), LineBreak(), Comment])
    : [Whitespace().build()];
}

// Handy for debugging
// const Separator = Whitespace();

function* commaSeparatedList(node, name, options = {}) {
  const { allowTrailing = true } = options;
  const list = node[name];

  for (let i = 0; i < list.length; i++) {
    const trailing = i === list.length - 1;
    if (!trailing) {
      yield* eat(ref(name), PN`,`);
    } else {
      yield* eat(ref(name));
      if (allowTrailing) {
        yield* eatMatch(PN`,`);
      }
    }
  }
}

module.exports = { Comment, Separator, commaSeparatedList };
