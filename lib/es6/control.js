const { eat, ref } = require('@cst-tokens/helpers');
const { PN, LPN, RPN, KW } = require('../descriptors.js');

const generators = {
  *ForOfStatement() {
    yield* eat(KW`for`, LPN`(`, ref`left`, KW`of`, ref`right`, RPN`)`, ref`body`);
  },

  *YieldExpression(path) {
    const { delegate } = path.node;
    yield* eat(KW`yield`);
    if (delegate) {
      yield* eat(PN`*`);
    }
    yield* eat(ref`argument`);
  },
};

module.exports = { generators };
