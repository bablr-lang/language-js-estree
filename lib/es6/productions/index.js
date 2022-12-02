const { concat } = require('@cst-tokens/helpers/iterable');

const { productions: es5Generators } = require('../es5/index.js');
const { productions: classGenerators } = require('./class.js');
const { productions: controlGenerators } = require('./control.js');
const { productions: importGenerators } = require('./import.js');
const { productions: structureGenerators } = require('./structure.js');
const { productions: literalGenerators } = require('./literal.js');

const productions = concat(
  es5Generators,
  classGenerators,
  controlGenerators,
  importGenerators,
  structureGenerators,
  literalGenerators,
);

module.exports = { productions };
