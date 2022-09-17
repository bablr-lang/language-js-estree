const { eat, eatMatch, ref } = require('@cst-tokens/helpers');
const { LPN, RPN, KW } = require('../descriptors.js');

const propertyKinds = ['get', 'set', 'init'];

const generators = {
  *ClassDeclaration(path) {
    const { body, superClass } = path.node;

    if (body.type !== 'ClassBody') {
      throw new Error('Inavlid class body');
    }

    yield* eat(KW`class`, ref`id`);
    if (superClass) yield* eat(KW`extends`, ref`superClass`);
    yield* eat(ref`body`);
  },

  *ClassExpression(path) {
    const { body, superClass } = path.node;

    if (body.type !== 'ClassBody') {
      throw new Error('Inavlid class body');
    }

    yield* eat(KW`class`);
    yield* eatMatch(ref`id`);
    if (superClass) yield* eat(KW`extends`, ref`superClass`);
    yield* eat(ref`body`);
  },

  *ClassBody(path) {
    const { body } = path.node;
    yield* eat(LPN`{`);
    for (const _ of body) {
      yield* eat(ref`body`);
    }
    yield* eat(RPN`}`);
  },

  *MethodDefinition(path) {
    const { kind, static } = path.node;

    if (kind && !propertyKinds.includes(kind)) {
      throw new Error('invalid property kind');
    }

    if (static) {
      yield* eat(KW`static`);
    }

    if (kind === 'get' || kind === 'set') {
      yield* eat(KW(kind));
    }

    yield* eat(ref`value`);
  },

  *Super() {
    yield* eat(KW`super`);
  },
};

module.exports = { generators };
