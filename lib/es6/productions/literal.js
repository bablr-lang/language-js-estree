const { eat } = require('@cst-tokens/helpers/commands');
const { ref } = require('@cst-tokens/helpers/shorthand');
const { objectEntries } = require('@cst-tokens/helpers/iterable');

const {
  Quasi,
  InterpolateStart,
  InterpolateEnd,
  StringStart,
  StringEnd,
} = require('../descriptors.js');

const productions = objectEntries({
  *TemplateElement({ node }) {
    if (node.value.raw.length) {
      yield* eat(Quasi(node.value));
    }
  },
  *TemplateLiteral({ node }) {
    if (node.quasis.length - node.expressions.length !== 1) {
      throw new Error('invalid template literal');
    }

    yield* eat(StringStart('`'));

    let i = 0;
    for (const _ of node.quasis) {
      yield* eat(ref`quasis`);
      if (node.expressions[i]) {
        yield* eat(InterpolateStart('${'));
        yield* eat(ref`expressions`);
        yield* eat(InterpolateEnd('}'));
      }
      i++;
    }

    yield* eat(StringEnd('`'));
  },
});

module.exports = { productions };
