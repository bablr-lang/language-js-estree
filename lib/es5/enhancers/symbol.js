const { getIdentifierDescriptor: getIdentifierDescriptorEs3 } = require('../es3/identifier.js');
const { Literal } = require('../../descriptors.js');

const getIdentifierDescriptor = ({ path, node }) => {
  const { parentNode } = path;

  return parentNode &&
    ((parentNode.type === 'MemberExpression' && parentNode.property === node) ||
      (parentNode.type === 'Property' && parentNode.key === node)) &&
    parentNode.computed
    ? Literal
    : getIdentifierDescriptorEs3(path);
};

module.exports = { getIdentifierDescriptor };
