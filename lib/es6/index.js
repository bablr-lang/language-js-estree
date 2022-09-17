const { eat, eatMatch, ref } = require('@cst-tokens/helpers');
const { PN, LPN, RPN, KW, Identifier } = require('../descriptors.js');
const { commaSeparatedList } = require('../common.js');
const { grammarBase } = require('../grammar.js');
const { mapGrammar } = require('../utils/grammar.js');
const { handleSeparator } = require('../es3/separator.js');
const { generators: es5Generators } = require('../es5/index.js');
const { generators: classGenerators } = require('./class.js');
const { generators: controlGenerators } = require('./control.js');
const { generators: importGenerators } = require('./import.js');
const { generators: structureGenerators } = require('./structure.js');
const { generators: literalGenerators } = require('./literal.js');

const generators = {
  ...es5Generators,

  *VariableDeclaration(path) {
    const { node } = path;
    if (!['const', 'let', 'var'].includes(node.kind)) {
      throw new Error('Unsupported variable declaration type');
    }

    yield* eat(KW(node.kind));
    if (!node.declarations.length) {
      throw new Error('variable declaration must have at least one declaration');
    }
    yield* commaSeparatedList(node, 'declarations', { allowTrailing: false });
    yield* eatMatch(PN`;`);
  },

  *FunctionDeclaration(path) {
    const { async, generator } = path.node;
    if (async) {
      yield* eat(KW`async`);
    }
    yield* eat(KW`function`);
    if (generator) {
      yield* eat(PN`*`);
    }
    yield* eat(ref`id`, LPN`(`);
    yield* commaSeparatedList(path.node, 'params');
    yield* eat(RPN`)`, ref`body`);
    yield* eatMatch(PN`;`);
  },

  *FunctionExpression(path) {
    const { node, parentNode: parent } = path;
    const { async, generator, id } = node;
    if (async) {
      yield* eat(KW`async`);
    }
    const isObjectShorthand = parent.type === 'Property' && parent.method;
    const isMethodDefinition = parent.type === 'MethodDefinition';
    if (!isObjectShorthand && !isMethodDefinition) {
      yield* eat(KW`function`);
    }
    if (generator) {
      yield* eat(PN`*`);
    }
    if (id) {
      yield* eat(ref`id`);
    } else if (isObjectShorthand || isMethodDefinition) {
      const { key, computed } = parent;
      const { name } = key;
      yield* computed ? eat(LPN`[`, Identifier(name), RPN`]`) : eat(Identifier(name));
    }
    yield* eat(LPN`(`);
    yield* commaSeparatedList(node, 'params');
    yield* eat(RPN`)`, ref`body`);
  },

  *ArrowFunctionExpression(path) {
    const { node } = path;
    if (node.async) {
      yield* eat(KW`async`);
    }
    yield* eat(LPN`(`);
    yield* commaSeparatedList(node, 'params');
    yield* eat(RPN`)`, PN`=>`, ref`body`);
  },

  ...classGenerators,
  ...controlGenerators,
  ...importGenerators,
  ...structureGenerators,
  ...literalGenerators,
};

const grammar = {
  ...grammarBase,
  generators: mapGrammar(handleSeparator, generators),
};

module.exports = { grammar, generators, default: grammar };
