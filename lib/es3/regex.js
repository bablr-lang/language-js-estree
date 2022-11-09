const { eat } = require('@cst-tokens/helpers/commands');
const { PN, ref } = require('@cst-tokens/helpers/shorthand');

const generators = {
  *RegExpLiteral() {
    yield* eat(PN`/`, ref`pattern`, PN`/`, ref`flags`);
  },
  *Pattern(path) {},
  *Flags(path) {},
};

module.exports = { generators };
