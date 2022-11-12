const regexEscape = require('escape-string-regexp');
const debug = require('debug')('cst-tokens');

const {
  eatChrs: eat,
  eatMatchChrs: eatMatch,
  matchChrs: match,
} = require('@cst-tokens/helpers/commands');
const {
  Literal: Literal_,
  Punctuator,
  LeftPunctuator,
  RightPunctuator,
  Keyword,
} = require('@cst-tokens/helpers/descriptors');
const { EOF } = require('@cst-tokens/helpers/symbols');

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
    *eatChrs() {
      return yield* eatMatch(value || /['"]/);
    },
  };
};

const StringEnd = (value) => {
  if (!value) {
    throw new Error('StringEnd must have a specified quotation mark');
  }
  return {
    type: 'StringEnd',
    value,
    mergeable: false,
    build(value) {
      return { type: 'StringEnd', value };
    },
    *eatChrs() {
      return yield* eat(this.value);
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
    *eatChrs(context) {
      const { value } = this;
      const { grammarOptions } = context;
      const unicode = grammarOptions.esVersion >= 6;
      let result = '';

      for (const chr of value) {
        const code = chr.charCodeAt(0);

        let chrs = null;
        if (chr === quot && (chrs = yield* eat(`\\${quot}`))) {
          // continue
        } else if ((chrs = yield* eat(chr))) {
          // continue
        } else if (escapables.has(chr) && (chrs = yield* eat(escapables.get(chr)))) {
          // continue
        } else {
          const hex2 = code < 0xff ? code.toString(16).padStart(2, '0') : null;
          if (hex2 && (chrs = yield* eat(new RegExp(`\\\\x(${hex2}|${hex2.toUpperCase()})`)))) {
            // continue
          } else if (unicode) {
            const hex4 = code < 0xffff ? code.toString(16).padStart(4, '0') : null;
            if (hex4 && (chrs = yield* eat(new RegExp(`\\\\u(${hex4}|${hex4.toUpperCase()})`)))) {
              if (!unicode) {
                debug(`\\u escape is not allowed in es {version: ${grammarOptions.esVersion}}!`);
                return null;
              }
            } else if ((chrs = yield* eat(/\\u{[0-9a-fA-F]{1,6}}/))) {
              if (!unicode) {
                debug(`\\u escape is not allowed in es {version: ${grammarOptions.esVersion}}!`);
                return null;
              }
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
  const eatMatch = (expr) => {
    if (!expr.sticky) throw new Error('use sticky!');
    expr.lastIndex = idx;
    return expr.exec(raw)?.[0];
  };

  let idx = 0;
  let cooked = '';

  while (idx < raw.length) {
    let rawMatch = null;
    let result = null;
    if ((rawMatch = eatMatch(/\\u{[0-9a-fA-F]{1,6}}/y))) {
      result = String.fromCodePoint(parseInt(rawMatch.slice(3, -1), 16));
    } else if ((rawMatch = eatMatch(/\\u[0-9a-fA-F]{4}/y))) {
      result = String.fromCodePoint(parseInt(rawMatch.slice(2), 16));
    } else if ((rawMatch = eatMatch(/\\u/y))) {
      return null;
    } else if ((rawMatch = eatMatch(/\\x[0-9a-fA-F]{2}/y))) {
      result = String.fromCodePoint(parseInt(rawMatch.slice(2), 16));
    } else if ((rawMatch = eatMatch(new RegExp([...escapables.values()].join('|'), 'y')))) {
      result = escapablesInverse.get(rawMatch);
    } else if ((rawMatch = eatMatch(/\\\n/y))) {
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
    *eatChrs() {
      const { cooked, raw } = this.value;
      const rawChrs = yield* eatMatch(raw);

      if (cookQuasi(rawChrs) !== cooked) {
        // I have no way of knowing which is right!
        throw new Error('cooked and raw quasi values not equivalent');
      }
      return rawChrs;
    },
  };
};

const binPattern = /0b[01](_?[01])*/.source;
const octPattern = /0o[0-7](_?[0-7])*/.source;
const hexPattern = /0x[0-9a-f](_?[0-9a-f])*/.source;
const decPattern = /\d(_?\d)*(\.\d(_?\d)*)?(e(\+-)?\d(_?\d)*)?/.source;
const numPattern = new RegExp(`${binPattern}|${octPattern}|${hexPattern}|${decPattern}`, 'iy');

const Numeric = (value) => {
  const defaultValue = value;
  return {
    type: 'Numeric',
    value,
    mergeable: false,
    build(value) {
      return [{ type: 'Numeric', value: value === undefined ? value : defaultValue }];
    },
    *eatChrs(context) {
      const { grammarOptions } = context;
      const legacy = grammarOptions.esVersion === 3;
      let eatMatch = yield* eat(numPattern);

      if (!eatMatch) {
        return null;
      }

      eatMatch = eatMatch.replace(/_/g, '');

      let value;
      if (eatMatch.startsWith('0b')) {
        value = parseInt(eatMatch.slice(2), 2);
      } else if (eatMatch.startsWith('0o')) {
        value = parseInt(eatMatch.slice(2), 8);
      } else if (eatMatch.startsWith('0x')) {
        value = parseInt(eatMatch.slice(2), 16);
      } else if (eatMatch.startsWith('0') && /[0-8]+/.test(eatMatch)) {
        if (!legacy) {
          debug('Octal escapes are currently forbidden in es5+. Reading "use strict" is hard!');
          return null;
        }
        // values like 09 fall back to decimal
        value = parseInt(eatMatch.slice(1), 8);
      } else {
        value = parseFloat(eatMatch);
      }

      return defaultValue === value ? [this.build(value)] : null;
    },
  };
};

const Whitespace = (value = null) => {
  if (value !== null && !/ \t\v\f+/.test(value)) {
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
    *eatChrs() {
      return yield* eat(this.value || /[ \t\v\f]+/);
    },
  };
};

const Identifier = (type, value) => {
  const defaultValue = value;
  return {
    type,
    value,
    mergeable: false,
    build(value) {
      return { type, value: value || defaultValue };
    },
    *eatChrs(context) {
      const { value } = this;
      const { grammarOptions } = context;
      const u = grammarOptions.esVersion >= 6;
      let result = '';

      let perfectMatch;
      if ((perfectMatch = yield* eatMatch(regexEscape(value)))) {
        return perfectMatch;
      }

      for (const chr of value) {
        let code = chr.charCodeAt(0);
        let chrs = null;

        // prettier-ignore
        if ((chrs = yield* eatMatch(chr))) {
          // continue
        } else if ((chrs = yield* eatMatch(new RegExp(`\\\\u${code.toString(16).padStart(4, '0')}`)))) {
          if (!u) {
            debug(`\\u escape is not allowed in es {version: ${grammarOptions.esVersion}}!`);
            return null;
          }
        } else if ((chrs = yield* eatMatch(new RegExp(`\\\\u\\{\\d{1,6}\\}`)))) {
          if (!u) {
            debug(`\\u{} escape is not allowed in es {version: ${grammarOptions.esVersion}}!`);
            return null;
          }
        } else {
          return null;
        }

        result += chrs;
      }

      return result;
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
    *eatChrs() {
      let result = '';

      if (yield* match(EOF)) return null;

      while (!(yield* match(end))) {
        result += yield* eat(/[^\r\n\*\/]+/);
        if (yield* match(EOF)) break;
      }
      return result.length ? result : null;
    },
  };
};

const InterpolateStart = (value) => Literal_('InterpolateStart', value);
const InterpolateEnd = (value) => Literal_('InterpolateEnd', value);
const Null = () => Literal_('Null', 'null');
const Boolean = (value) => Literal_('Boolean', value ? 'true' : 'false');
const RegularExpression = (value) => Literal_('RegularExpression', value);
const BlockCommentStart = () => Literal_('CommentStart', '/*');
const BlockCommentEnd = () => Literal_('CommentEnd', '*/');
const BlockComment = () => Comment('*/');
const LineCommentStart = () => Literal_('LineCommentStart', '//');
const LineComment = () => Comment(/\r|\n/);
const Literal = (value) => Identifier('Literal', value);
const SymbolDefinition = (value) => Identifier('SymbolDefinition', value);
const SymbolReference = (value) => Identifier('SymbolReference', value);

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
  RegularExpression,
  LineCommentStart,
  LineComment,
  BlockCommentStart,
  BlockCommentEnd,
  BlockComment,
  Literal,
  SymbolDefinition,
  SymbolReference,
};
