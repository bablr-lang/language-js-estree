const { eat, eatMatch } = require('@cst-tokens/helpers/commands');
const { LPN, RPN, KW, ref } = require('@cst-tokens/helpers/shorthand');
const { objectEntries } = require('@cst-tokens/helpers/iterable');

const propertyKinds = ['get', 'set', 'init'];

const productions = objectEntries({
  *ClassDeclaration({ node }) {
    if (node.body.type !== 'ClassBody') {
      throw new Error('Inavlid class body');
    }

    yield* eat(KW`class`, ref`id`);
    if (node.superClass) yield* eat(KW`extends`, ref`superClass`);
    yield* eat(ref`body`);
  },

  *ClassExpression({ node }) {
    if (node.body.type !== 'ClassBody') {
      throw new Error('Inavlid class body');
    }

    const lpn = yield* eatMatch(LPN`(`);

    yield* eat(KW`class`);
    yield* eatMatch(ref`id`);
    if (node.superClass) yield* eat(KW`extends`, ref`superClass`);
    yield* eat(ref`body`);

    if (lpn) yield* eat(RPN`)`);
  },

  *ClassBody({ node }) {
    yield* eat(LPN`{`);
    for (const _ of node.body) {
      yield* eat(ref`body`);
    }
    yield* eat(RPN`}`);
  },

  *MethodDefinition({ node }) {
    if (node.kind && !propertyKinds.includes(node.kind))
      throw new Error('invalid property node.kind');

    if (node.static) yield* eat(KW`static`);
    if (node.kind === 'get' || node.kind === 'set') yield* eat(KW(node.kind));
    yield* eat(ref`value`);
  },

  *Super() {
    yield* eat(KW`super`);
  },
});

module.exports = { productions };
