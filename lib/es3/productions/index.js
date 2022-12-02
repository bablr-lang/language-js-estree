const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { concat, objectEntries } = require('@cst-tokens/helpers/iterable');

const { commaSeparatedList, Separator } = require('../../meta-productions.js');
const { SymbolReference } = require('../../descriptors.js');

const { productions: controlProductions } = require('./control.js');
const { productions: cstProductions } = require('./cst.js');
const { productions: literalProductions } = require('./literal.js');
const { productions: logicProductions } = require('./logic.js');
const { productions: structureProductions } = require('./structure.js');

const productions = concat([
  controlProductions,
  cstProductions,
  literalProductions,
  logicProductions,
  structureProductions,
  objectEntries({
    *CSTFragment() {
      yield* eat(ref`fragment`);
      yield* eatMatch(Separator);
    },

    *Program({ node }) {
      if (node.directives) {
        yield* eat(...node.directives.map(() => ref`directives`));
      }
      if (node.body) {
        yield* eat(...node.body.map(() => ref`body`));
      }
    },

    *BlockStatement({ node }) {
      yield* eat(LPN`{`);
      if (node.directives) {
        yield* eat(...node.directives.map(() => ref`directives`));
      }
      if (node.body) {
        yield* eat(...node.body.map(() => ref`body`));
      }
      yield* eat(RPN`}`);
    },

    *Identifier({ path, node, grammar }) {
      const { getIdentifierDescriptor } = grammar.context;

      const Descriptor = getIdentifierDescriptor(path) || SymbolReference;

      yield* eat(Descriptor(node.name));
    },

    *VariableDeclaration({ node }) {
      if (['const', 'let'].includes(node.kind)) {
        throw new Error('Unsupported variable declaration type');
      }

      yield* eat(KW('var'));
      if (!node.declarations.length) {
        throw new Error('variable declaration must have at least one declaration');
      }
      yield* commaSeparatedList(node, 'declarations', { allowTrailing: false });
      yield* eatMatch(PN`;`);
    },

    *VariableDeclarator() {
      yield* eat(ref`id`, PN`=`, ref`init`);
    },

    *FunctionDeclaration({ node }) {
      yield* eat(KW`function`);
      yield* eat(ref`id`, LPN`(`);
      yield* commaSeparatedList(node, 'params', { allowTrailing: false });
      yield* eat(RPN`)`, ref`body`);
      yield* eatMatch(PN`;`);
    },

    *FunctionExpression({ node }) {
      if (node.id) {
        yield* eat(ref`id`);
      }
      yield* eat(LPN`(`);
      yield* commaSeparatedList(node, 'params', { allowTrailing: false });
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

    *CallExpression({ node }) {
      const lpn = yield* eatMatch(LPN`(`);

      yield* eat(ref`callee`, LPN`(`);
      yield* commaSeparatedList(node, 'arguments', { allowTrailing: false });
      yield* eat(RPN`)`);

      if (lpn) yield* eat(RPN`)`);
    },

    *NewExpression({ node }) {
      const lpn = yield* eatMatch(LPN`(`);

      yield* eat(KW`new`, ref`callee`);
      if (node.arguments && node.arguments.length) {
        yield* eat(LPN`(`);
        yield* commaSeparatedList(node, 'arguments', { allowTrailing: false });
        yield* eat(RPN`)`);
      } else {
        yield* eatMatch(LPN`(`, RPN`)`);
      }

      if (lpn) yield* eat(RPN`)`);
    },
  }),
]);

module.exports = { productions };
