const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');

const generators = {
  *ForOfStatement() {
    yield* eat(KW`for`, LPN`(`, ref`left`, KW`of`, ref`right`, RPN`)`, ref`body`);
  },

  *YieldExpression(path) {
    const { delegate } = path.node;

    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(KW`yield`);
    if (delegate) {
      yield* eat(PN`*`);
    }
    yield* eat(ref`argument`);

    if (lpn) yield* eat(RPN`)`);
  },
};

module.exports = { generators };
