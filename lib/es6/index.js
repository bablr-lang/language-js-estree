const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { Fragment } = require('@cst-tokens/helpers/symbols');

const { Identifier } = require('../descriptors.js');
const { commaSeparatedList, Separator } = require('../common.js');
const { withSeparator } = require('../meta-grammar.js');
const { generators: es5Generators } = require('../es5/index.js');
const { generators: classGenerators } = require('./class.js');
const { generators: controlGenerators } = require('./control.js');
const { generators: importGenerators } = require('./import.js');
const { generators: structureGenerators } = require('./structure.js');
const { generators: literalGenerators } = require('./literal.js');

const generators = {
  ...es5Generators,
  ...classGenerators,
  ...controlGenerators,
  ...importGenerators,
  ...structureGenerators,
  ...literalGenerators,

  *[Fragment]() {
    yield* eat(ref`fragment`);
    yield* eatMatch(Separator);
  },

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
    const isObjectShorthand = parent.type === 'Property' && parent.method;
    const isMethodDefinition = parent.type === 'MethodDefinition';

    const lpn = !isObjectShorthand && !isMethodDefinition && (yield* eatMatch(LPN`(`));

    if (async) {
      yield* eat(KW`async`);
    }
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

    if (lpn) yield* eat(RPN`)`);
  },

  *ArrowFunctionExpression(path) {
    const { node } = path;

    const lpn2 = yield* eatMatch(LPN`(`, LPN`(`);

    if (node.async) {
      yield* eat(KW`async`);
    }
    if (!lpn2) yield* eat(LPN`(`);
    yield* commaSeparatedList(node, 'params');
    yield* eat(RPN`)`, PN`=>`, ref`body`);

    if (lpn2) yield* eat(RPN`)`);
  },
};

const grammar = {
  generators: withSeparator(generators),
};

module.exports = { grammar, generators, default: grammar };
