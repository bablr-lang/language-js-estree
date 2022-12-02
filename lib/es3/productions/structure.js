const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, ref } = require('@cst-tokens/helpers/shorthand');
const { objectEntries } = require('@cst-tokens/helpers/iterable');

const { commaSeparatedList } = require('../../meta-productions.js');

const productions = objectEntries({
  *Program({ node }) {
    if (node.directives) {
      yield* eat(...node.directives.map(() => ref`directives`));
    }
    if (node.body) {
      yield* eat(...node.body.map(() => ref`body`));
    }
  },

  *ArrayExpression({ node }) {
    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(LPN`[`);

    for (let i = 0; i < node.elements.length; i++) {
      const element = node.elements[i];
      const trailing = i === node.elements.length - 1;

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

  *ObjectExpression({ node }) {
    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(LPN`{`);
    yield* commaSeparatedList(node, 'properties', { allowTrailing: false });
    yield* eat(RPN`}`);

    if (lpn) yield* eat(RPN`)`);
  },

  *Property() {
    yield* eat(ref`key`, PN`:`, ref`value`);
  },

  *MemberExpression({ node }) {
    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(ref`object`);

    if (node.computed) {
      yield* eat(LPN`[`, ref`property`, RPN`]`);
    } else {
      yield* eat(PN`.`, ref`property`);
    }

    if (lpn) yield* eat(RPN`)`);
  },
});

module.exports = { productions };
