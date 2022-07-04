const t = require('@babel/types');
const { take, match, emit } = require('cst-tokens/commands');
const { OPT, PN, KW, ref, _, __ } = require('@cst-tokens/js-descriptors');
const { commaSeparatedList } = require('./common');

const arrayLast = (arr) => arr[arr.length - 1];

const visitors = {
  *ImportDeclaration(path) {
    const { node } = path;
    const { specifiers } = node;
    yield take(KW`import`);
    if (specifiers?.length) {
      const specialIdx = specifiers.findIndex((spec) => !t.isImportSpecifier(spec));
      if (specialIdx >= 1) {
        const special = specifiers[specialIdx];
        // This is a limitation of RefResolver.
        throw new Error(
          `${special.type} was at specifiers[${specialIdx}] but must be specifiers[0]`,
        );
      }
      const special = t.isImportSpecifier(specifiers[0]) ? null : specifiers[0];
      if (special && t.isImportNamespaceSpecifier(special)) {
        yield take(_, ref`specifiers`);
      } else {
        if (special && t.isImportDefaultSpecifier(special)) {
          yield take(__, ref`specifiers`);
        }
        if (special && specifiers.length > 1) {
          yield take(_, PN`,`, _);
        } else {
          yield take(_);
        }
        if (specifiers.length > 1) {
          yield take(PN`{`, _);
          yield* commaSeparatedList(node, 'specifiers');
          yield take(_, PN`}`);
        }
      }

      const needsSpace = specialIdx === 0 && specifiers.length === 1;
      yield take(needsSpace ? __ : _, KW`from`, _);
    }
    yield take(ref`source`, _, OPT(PN`;`));
  },

  *ImportSpecifier(path, { matchNodes }) {
    const { node } = path;
    const { local, imported } = node;

    const importedMatch = yield match(ref`imported`);
    const importedRef = importedMatch[0];

    yield emit(importedMatch);

    if (local.name !== imported.name) {
      yield take(__, KW`as`, __, ref`local`);
    } else {
      const asMatch = yield match(__, KW`as`, __, ref`local`);
      const localRef = arrayLast(asMatch);

      // Ensure that `foo as bar` becoming `foo as foo` only emits `foo`
      const valid =
        matchNodes.get(importedRef).source.type !== 'NoSource' &&
        matchNodes.get(localRef).source.type !== 'NoSource';

      if (asMatch && valid) {
        yield emit(asMatch);
      }
    }
  },

  *ImportDefaultSpecifier() {
    yield take(ref`local`);
  },

  *ImportNamespaceSpecifier() {
    yield take(PN`*`, _, KW`as`, __, ref`local`);
  },
};

module.exports = { visitors };
