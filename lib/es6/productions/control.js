const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { PN, LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { objectEntries } = require('@cst-tokens/helpers/iterable');

const { commaSeparatedList } = require('../../meta-productions.js');
const { SymbolReference, Literal } = require('../../descriptors.js');

const productions = objectEntries({
  *FunctionDeclaration({ node }) {
    if (node.async) {
      yield* eat(KW`async`);
    }
    yield* eat(KW`function`);
    if (node.generator) {
      yield* eat(PN`*`);
    }
    yield* eat(ref`id`, LPN`(`);
    yield* commaSeparatedList(node, 'params');
    yield* eat(RPN`)`, ref`body`);
    yield* eatMatch(PN`;`);
  },

  *FunctionExpression({ path, node }) {
    const { parentNode } = path;
    const isObjectShorthand = parentNode.type === 'Property' && parentNode.method;
    const isMethodDefinition = parentNode.type === 'MethodDefinition';

    const lpn = !isObjectShorthand && !isMethodDefinition && (yield* eatMatch(LPN`(`));

    if (node.async) {
      yield* eat(KW`async`);
    }
    if (!isObjectShorthand && !isMethodDefinition) {
      yield* eat(KW`function`);
    }
    if (node.generator) {
      yield* eat(PN`*`);
    }
    if (node.id) {
      yield* eat(ref`id`);
    } else if (isObjectShorthand || isMethodDefinition) {
      const { key, computed } = parentNode;
      const { name } = key;
      yield* computed ? eat(LPN`[`, SymbolReference(name), RPN`]`) : eat(Literal(name));
    }
    yield* eat(LPN`(`);
    yield* commaSeparatedList(node, 'params');
    yield* eat(RPN`)`, ref`body`);

    if (lpn) yield* eat(RPN`)`);
  },

  *ArrowFunctionExpression({ node }) {
    const lpn2 = yield* eatMatch(LPN`(`, LPN`(`);

    if (node.async) {
      yield* eat(KW`async`);
    }
    if (!lpn2) yield* eat(LPN`(`);
    yield* commaSeparatedList(node, 'params');
    yield* eat(RPN`)`);
    yield* eat(PN`=>`, ref`body`);

    if (lpn2) yield* eat(RPN`)`);
  },

  *ForOfStatement() {
    yield* eat(KW`for`, LPN`(`, ref`left`, KW`of`, ref`right`, RPN`)`, ref`body`);
  },

  *YieldExpression({ node }) {
    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(KW`yield`);
    if (node.delegate) {
      yield* eat(PN`*`);
    }
    yield* eat(ref`argument`);

    if (lpn) yield* eat(RPN`)`);
  },
});

module.exports = { productions };
