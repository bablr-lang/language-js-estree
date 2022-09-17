const mapGrammar = (transform, generators) => {
  const transformed = {};
  for (const [type, visitor] of Object.entries(generators)) {
    transformed[type] = transform(visitor);
  }
  return transformed;
};

module.exports = { mapGrammar };
