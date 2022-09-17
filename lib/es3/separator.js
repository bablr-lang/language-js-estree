const { match, take, reject } = require('@cst-tokens/helpers');
const {
  LineCommentStart,
  LineComment,
  BlockCommentStart,
  BlockComment,
  BlockCommentEnd,
  Whitespace,
} = require('../descriptors.js');

function arrayLast(arr) {
  return arr[arr.length - 1];
}

function concatTokens(...args) {
  let tokens = [];
  for (const arg of args) {
    if (arg) {
      tokens.push(...arg);
    }
  }
  return tokens.length ? tokens : null;
}

function* Comment() {
  let tokens = null;
  let restTokens = null;

  if ((tokens = yield* match(BlockCommentStart()))) {
    const bcTokens = yield* match(BlockComment());
    const bceTokens = yield* take(BlockCommentEnd());
    tokens = bceTokens && concatTokens(tokens, bcTokens, bceTokens);
  } else if ((tokens = yield* match(LineCommentStart()))) {
    const lcTokens = yield* match(LineComment());
    const nlTokens = yield* match(Whitespace('\n'));
    tokens = concatTokens(tokens, lcTokens, nlTokens);
  }

  return concatTokens(tokens, restTokens);
}

function* Separator() {
  let tokenss = []; // A double plural, yes

  let seen = 0;
  let ws = true;
  do {
    tokenss.push(ws ? yield* match(Whitespace()) : yield* Comment());
    seen = arrayLast(tokenss) === null ? seen + 1 : 0;
    ws = !ws;
  } while (seen < 2);

  return concatTokens(...tokenss);
}

const wordTypes = ['Identifier', 'Keyword'];
const noSpaceTypes = ['String'];

const lastDescriptors = new WeakMap();

const handleSeparator = (visitor) =>
  function* handleSeparator(path, context, initialState) {
    const grammar = visitor(path, context, initialState);
    let current = grammar.next();
    let state = initialState;

    lastDescriptors.set(state, lastDescriptors.get(state.path.parentState));

    while (!current.done) {
      const command = current.value;
      const cause = command.error;
      let returnValue;

      command.error = cause && new Error(undefined, { cause });

      switch (command.type) {
        case 'branch': {
          returnValue = state = yield command;
          lastDescriptors.set(state, lastDescriptors.get(state.parent || state));
          break;
        }

        case 'accept': {
          lastDescriptors.set(state.parent, lastDescriptors.get(state));
          returnValue = state = yield command;
          break;
        }

        case 'reject':
        case 'fail': {
          returnValue = state = yield command;
          break;
        }

        case 'take': {
          const descriptor = command.value;
          const { type } = descriptor;
          const lastType = lastDescriptors.get(state)?.type;

          if (type === 'Reference') {
            returnValue = yield command;
          } else {
            lastDescriptors.set(state, descriptor);

            const separatorIsAllowed =
              noSpaceTypes.includes(type) || noSpaceTypes.includes(lastType);
            const separatorIsNeccessary =
              separatorIsAllowed &&
              !!lastType &&
              wordTypes.includes(lastType) &&
              wordTypes.includes(type);

            let separatorTokens = separatorIsAllowed ? null : yield* Separator();

            if (separatorIsNeccessary && !separatorTokens) {
              returnValue = null;
              yield* reject();
            } else {
              const commandTokens = yield command;

              returnValue = commandTokens ? concatTokens(separatorTokens, commandTokens) : null;
            }
          }
          break;
        }

        default: {
          returnValue = yield command;
          break;
        }
      }

      current = grammar.next(returnValue);
    }

    if (state.path.parentState) {
      lastDescriptors.set(state.path.parentState, lastDescriptors.get(state));
    }
  };

module.exports = { Comment, Separator, handleSeparator };
