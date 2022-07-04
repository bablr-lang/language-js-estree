# @cst-tokens/js-grammar-estree

A [cst-tokens](https://github.com/js-cst-tokens/cst-tokens) grammar used for adding CST tokens to estree-compatible ASTs.

## Usage

```js
import { parseModule } from 'meriyah';
import { updateTokens, print } from 'cst-tokens';
import jsGrammar from '@cst-tokens/js-grammar-estree';

const sourceText = `export * from 'source';`;

updateTokens(parseModule(sourceText), jsGrammar, { sourceText });
```
