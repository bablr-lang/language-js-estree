const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { commaSeparatedList } = require('../common.js');

const propertyKinds = ['get', 'set', 'init'];

const generators = {
  *ObjectExpression(path) {
    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(LPN`{`);
    // allow trailing commas -- es3 doesn't
    yield* commaSeparatedList(path.node, 'properties');
    yield* eat(RPN`}`);

    if (lpn) yield* eat(RPN`)`);
  },

  *Property(path) {
    const { method, value, kind } = path.node;

    if (kind && !propertyKinds.includes(kind)) {
      throw new Error('invalid property kind');
    }

    if (kind === 'get' || kind === 'set') {
      yield* eat(KW(kind));
    }

    if (value.type === 'FunctionExpression' && method) {
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
};

module.exports = { generators };
