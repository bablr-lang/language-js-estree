const { eat } = require('@cst-tokens/helpers/commands');
const { SymbolReference, SymbolDefinition, Literal } = require('../descriptors.js');

const idDeclTypes = new Set([
  'VariableDeclarator',
  'ClassDeclaration',
  'FunctionDeclaration',
  'FunctionExpression',
]);

const getDescriptor = (path) => {
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

const generators = {
  *Identifier(path) {
    const { name } = path.node;

    const Descriptor = getDescriptor(path) || SymbolReference;

    yield* eat(Descriptor(name));
  },
};

module.exports = { generators, getDescriptor };
