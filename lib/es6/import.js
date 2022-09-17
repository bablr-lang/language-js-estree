const { eat, match, eatMatch, emit, ref } = require('@cst-tokens/helpers');
const { PN, LPN, RPN, KW } = require('../descriptors.js');
const { commaSeparatedList } = require('../common.js');

const arrayLast = (arr) => arr[arr.length - 1];

const generators = {
  *ImportDeclaration(path) {
    const { node } = path;
    const { specifiers } = node;
    yield* eat(KW`import`);
    if (specifiers?.length) {
      const specialIdx = specifiers.findIndex((spec) => spec.type !== 'ImportSpecifier');
      if (specialIdx >= 1) {
        const special = specifiers[specialIdx];
        // This is a limitation of RefResolver.
        throw new Error(
          `${special.type} was at specifiers[${specialIdx}] but must be specifiers[0]`,
        );
      }
      const special = specifiers[0].type === 'ImportSpecifier' ? null : specifiers[0];
      if (special && special.type === 'ImportNamespaceSpecifier') {
        yield* eat(ref`specifiers`);
      } else {
        if (special && special.type === 'ImportDefaultSpecifier') {
          yield* eat(ref`specifiers`);
        }
        if (special && specifiers.length > 1) {
          yield* eat(PN`,`);
        }
        if (specifiers.length > 1) {
          yield* eat(LPN`{`);
          yield* commaSeparatedList(node, 'specifiers');
          yield* eat(RPN`}`);
        }
      }

      yield* eat(KW`from`);
    }
    yield* eat(ref`source`);
    yield* eatMatch(PN`;`);
  },

  *ImportSpecifier(path, { matchNodes }) {
    const { node } = path;
    const { local, imported } = node;

    const importedMatch = yield* match(ref`imported`);
    const importedRef = importedMatch[0];

    yield* emit(importedMatch);

    if (local.name !== imported.name) {
      yield* eat(KW`as`, ref`local`);
    } else {
      const asMatch = yield* match(KW`as`, ref`local`);
      const localRef = arrayLast(asMatch);

      // Ensure that `foo as bar` becoming `foo as foo` only emits `foo`
      const valid =
        asMatch &&
        matchNodes.get(importedRef).source.type !== 'NoSource' &&
        matchNodes.get(localRef).source.type !== 'NoSource';

      if (valid) {
        yield* emit(asMatch);
      }
    }
  },

  *ImportDefaultSpecifier() {
    yield* eat(ref`local`);
  },

  *ImportNamespaceSpecifier() {
    yield* eat(PN`*`, KW`as`, ref`local`);
  },
};

module.exports = { generators };
