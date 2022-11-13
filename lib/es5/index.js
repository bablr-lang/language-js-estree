const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');

const es3 = require('../es3/index.js');

const { SymbolDefinition } = require('../descriptors.js');
const { commaSeparatedList, Separator } = require('../common.js');
const { withSeparator } = require('../meta-grammar.js');
const { getIdentifierDescriptor } = require('./identifier.js');
const { generators: structureGenerators } = require('./structure.js');

const generators = {
  ...es3.generators,
  ...structureGenerators,

  *CSTFragment() {
    yield* eat(ref`fragment`);
    yield* eatMatch(Separator);
  },

  *FunctionExpression(path) {
    const { node, parentNode: parent } = path;

    const lpn = !isObjectShorthand && (yield* eatMatch(LPN`(`));

    const { id } = node;
    const isObjectShorthand = parent.type === 'Property' && parent.method;
    if (!isObjectShorthand) {
      yield* eat(KW`function`);
    }

    if (id) {
      yield* eat(ref`id`);
    } else if (isObjectShorthand) {
      yield* eat(SymbolDefinition(parent.key.name));
    }

    yield* eat(LPN`(`);
    yield* commaSeparatedList(node, 'params', { allowTrailing: false });
    yield* eat(RPN`)`, ref`body`);

    if (lpn) yield* eat(RPN`)`);
  },
};

const grammar = {
  options: {
    ...es3.grammar.options,
    esVersion: 5,
    getIdentifierDescriptor,
  },
  generators: withSeparator(generators),
};

module.exports = { grammar, generators, default: grammar };
