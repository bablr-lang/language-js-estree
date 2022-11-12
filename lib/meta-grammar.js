const debug = require('debug');
const {
  eatMatch,
  eat,
  match,
  eatMatchGrammar,
  eatGrammar,
  matchGrammar,
  startNode,
  endNode,
} = require('@cst-tokens/helpers/commands');
const sym = require('@cst-tokens/helpers/symbols');
const { Separator } = require('./common.js');

const arrayLast = (arr) => arr[arr.length - 1];

const spaceDelimitedTypes = ['Literal', 'SymbolReference', 'SymbolDefinition', 'Keyword'];
const noSpaceTypes = ['String', 'Quasi', 'InterpolateStart', 'InterpolateEnd'];

const traces = debug.enabled('cst-tokens') ? true : undefined;

const lastDescriptors = new WeakMap();

const findLastDesc = (state) => {
  let s = state;
  let lastDesc = null;
  while (s && !(lastDesc = lastDescriptors.get(s))) {
    s = s.parent;
  }
  return lastDesc;
};

const grammarHelpersByTokenCommand = new Map([
  [sym.eat, eatGrammar],
  [sym.eatMatch, eatMatchGrammar],
  [sym.match, matchGrammar],
]);

const WithSeparator = (visitor) => {
  function* WithSeparator__(path, context, getState) {
    const grammar = visitor(path, context, getState);
    const rootState = getState();
    let current = grammar.next();
    let state;

    while (!current.done) {
      const command = current.value;
      const { type, value, error: cause } = command;

      let returnValue;

      state = getState();

      switch (type) {
        case sym.eatGrammar:
        case sym.matchGrammar:
        case sym.eatMatchGrammar: {
          // I'm not able to propagate my custom state through this statement!
          // I have no access to the child state form outside
          // I have no access to the parent state from inside
          returnValue = yield {
            type,
            value: path.node.type === 'CSTFragment' ? value : WithSeparator(value),
            error: traces && new Error(undefined, cause && { cause }),
          };
          break;
        }

        case sym.eat:
        case sym.match:
        case sym.eatMatch: {
          const desc = value;
          const lastDesc = findLastDesc(state);

          if (type !== sym.match) {
            lastDescriptors.set(state, desc);
          }

          const sepIsAllowed =
            !lastDesc ||
            (!noSpaceTypes.includes(desc.type) &&
              !noSpaceTypes.includes(lastDesc.type) &&
              !(lastDesc.type === 'StringStart' && desc.type === 'StringEnd'));

          if (sepIsAllowed) {
            const sepIsNecessary =
              !!lastDesc &&
              spaceDelimitedTypes.includes(lastDesc.type) &&
              spaceDelimitedTypes.includes(desc.type);

            debugger;
            const helper = grammarHelpersByTokenCommand.get(type);
            const result = yield* helper(function* WithSeparator() {
              if (sepIsNecessary) {
                yield* eat(Separator);
              } else {
                yield* eatMatch(Separator);
              }

              let s = getState();
              while (s.hoist) {
                yield* startNode();
                s = getState();
              }

              yield {
                type: sym.eat,
                value,
                error: traces && new Error(undefined, cause && { cause }),
              };
            });

            returnValue = result && arrayLast(result);
          } else {
            returnValue = yield command;
          }

          break;
        }

        default:
          returnValue = yield command;
          break;
      }

      if (state.parent) {
        lastDescriptors.set(state.parent, lastDescriptors.get(state));
      }

      current = grammar.next(returnValue);
    }

    if (rootState.status !== sym.rejected && !rootState.hoist && !rootState.isRoot) {
      yield* endNode();
    }
  }

  Object.defineProperty(WithSeparator__, 'name', { value: `WithWhitespace_${visitor.name}` });

  return WithSeparator__;
};

const withSeparator = (visitors) => {
  const { CSTFragment } = visitors;
  const transformed = {};
  if (CSTFragment) transformed[CSTFragment] = CSTFragment;
  for (const [type, visitor] of Object.entries(visitors)) {
    transformed[type] = WithSeparator(visitor);
  }
  return transformed;
};

module.exports = { withSeparator };
