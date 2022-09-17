const { eat, ref } = require('@cst-tokens/helpers');
const { LPN, RPN, KW, Identifier } = require('../descriptors.js');
const { commaSeparatedList } = require('../common.js');
const { grammarBase } = require('../grammar.js');
const { mapGrammar } = require('../utils/grammar.js');
const { handleSeparator } = require('../es3/separator.js');
const { generators: es3Generators } = require('../es3/index.js');
const { generators: structureGenerators } = require('./structure.js');

const generators = {
  ...es3Generators,

  *FunctionExpression(path) {
    const { node, parentNode: parent } = path;
    const { id } = node;
    const isObjectShorthand = parent.type === 'Property' && parent.method;
    if (!isObjectShorthand) {
      yield* eat(KW`function`);
    }
    if (id) {
      yield* eat(ref`id`);
    } else if (isObjectShorthand) {
      yield* eat(Identifier(parent.key.name));
    }
    yield* eat(LPN`(`);
    yield* commaSeparatedList(node, 'params', { allowTrailing: false });
    yield* eat(RPN`)`, ref`body`);
  },

  ...structureGenerators,
};

const grammar = {
  ...grammarBase,
  generators: mapGrammar(handleSeparator, generators),
};

module.exports = { grammar, generators, default: grammar };
