const { SymbolDefinition, Literal } = require('../descriptors.js');

const idDeclTypes = new Set([
  'VariableDeclarator',
  'ClassDeclaration',
  'FunctionDeclaration',
  'FunctionExpression',
]);

const getIdentifierDescriptor = (path) => {
  const { node, parentNode } = path;

  let Desc;

  if (
    !parentNode ||
    (parentNode.type === 'MemberExpression' && parentNode.property === node) ||
    (parentNode.type === 'Property' && parentNode.key === node)
  ) {
    Desc = Literal;
  } else if (idDeclTypes.has(parentNode.type) && parentNode.id === node) {
    Desc = SymbolDefinition;
  }

  return Desc;
};

module.exports = { getIdentifierDescriptor };
