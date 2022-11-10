const { eat } = require('@cst-tokens/helpers/commands');
const { getDescriptor: getDescriptorEs3 } = require('../es3/identifier.js');
const { SymbolReference, Literal } = require('../descriptors.js');

const getDescriptor = (path) => {
  const { node, parentNode } = path;

  return parentNode &&
    ((parentNode.type === 'MemberExpression' && parentNode.property === node) ||
      (parentNode.type === 'Property' && parentNode.key === node)) &&
    parentNode.computed
    ? Literal
    : getDescriptorEs3(path);
};

const generators = {
  *Identifier(path) {
    const { name } = path.node;

    const Descriptor = getDescriptor(path) || SymbolReference;

    yield* eat(Descriptor(name));
  },
};

module.exports = { generators, getDescriptor };
