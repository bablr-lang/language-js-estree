const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { objectEntries } = require('@cst-tokens/helpers/iterable');

const { commaSeparatedList } = require('../../meta-productions.js');

const empty = [];
const when = (condition, value) => (condition ? [value] : empty);

const productions = objectEntries({
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

  *IfStatement({ node }) {
    yield* eat(KW`if`, LPN`(`, ref`test`, RPN`)`, ref`consequent`);
    if (node.alternate) {
      yield* eat(KW`else`, ref`alternate`);
    }
  },

  *SwitchStatement({ node }) {
    yield* eat(KW`switch`, LPN`(`, ref`discriminant`, RPN`)`);
    yield* eat(LPN`{`);
    yield* eat(...node.cases.map(() => ref`cases`));
    yield* eat(RPN`}`);
  },

  *SwitchCase({ node }) {
    yield* eat(KW`case`, PN`:`);
    yield* eat(...node.consequent.map(() => ref`consequent`));
  },

  *ForStatement({ node }) {
    yield* eat(
      KW`for`,
      LPN`(`,
      ...when(node.init, ref`init`),
      PN`;`,
      ...when(node.test, ref`test`),
      PN`;`,
      ...when(node.update, ref`update`),
      RPN`)`,
      ref`body`,
    );
  },

  *ForInStatement() {
    yield* eat(KW`for`, LPN`(`, ref`left`, KW`in`, ref`right`, RPN`)`, ref`body`);
  },

  *WhileStatement() {
    yield* eat(KW`while`, LPN`(`, ref`test`, RPN`)`, ref`body`);
  },

  *DoWhileStatement() {
    yield* eat(KW`do`, ref`body`, KW`while`, LPN`(`, ref`test`, RPN`)`);
  },

  *LabeledStatement() {
    yield* eat(ref`label`, PN`:`, ref`body`);
  },

  *BreakStatement({ node }) {
    yield* eat(KW`break`);
    if (node.label) {
      yield* eat(ref`label`);
    }
    yield* eatMatch(PN`;`);
  },

  *ContinueStatement({ node }) {
    yield* eat(KW`continue`);
    if (node.label) {
      yield* eat(ref`label`);
    }
    yield* eatMatch(PN`;`);
  },

  *ReturnStatement({ node }) {
    yield* eat(KW`return`);
    if (node.argument) {
      yield* eat(ref`argument`);
    }
    yield* eatMatch(PN`;`);
  },

  *ThrowStatement() {
    yield* eat(KW`throw`, ref`argument`);
    yield* eatMatch(PN`;`);
  },
});

module.exports = { productions };
