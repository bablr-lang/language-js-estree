const { eat, ref } = require('@cst-tokens/helpers');
const { PN } = require('../descriptors.js');

const generators = {
  *RegExpLiteral() {
    yield* eat(PN`/`, ref`pattern`, PN`/`, ref`flags`);
  },
  *Pattern(path) {},
  *Flags(path) {},
};

module.exports = { generators };
