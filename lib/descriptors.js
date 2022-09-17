const { takeChrs: take, matchChrs: match, testChrs: test } = require('@cst-tokens/helpers');

const { isArray } = Array;

const escapables = new Map(
  Object.entries({
    '\b': '\\b',
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\v': '\\v',
    '\0': '\\0',
  }),
);
const escapablesInverse = new Map([...escapables].map(([key, value]) => [value, key]));

const StringStart = (value) => {
  const defaultValue = value;
  return {
    type: 'StringStart',
    value,
    mergeable: false,
    build(value) {
      return { type: 'StringStart', value: value || defaultValue };
    },
    *takeChrs() {
      let chrs = null;
      if (value === '`') {
        chrs = yield* match('`');
      } else {
        if ((chrs = yield* match("'"))) {
          // continue
        } else if ((chrs = yield* match('"'))) {
          // continue
        }
      }
      return chrs;
    },
  };
};

const StringEnd = (value) => {
  if (!value) {
    throw new Error('StringEnd must have a specified quotation mark');
  }
  const defaultValue = value;
  return {
    type: 'StringEnd',
    value,
    mergeable: false,
    build(value) {
      return { type: 'StringEnd', value: value || defaultValue };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const String = (value, quot) => {
  if (!quot) {
    throw new Error('String must have a specified quotation mark');
  }
  if (!value) {
    throw new Error('String must have a specified value');
  }
  const defaultValue = value;
  return {
    type: 'String',
    value,
    mergeable: true,
    build(value) {
      return { type: 'String', value: value || defaultValue };
    },
    *takeChrs() {
      const { value } = this;
      let result = '';

      for (const chr of value) {
        const code = chr.charCodeAt(0);

        let chrs = null;
        if (chr === quot && (chrs = yield* take(`\\${quot}`))) {
          // continue
        } else if ((chrs = yield* take(chr))) {
          // continue
        } else if (escapables.has(chr) && (chrs = yield* take(escapables.get(chr)))) {
          // continue
        } else {
          const hex2 = code < 0xff ? code.toString(16).padStart(2, '0') : null;
          if (hex2 && (chrs = yield* take(new RegExp(`\\\\x(${hex2}|${hex2.toUpperCase()})`)))) {
            // continue
          } else {
            const hex4 = code < 0xffff ? code.toString(16).padStart(4, '0') : null;
            if (hex4 && (chrs = yield* take(new RegExp(`\\\\u(${hex4}|${hex4.toUpperCase()})`)))) {
              // continue
            } else if ((chrs = yield* take(/\\u{[0-9a-fA-F]{1,6}}/))) {
              // continue
            }
          }
        }

        if (chrs) {
          result += chrs;
        } else {
          return null;
        }
      }

      return result;
    },
  };
};

const cookQuasi = (raw) => {
  const match = (expr) => {
    if (!expr.sticky) throw new Error('use sticky!');
    expr.lastIndex = idx;
    return expr.exec(raw)?.[0];
  };

  let idx = 0;
  let cooked = '';

  while (idx < raw.length) {
    let rawMatch = null;
    let result = null;
    if ((rawMatch = match(/\\u{[0-9a-fA-F]{1,6}}/y))) {
      result = String.fromCodePoint(parseInt(rawMatch.slice(3, -1), 16));
    } else if ((rawMatch = match(/\\u[0-9a-fA-F]{4}/y))) {
      result = String.fromCodePoint(parseInt(rawMatch.slice(2), 16));
    } else if ((rawMatch = match(/\\u/y))) {
      return null;
    } else if ((rawMatch = match(/\\x[0-9a-fA-F]{2}/y))) {
      result = String.fromCodePoint(parseInt(rawMatch.slice(2), 16));
    } else if ((rawMatch = match(new RegExp([...escapables.values()].join('|'), 'y')))) {
      result = escapablesInverse.get(rawMatch);
    } else if ((rawMatch = match(/\\\n/y))) {
      result = '';
    } else {
      rawMatch = result = raw[idx];
    }
    cooked += result;
    idx += rawMatch.length;
  }

  return cooked;
};

const Quasi = (value) => {
  return {
    type: 'String',
    value,
    mergeable: false,
    build() {
      const { raw } = this.value;
      return { type: 'String', value: raw };
    },
    *takeChrs() {
      const { cooked, raw } = this.value;
      const rawChrs = yield* match(raw);

      if (cookQuasi(rawChrs) !== cooked) {
        // I have no way of knowing which is right!
        throw new Error('cooked and raw quasi values not equivalent');
      }
      return rawChrs;
    },
  };
};

const InterpolateStart = (value) => {
  return {
    type: 'InterpolateStart',
    value,
    mergeable: false,
    build() {
      const { value } = this;
      return { type: 'InterpolateStart', value };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const InterpolateEnd = (value) => {
  return {
    type: 'InterpolateEnd',
    value,
    mergeable: false,
    build() {
      const { value } = this;
      return { type: 'InterpolateEnd', value };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const binPattern = /0b[01](_?[01])*/.source;
const octPattern = /0o[0-7](_?[0-7])*/.source;
const hexPattern = /0x[0-9a-f](_?[0-9a-f])*/.source;
const decPattern = /\d(_?\d)*(\.\d(_?\d)*)?(e(\+-)?\d(_?\d)*)?/.source;
const numPattern = new RegExp(`${binPattern}|${octPattern}|${hexPattern}|${decPattern}`, 'iy');

const Numeric = (value) => {
  const expectedValue = value;
  return {
    type: 'Numeric',
    value,
    mergeable: false,
    build(value) {
      return [{ type: 'Numeric', value: value === undefined ? value : defaultValue }];
    },
    *takeChrs() {
      let match = yield* take(numPattern);

      if (!match) {
        return null;
      }

      match = match.replace(/_/g, '');

      let value;
      if (match.startsWith('0b')) {
        value = parseInt(match.slice(2), 2);
      } else if (match.startsWith('0o')) {
        value = parseInt(match.slice(2), 8);
      } else if (match.startsWith('0x')) {
        value = parseInt(match.slice(2), 16);
      } else if (match.startsWith('0') && /[0-8]+/.test(match)) {
        // legacy octal
        // values like 09 fall back to decimal
        value = parseInt(match.slice(1), 8);
      } else {
        value = parseFloat(match);
      }

      return expectedValue === value ? [this.build(value)] : null;
    },
  };
};

const Whitespace = (value = null) => {
  if (value !== null && !/\s+/s.test(value)) {
    throw new Error('Invalid whitespace descriptor');
  }
  const defaultValue = value;
  return {
    type: 'Whitespace',
    value,
    mergeable: true,
    build(value) {
      return { type: 'Whitespace', value: value || defaultValue || ' ' };
    },
    *takeChrs() {
      return yield* take(this.value || /\s+/s);
    },
  };
};

const Punctuator = (value) => {
  return {
    type: 'Punctuator',
    value,
    mergeable: false,
    build() {
      return { type: 'Punctuator', value };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const LeftPunctuator = (value) => {
  return {
    type: 'LeftPunctuator',
    value,
    mergeable: false,
    build() {
      return { type: 'LeftPunctuator', value };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const RightPunctuator = (value) => {
  return {
    type: 'RightPunctuator',
    value,
    mergeable: false,
    build() {
      return { type: 'RightPunctuator', value };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const Keyword = (value) => {
  return {
    type: 'Keyword',
    value,
    mergeable: false,
    build() {
      return { type: 'Keyword', value };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const Null = () => {
  return {
    type: 'Null',
    value: null,
    mergeable: false,
    build() {
      return { type: 'Null', value: 'null' };
    },
    *takeChrs() {
      return yield* take('null');
    },
  };
};

const Boolean = (value) => {
  const strValue = value ? 'true' : 'false';
  return {
    type: 'Boolean',
    value,
    mergeable: false,
    build(value) {
      return { type: 'Boolean', value: strValue };
    },
    *takeChrs() {
      return yield* take(strValue);
    },
  };
};

const Identifier = (value) => {
  const defaultValue = value;
  return {
    type: 'Identifier',
    value,
    mergeable: false,
    build(value) {
      return { type: 'Identifier', value: value || defaultValue };
    },
    *takeChrs() {
      const { value } = this;
      let result = '';

      for (const chr of value) {
        let code = chr.charCodeAt(0);
        let chrs = null;
        if ((chrs = yield* take(chr))) {
          // continue
        } else if ((chrs = yield* take(new RegExp(`\\\\u${code.toString(16).padStart(4, '0')}`)))) {
          // continue
        } else if ((chrs = yield* take(new RegExp(`\\\\u\\{\d{1,6}\\}`)))) {
          // continue
        }

        if (chrs) {
          result += chrs;
        } else {
          return null;
        }
      }

      return result;
    },
  };
};

const RegularExpression = (value) => {
  const defaultValue = value;
  return {
    type: 'RegularExpression',
    value,
    mergeable: false,
    build(value) {
      return { type: 'RegularExpression', value: value || defaultValue };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const BlockCommentStart = () => {
  return {
    type: 'BlockCommentStart',
    value: '/*',
    mergeable: true,
    build() {
      const { value } = this;
      return { type: 'BlockCommentStart', value };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const BlockCommentEnd = () => {
  return {
    type: 'BlockCommentEnd',
    value: '*/',
    mergeable: true,
    build() {
      const { value } = this;
      return { type: 'BlockCommentEnd', value };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const LineCommentStart = () => {
  return {
    type: 'LineCommentStart',
    value: '//',
    mergeable: true,
    build() {
      const { value } = this;
      return { type: 'LineCommentStart', value };
    },
    *takeChrs() {
      return yield* take(this.value);
    },
  };
};

const Comment = (end) => {
  return {
    type: 'Comment',
    value: null,
    mergeable: true,
    build(value) {
      return { type: 'Comment', value };
    },
    *takeChrs() {
      let result = '';
      // I am consuming this token from the input!
      while (!(yield* test(end))) {
        // too permissive?
        result += yield* take(/./s);
      }
      return result.length ? result : null;
    },
  };
};

const BlockComment = () => Comment('*/');
const LineComment = () => Comment('\n');

const stripArray = (value) => (isArray(value) ? value[0] : value);

module.exports = {
  StringStart,
  StringEnd,
  String,
  Quasi,
  InterpolateStart,
  InterpolateEnd,
  Numeric,
  Null,
  Boolean,
  Whitespace,
  Punctuator,
  LeftPunctuator,
  RightPunctuator,
  Keyword,
  Identifier,
  RegularExpression,
  LineCommentStart,
  LineComment,
  BlockCommentStart,
  BlockComment,
  BlockCommentEnd,

  // Shorthand names for more concise grammar definitions
  // stripArray ensures that both ID`value` and ID(value) are valid
  PN: (value) => Punctuator(stripArray(value)),
  LPN: (value) => LeftPunctuator(stripArray(value)),
  RPN: (value) => RightPunctuator(stripArray(value)),
  KW: (value) => Keyword(stripArray(value)),
};
