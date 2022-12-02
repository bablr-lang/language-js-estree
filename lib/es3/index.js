const { map } = require('@cst-tokens/helpers/iterable');

const { WithSeparator } = require('../meta-productions.js');
const { productions } = require('./productions/index.js');

const context = {
  esVersion: 3,
  ignoreProperties: ['loc', 'range', 'start', 'end', 'extra'],
};

const grammar = {
  context,
  productions: map(productions, ([type, production]) => {
    return [type, type === 'CSTFragment' ? production : WithSeparator(production)];
  }),
};

module.exports = { grammar, context, productions, default: grammar };
