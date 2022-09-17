const { eat, eatMatch, ref } = require('@cst-tokens/helpers');
const { PN } = require('./descriptors.js');

function* commaSeparatedList(node, name, options = {}) {
  const { allowTrailing = true } = options;
  const list = node[name];

  for (let i = 0; i < list.length; i++) {
    const trailing = i === list.length - 1;
    if (!trailing) {
      yield* eat(ref(name), PN`,`);
    } else {
      // it's the caller's responsibility to handle space before or after the list
      yield* eat(ref(name));
      if (allowTrailing) {
        yield* eatMatch(PN`,`);
      }
    }
  }
}

module.exports = { commaSeparatedList };
