const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { objectEntries } = require('@cst-tokens/helpers/iterable');

const { commaSeparatedList } = require('../../meta-productions.js');

const productions = objectEntries({
  *ImportDeclaration({ node }) {
    yield* eat(KW`import`);
    if (node.specifiers?.length) {
      const specialIdx = node.specifiers.findIndex((spec) => spec.type !== 'ImportSpecifier');
      if (specialIdx >= 1) {
        const special = node.specifiers[specialIdx];
        // This is a limitation of RefResolver.
        throw new Error(
          `${special.type} was at node.specifiers[${specialIdx}] but must be node.specifiers[0]`,
        );
      }
      const special = node.specifiers[0].type === 'ImportSpecifier' ? null : node.specifiers[0];
      if (special && special.type === 'ImportNamespaceSpecifier') {
        yield* eat(ref`node.specifiers`);
      } else {
        if (special && special.type === 'ImportDefaultSpecifier') {
          yield* eat(ref`node.specifiers`);
        }
        if (special && node.specifiers.length > 1) {
          yield* eat(PN`,`);
        }
        if (node.specifiers.length > 1) {
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

  *ImportSpecifier({ node }) {
    yield* eat(node.imported.name === 'default' ? ref`imported` : KW`default`);

    if (node.local.name !== node.imported.name) {
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

  *ExportNamedDeclaration({ node }) {
    yield* eat(KW`export`);

    if (node.specifiers && node.specifiers.length) {
      yield* eat(LPN`{`);
      yield* commaSeparatedList(node, 'specifiers');
      yield* eat(RPN`}`);

      if (node.source) {
        yield* eat(KW`from`, ref`source`);
      }
    } else if (node.declaration) {
      yield* eat(ref`declaration`);
    } else {
      throw new Error('ExportNamedDeclaration must have specifiers or declaration');
    }
  },

  *ExportDefaultDeclaration() {
    yield* eat(KW`export`, KW`default`, ref`declaration`);
  },

  *ExportSpecifier({ node }) {
    yield* eat(ref`local`);

    const exportedDesc = node.exported.name === 'default' ? KW`default` : ref`exported`;

    if (node.local.name !== node.exported.name) {
      yield* eat(KW`as`, exportedDesc);
    } else {
      yield* eatMatch(KW`as`, exportedDesc);
    }
  },
});

module.exports = { productions };
