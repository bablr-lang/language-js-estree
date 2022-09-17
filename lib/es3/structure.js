const { eat, eatMatch, ref } = require('@cst-tokens/helpers');
const { PN, LPN, RPN } = require('../descriptors.js');
const { commaSeparatedList } = require('../common.js');

const generators = {
  *ArrayExpression(path) {
    const { elements } = path.node;

    yield* eat(LPN`[`);

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const trailing = i === elements.length - 1;

      if (element !== null) {
        yield* eat(ref('elements'));
      }

      if (!trailing) {
        yield* eat(PN`,`);
      } else {
        yield* eatMatch(PN`,`);
      }
    }

    yield* eat(RPN`]`);
  },

  *ObjectExpression(path) {
    yield* eat(LPN`{`);
    yield* commaSeparatedList(path.node, 'properties', { allowTrailing: false });
    yield* eat(RPN`}`);
  },

  *Property() {
    yield* eat(ref`key`, PN`:`, ref`value`);
  },

  *MemberExpression(path) {
    const { computed } = path.node;

    yield* eat(ref`object`);

    if (computed) {
      yield* eat(LPN`[`, ref`property`, RPN`]`);
    } else {
      yield* eat(PN`.`, ref`property`);
    }
  },
};

module.exports = { generators };
