const { take } = require('cst-tokens/commands');
const { PN, ref, _, __ } = require('@cst-tokens/js-descriptors');

const visitors = {
  *ArrayExpression() {
    yield take(PN`[`, _);
    yield* commaSeparatedList(node, 'elements');
    yield take(_, PN`]`);
  },

  *ObjectExpression() {
    yield take(PN`{`, _);
    yield* commaSeparatedList(node, 'properties');
    yield take(_, PN`}`);
  },

  *Property(path) {
    const { node } = path;

    if (t.isFunctionExpression(node.value) && node.method) {
      // This is a shorthand method like `{ async fn (arg) {} }`
      // This has some problems with source locality. In the given example:
      //   `async` belongs to `node.value`
      //   `fn` belongs to `node`
      //   `(arg) {}` belongs to `node.value`
      // For this reason I treat all the tokens as belonging to `node.value`
      yield take(ref`value`);
    } else {
      yield node.computed ? take(PN`[`, _, ref`key`, _, PN`]`) : take(ref`key`);
      yield take(_, PN`:`, _, ref`value`);
    }
  },

  *MemberExpression(path) {
    const { node } = path;

    yield take(ref`object`, _);

    if (node.computed) {
      yield take(PN`[`, _, ref`property`, _, PN`]`);
    } else {
      yield take(PN`.`, _, ref`property`);
    }
  },
};

module.exports = { visitors };
