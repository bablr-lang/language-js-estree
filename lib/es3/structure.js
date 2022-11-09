const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, ref } = require('@cst-tokens/helpers/shorthand');
const { commaSeparatedList } = require('../common.js');

const generators = {
  *ArrayExpression(path) {
    const { elements } = path.node;

    const lpn = yield* eatMatch(LPN`(`);

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

    if (lpn) yield* eat(RPN`)`);
  },

  *ObjectExpression(path) {
    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(LPN`{`);
    yield* commaSeparatedList(path.node, 'properties', { allowTrailing: false });
    yield* eat(RPN`}`);

    if (lpn) yield* eat(RPN`)`);
  },

  *Property() {
    yield* eat(ref`key`, PN`:`, ref`value`);
  },

  *MemberExpression(path) {
    const { computed } = path.node;

    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(ref`object`);

    if (computed) {
      yield* eat(LPN`[`, ref`property`, RPN`]`);
    } else {
      yield* eat(PN`.`, ref`property`);
    }

    if (lpn) yield* eat(RPN`)`);
  },
};

module.exports = { generators };
