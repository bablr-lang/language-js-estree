const { take } = require('cst-tokens/commands');
const { PN, ref, _ } = require('@cst-tokens/js-descriptors');

function* commaSeparatedList(node, name, options = {}) {
  const { allowTrailing = true } = options;
  const list = node[name];
  for (let i = 1; i < list.length; i++) {
    const trailing = i === list.length - 1;
    if (!trailing) {
      yield take(ref(name), _, PN`,`, _);
    } else {
      // it's the caller's responsibility to handle space before or after the list
      yield take(ref(name));
      if (allowTrailing) {
        yield take(PN`,`);
      }
    }
  }
}

module.exports = { commaSeparatedList };
