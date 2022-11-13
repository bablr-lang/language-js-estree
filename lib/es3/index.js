const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');

const { commaSeparatedList, Separator } = require('../common.js');
const { withSeparator } = require('../meta-grammar.js');
const { SymbolReference } = require('../descriptors.js');
const { getIdentifierDescriptor } = require('./identifier.js');

const { generators: controlGenerators } = require('./control.js');
const { generators: logicGenerators } = require('./logic.js');
const { generators: structureGenerators } = require('./structure.js');
const { generators: literalGenerators } = require('./literal.js');
const { generators: regexGenerators } = require('./regex.js');

const generators = {
  ...controlGenerators,
  ...logicGenerators,
  ...structureGenerators,
  ...literalGenerators,
  ...regexGenerators,

  *CSTFragment() {
    yield* eat(ref`fragment`);
    yield* eatMatch(Separator);
  },

  *Program(path) {
    const { directives, body } = path.node;
    if (directives) {
      yield* eat(...directives.map(() => ref`directives`));
    }
    if (body) {
      yield* eat(...body.map(() => ref`body`));
    }
  },

  *BlockStatement(path) {
    const { directives, body } = path.node;
    yield* eat(LPN`{`);
    if (directives) {
      yield* eat(...directives.map(() => ref`directives`));
    }
    if (body) {
      yield* eat(...body.map(() => ref`body`));
    }
    yield* eat(RPN`}`);
  },

  *Identifier(path, context) {
    const { name } = path.node;
    const { getIdentifierDescriptor } = context.grammarOptions;

    const Descriptor = getIdentifierDescriptor(path) || SymbolReference;

    yield* eat(Descriptor(name));
  },

  *VariableDeclaration(path) {
    const { kind, declarations } = path.node;
    if (['const', 'let'].includes(kind)) {
      throw new Error('Unsupported variable declaration type');
    }

    yield* eat(KW('var'));
    if (!declarations.length) {
      throw new Error('variable declaration must have at least one declaration');
    }
    yield* commaSeparatedList(path.node, 'declarations', { allowTrailing: false });
    yield* eatMatch(PN`;`);
  },

  *VariableDeclarator() {
    yield* eat(ref`id`, PN`=`, ref`init`);
  },

  *FunctionDeclaration(path) {
    yield* eat(KW`function`);
    yield* eat(ref`id`, LPN`(`);
    yield* commaSeparatedList(path.node, 'params', { allowTrailing: false });
    yield* eat(RPN`)`, ref`body`);
    yield* eatMatch(PN`;`);
  },

  *FunctionExpression(path) {
    const { id } = path.node;

    if (id) {
      yield* eat(ref`id`);
    }
    yield* eat(LPN`(`);
    yield* commaSeparatedList(path.node, 'params', { allowTrailing: false });
    yield* eat(RPN`)`, ref`body`);
  },

  *AssignmentExpression() {
    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(ref`left`, PN`=`, ref`right`);

    if (lpn) yield* eat(RPN`)`);
  },

  *ExpressionStatement() {
    yield* eat(ref`expression`);
    yield* eatMatch(PN`;`);
  },

  *CallExpression(path) {
    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(ref`callee`, LPN`(`);
    yield* commaSeparatedList(path.node, 'arguments', { allowTrailing: false });
    yield* eat(RPN`)`);

    if (lpn) yield* eat(RPN`)`);
  },

  *NewExpression(path) {
    const { node } = path;

    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(KW`new`, ref`callee`);
    if (node.arguments && node.arguments.length) {
      yield* eat(LPN`(`);
      yield* commaSeparatedList(path.node, 'arguments', { allowTrailing: false });
      yield* eat(RPN`)`);
    } else {
      yield* eatMatch(LPN`(`, RPN`)`);
    }

    if (lpn) yield* eat(RPN`)`);
  },
};

const grammar = {
  options: {
    esVersion: 3,
    ignoreProperties: ['loc', 'range', 'start', 'end', 'extra'],
    getIdentifierDescriptor,
  },
  generators: withSeparator(generators),
};

module.exports = { grammar, generators, default: grammar };
