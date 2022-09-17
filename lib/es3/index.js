const { eat, eatMatch, ref } = require('@cst-tokens/helpers');
const { PN, LPN, RPN, KW, Identifier } = require('../descriptors.js');
const { commaSeparatedList } = require('../common.js');
const { grammarBase } = require('../grammar.js');
const { mapGrammar } = require('../utils/grammar.js');
const { handleSeparator, Separator } = require('./separator.js');
const { generators: controlGenerators } = require('./control.js');
const { generators: logicGenerators } = require('./logic.js');
const { generators: structureGenerators } = require('./structure.js');
const { generators: literalGenerators } = require('./literal.js');
const { generators: regexGenerators } = require('./regex.js');

const generators = {
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

  *Identifier(path) {
    const { name } = path.node;
    yield* eat(Identifier(name));
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
    yield* commaSeparatedList(node, 'declarations', { allowTrailing: false });
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
    const { node } = path;

    if (node.id) {
      yield* eat(ref`id`);
    }
    yield* eat(LPN`(`);
    yield* commaSeparatedList(node, 'params', { allowTrailing: false });
    yield* eat(RPN`)`, ref`body`);
  },

  *AssignmentExpression() {
    yield* eat(ref`left`, PN`=`, ref`right`);
  },

  *ExpressionStatement() {
    yield* eat(ref`expression`);
    yield* eatMatch(PN`;`);
  },

  *CallExpression(path) {
    const { node } = path;
    yield* eat(ref`callee`, LPN`(`);
    yield* commaSeparatedList(node, 'arguments', { allowTrailing: false });
    yield* eat(RPN`)`);
  },

  *NewExpression(path) {
    const { node } = path;
    yield* eat(KW`new`, ref`callee`);
    if (node.arguments && node.arguments.length) {
      yield* eat(LPN`(`);
      yield* commaSeparatedList(node, 'arguments', { allowTrailing: false });
      yield* eat(RPN`)`);
    } else {
      yield* eatMatch(LPN`(`, RPN`)`);
    }
  },

  ...controlGenerators,
  ...logicGenerators,
  ...structureGenerators,
  ...literalGenerators,
  ...regexGenerators,
};

const grammar = {
  ...grammarBase,
  generators: mapGrammar(handleSeparator, generators),
};

module.exports = { grammar, generators, default: grammar };
