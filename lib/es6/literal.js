const { eat, ref } = require('@cst-tokens/helpers');
const {
  StringStart,
  StringEnd,
  Quasi,
  InterpolateStart,
  InterpolateEnd,
} = require('../descriptors.js');

const generators = {
  *TemplateElement(path) {
    const { value } = path.node;
    const { cooked, raw } = value;

    if (raw.length || cooked?.length) {
      yield* eat(Quasi(value));
    }
  },
  *TemplateLiteral(path) {
    const { expressions, quasis } = path.node;

    if (quasis.length - expressions.length !== 1) {
      throw new Error('invalid template literal');
    }

    yield* eat(StringStart('`'));

    let i = 0;
    for (const quasi of quasis) {
      yield* eat(ref`quasis`);
      if (expressions[i]) {
        yield* eat(InterpolateStart('${'));
        yield* eat(ref`expressions`);
        yield* eat(InterpolateEnd('}'));
      }
      i++;
    }

    yield* eat(StringEnd('`'));
  },
};

module.exports = { generators };
