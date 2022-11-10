const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');

const empty = [];
const when = (condition, value) => (condition ? [value] : empty);

const generators = {
  *IfStatement(path) {
    const { alternate } = path.node;
    yield* eat(KW`if`, LPN`(`, ref`test`, RPN`)`, ref`consequent`);
    if (alternate) {
      yield* eat(KW`else`, ref`alternate`);
    }
  },

  *SwitchStatement(path) {
    const { cases } = path.node;
    yield* eat(KW`switch`, LPN`(`, ref`discriminant`, RPN`)`);
    yield* eat(LPN`{`);
    yield* eat(...cases.map(() => ref`cases`));
    yield* eat(RPN`}`);
  },

  *SwitchCase(path) {
    const { consequent } = path.node;
    yield* eat(KW`case`, PN`:`);
    yield* eat(...consequent.map(() => ref`consequent`));
  },

  *ForStatement(path) {
    const { init, test, update } = path.node;
    yield* eat(
      KW`for`,
      LPN`(`,
      ...when(init, ref`init`),
      PN`;`,
      ...when(test, ref`test`),
      PN`;`,
      ...when(update, ref`update`),
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

  *BreakStatement(path) {
    const { label } = path.node;
    yield* eat(KW`break`);
    if (label) {
      yield* eat(ref`label`);
    }
    yield* eatMatch(PN`;`);
  },

  *ContinueStatement(path) {
    const { label } = path.node;
    yield* eat(KW`continue`);
    if (label) {
      yield* eat(ref`label`);
    }
    yield* eatMatch(PN`;`);
  },

  *ReturnStatement(path) {
    const { argument } = path.node;
    yield* eat(KW`return`);
    if (argument) {
      yield* eat(ref`argument`);
    }
    yield* eatMatch(PN`;`);
  },

  *ThrowStatement() {
    yield* eat(KW`throw`, ref`argument`);
    yield* eatMatch(PN`;`);
  },
};

module.exports = { generators };
