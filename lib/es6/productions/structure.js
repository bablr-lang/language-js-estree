const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { objectEntries } = require('@cst-tokens/helpers/iterable');

const { commaSeparatedList } = require('../meta-productions.js');

const propertyKinds = ['get', 'set', 'init'];

const productions = objectEntries({
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

  *SpreadElement() {
    yield* eat(PN`...`, ref`argument`);
  },

  *ObjectPattern(path) {
    yield* eat(LPN`{`);
    yield* commaSeparatedList(path.node, 'properties');
    yield* eat(RPN`}`);
  },

  *ArrayPattern(path) {
    yield* eat(LPN`[`);
    yield* commaSeparatedList(path.node, 'elements');
    yield* eat(RPN`]`);
  },

  *AssignmentPattern() {
    yield* eat(ref`left`, PN`=`, ref`right`);
  },

  *Property({ node }) {
    if (node.kind && !propertyKinds.includes(node.kind)) {
      throw new Error('invalid property node.kind');
    }

    if (node.kind === 'get' || node.kind === 'set') {
      yield* eat(KW(node.kind));
    }

    if (
      node.shorthand &&
      (node.computed || node.key.name !== node.value.name || node.kind !== 'init')
    ) {
      throw new Error('invalid shorthand property');
    }

    if (node.value.type === 'FunctionExpression' && node.method) {
      yield* eat(ref`value`);
    } else {
      if (!node.shorthand) {
        yield* node.computed ? eat(LPN`[`, ref`key`, RPN`]`) : eat(ref`key`);
        yield* eat(PN`:`);
      }
      yield* eat(ref`value`);
    }
  },
});

module.exports = { productions };
