const { map } = require('@cst-tokens/helpers/iterable');

const { WithSeparator } = require('../meta-productions.js');
const { context: es3Context } = require('../es3/context.js');
const { getIdentifierDescriptor } = require('./enhancers/symbol.js');
const { productions } = require('./productions/index.js');

const context = {
  ...es3Context,
  esVersion: 5,
  getIdentifierDescriptor,
};

const grammar = {
  context,
  productions: map(productions, ([type, production]) => {
    return [type, type === 'CSTFragment' ? production : WithSeparator(production)];
  }),
};

module.exports = { grammar, context, productions, default: grammar };
