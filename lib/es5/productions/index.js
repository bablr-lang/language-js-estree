const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { concat, objectEntries } = require('@cst-tokens/helpers/iterable');

const { SymbolDefinition } = require('../../descriptors.js');
const { commaSeparatedList } = require('../../meta-productions.js');
const { productions: es3Productions } = require('../es3/index.js');

const propertyKinds = ['get', 'set', 'init'];

const productions = concat(
  es3Productions,
  objectEntries({
    *ObjectExpression({ node }) {
      const lpn = yield* eatMatch(LPN`(`);

      yield* eat(LPN`{`);
      // allow trailing commas -- es3 doesn't
      yield* commaSeparatedList(node, 'properties');
      yield* eat(RPN`}`);

      if (lpn) yield* eat(RPN`)`);
    },

    *Property({ node }) {
      if (node.kind && !propertyKinds.includes(node.kind)) {
        throw new Error('invalid property kind');
      }

      if (node.kind === 'get' || node.kind === 'set') {
        yield* eat(KW(node.kind));
      }

      if (node.value.type === 'FunctionExpression' && node.method) {
        // This is a shorthand method like `{ fn (arg) {} }`
        // This has some problems with source locality. In the given example:
        //   `async` belongs to `value`
        //   `fn` belongs to `node`
        //   `(arg) {}` belongs to `value`
        // For this reason I treat all the tokens as belonging to `value`
        yield* eat(ref`value`);
      } else {
        yield* eat(ref`key`, PN`:`, ref`value`);
      }
    },

    *FunctionExpression({ path, node }) {
      const { parentNode } = path;
      const isObjectShorthand = parentNode.type === 'Property' && parentNode.method;

      const lpn = !isObjectShorthand && (yield* eatMatch(LPN`(`));

      if (!isObjectShorthand) {
        yield* eat(KW`function`);
      }

      if (node.id) {
        yield* eat(ref`id`);
      } else if (isObjectShorthand) {
        yield* eat(SymbolDefinition(parentNode.key.name));
      }

      yield* eat(LPN`(`);
      yield* commaSeparatedList(node, 'params', { allowTrailing: false });
      yield* eat(RPN`)`, ref`body`);

      if (lpn) yield* eat(RPN`)`);
    },
  }),
);

module.exports = { productions };
