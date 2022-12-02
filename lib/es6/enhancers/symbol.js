const {
  getIdentifierDescriptor: getIdentifierDescriptorEs5,
} = require('../es5/enhancers/symbol.js');
const { takeWhile, last } = require('../utils/iterable.js');
const { SymbolReference, SymbolDefinition } = require('../descriptors.js');

const patternTypes = new Set(['Property', 'ObjectPattern', 'ArrayPattern']);
const patternParentTypes = new Set([
  'VariableDeclarator',
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);
const importSpecifierTypes = new Set(['ImportSpecifier', 'ImportDefaultSpecifier']);
const idDeclTypes = new Set(['ClassDeclaration', 'ClassExpression']);

const getIdentifierDescriptor = (path) => {
  const { node, parent, parentNode } = path;

  let Desc = getIdentifierDescriptorEs5(path);

  if (Desc) {
    // continue
  } else if (
    (idDeclTypes.has(parentNode.type) && parentNode.id === node) ||
    (importSpecifierTypes.has(parentNode.type) && parentNode.local === node)
  ) {
    Desc = SymbolDefinition;
  } else if (
    parentNode.type === 'ExportSpecifier' &&
    parentNode.local === node &&
    !(parent.parent.node.type === 'ExportNamedDeclaration' && parent.parent.node.source)
  ) {
    Desc = SymbolReference;
  } else {
    if (
      (parentNode.type === 'Property' && parent.parent?.node.type === 'ObjectPattern') ||
      parentNode.type === 'ArrayPattern'
    ) {
      const top = last(takeWhile(path.parents(true), (p) => patternTypes.has(p.node.type)));
      if (top.parent && patternParentTypes.has(top.parent.node.type)) {
        Desc = SymbolDefinition;
      }
    }
  }
  return Desc;
};

module.exports = { getIdentifierDescriptor };
