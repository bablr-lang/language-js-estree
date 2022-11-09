const { eat } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { commaSeparatedList } = require('../common.js');

const propertyKinds = ['get', 'set', 'init'];

const generators = {
  *SpreadElement() {
    yield* eat(PN`...`, ref`argument`);
  },

  *ObjectPattern(path) {
    yield* eat(LPN`{`);
    yield* commaSeparatedList(path.node, 'properties');
    yield* eat(RPN`}`);
  },

  *ArrayPattern(path) {
    yield* eat(LPN`[`);
    yield* commaSeparatedList(path.node, 'elements');
    yield* eat(RPN`]`);
  },

  *AssignmentPattern() {
    yield* eat(ref`left`, PN`=`, ref`right`);
  },

  *Property(path) {
    const { kind, shorthand, computed, method, key, value } = path.node;

    if (kind && !propertyKinds.includes(kind)) {
      throw new Error('invalid property kind');
    }

    if (kind === 'get' || kind === 'set') {
      yield* eat(KW(kind));
    }

    if (shorthand && (computed || key.name !== value.name || kind !== 'init')) {
      throw new Error('invalid shorthand property');
    }

    if (value.type === 'FunctionExpression' && method) {
      yield* eat(ref`value`);
    } else {
      if (!shorthand) {
        yield* computed ? eat(LPN`[`, ref`key`, RPN`]`) : eat(ref`key`);
        yield* eat(PN`:`);
      }
      yield* eat(ref`value`);
    }
  },
};

module.exports = { generators };
