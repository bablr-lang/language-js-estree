const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { ref } = require('@cst-tokens/helpers/shorthand');
const { objectEntries } = require('@cst-tokens/helpers/iterable');

const { Separator } = require('../../meta-productions.js');

const productions = objectEntries({
  *CSTFragment() {
    yield* eat(ref`fragment`);
    yield* eatMatch(Separator());
  },
});

module.exports = { productions };
