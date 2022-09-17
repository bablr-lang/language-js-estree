const { eat, ref, emit } = require('@cst-tokens/helpers');
const { Separator } = require('./es3/separator.js');

const grammarBase = {
  isHoistable(token) {
    return (
      token.type === 'Whitespace' || (token.type === 'Punctuator' && '()'.includes(token.value))
    );
  },
  *Fragment() {
    yield* eat(ref`fragment`);
    yield* emit(yield* Separator());
  },
};

module.exports = { grammarBase };
