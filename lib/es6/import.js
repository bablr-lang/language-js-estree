const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { commaSeparatedList } = require('../common.js');

const generators = {
  *ImportDeclaration(path) {
    const { specifiers } = path.node;
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
          yield* commaSeparatedList(path.node, 'specifiers');
          yield* eat(RPN`}`);
        }
      }

      yield* eat(KW`from`);
    }
    yield* eat(ref`source`);
    yield* eatMatch(PN`;`);
  },

  *ImportSpecifier(path) {
    const { local, imported } = path.node;

    yield* eat(imported.name === 'default' ? ref`imported` : KW`default`);

    if (local.name !== imported.name) {
      yield* eat(KW`as`, ref`local`);
    } else {
      yield* eatMatch(KW`as`, ref`local`);
    }
  },

  *ImportDefaultSpecifier() {
    yield* eat(ref`local`);
  },

  *ImportNamespaceSpecifier() {
    yield* eat(PN`*`, KW`as`, ref`local`);
  },

  *ExportNamedDeclaration(path) {
    const { specifiers, declaration, source } = path.node;

    yield* eat(KW`export`);

    if (specifiers && specifiers.length) {
      yield* eat(LPN`{`);
      yield* commaSeparatedList(path.node, 'specifiers');
      yield* eat(RPN`}`);

      if (source) {
        yield* eat(KW`from`, ref`source`);
      }
    } else if (declaration) {
      yield* eat(ref`declaration`);
    } else {
      throw new Error('ExportNamedDeclaration must have specifiers or declaration');
    }
  },

  *ExportDefaultDeclaration() {
    yield* eat(KW`export`, KW`default`, ref`declaration`);
  },

  *ExportSpecifier(path) {
    const { local, exported } = path.node;

    yield* eat(ref`local`);

    const exportedDesc = exported.name === 'default' ? KW`default` : ref`exported`;

    if (local.name !== exported.name) {
      yield* eat(KW`as`, exportedDesc);
    } else {
      yield* eatMatch(KW`as`, exportedDesc);
    }
  },
};

module.exports = { generators };
