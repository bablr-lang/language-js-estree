const { take } = require('cst-tokens/commands');
const { OPT, ID, PN, KW, ref, _, __ } = require('@cst-tokens/js-descriptors');
const { visitors: importVisitors } = require('./import');
const { visitors: logicVisitors } = require('./logic');
const { visitors: structureVisitors } = require('./structure');
const { visitors: literalVisitors } = require('./literal');
const { commaSeparatedList } = require('./common');

const visitors = {
  *Program(path) {
    const { node } = path;

    yield take(_);

    if (node.directives) {
      for (const _n of node.directives) {
        yield take(ref`directives`, _);
      }
    }
    for (const _n of node.body) {
      yield take(ref`body`, _);
    }
  },

  *BlockStatement(path) {
    const { node } = path;
    yield take(PN`{`);
    yield take(_);
    if (node.directives) {
      for (const _n of node.directives) {
        yield take(ref`directives`, _);
      }
    }
    for (const _n of node.body) {
      yield take(ref`body`, _);
    }
    yield take(PN`}`);
  },

  *Identifier(path) {
    const { node } = path;
    yield take(ID(node.name));
  },

  *VariableDeclaration(path) {
    const { node } = path;
    if (!['const', 'let', 'var'].includes(node.kind)) {
      throw new Error('Unsupported variable declaration type');
    }
    yield take(KW(node.kind), __);
    yield* commaSeparatedList(node, 'declarations', { allowTrailing: false });
    yield take(_, OPT(PN`;`));
  },

  *VariableDeclarator() {
    yield take(ref`id`, _, PN`=`, _, ref`init`);
  },

  *FunctionDeclaration(path) {
    const { node } = path;
    if (node.async) yield take(KW`async`, __);
    yield take(KW`function`);
    yield node.generator ? take(_, PN`*`, _) : take(__);
    yield take(ref`id`, _, PN`(`, _);
    yield* commaSeparatedList(node, 'params');
    yield take(_, PN`)`, _, ref`body`);
    yield take(_, OPT(PN`;`));
  },

  *FunctionExpression(path) {
    const { node, parentNode } = path;
    if (node.async) {
      yield take(KW`async`, __);
    }
    const isObjectShorthand = parentNode.type === 'Property' && parentNode.method;
    if (!isObjectShorthand) {
      yield take(KW`function`);
    }
    if (node.generator) {
      yield take(_, PN`*`, _);
    } else if (!node.async) {
      yield take(__);
    }
    if (node.id) {
      yield take(ref`id`, _);
    } else if (isObjectShorthand) {
      yield take(ID(parentNode.key), _);
    }
    yield take(PN`(`, _);
    yield* commaSeparatedList(node, 'params');
    yield take(_, PN`)`, _, ref`body`);
  },

  *ArrowFunctionExpression(path) {
    const { node } = path;
    if (node.async) yield take(KW`async`, _);
    yield take(PN`(`);
    yield* commaSeparatedList(node, 'params');
    yield take(PN`)`, _, PN`=>`, _, ref`body`);
  },

  *AssignmentExpression() {
    yield take(ref`left`, _, PN`=`, _, ref`right`);
  },

  *ExpressionStatement() {
    yield take(ref`expression`, _, OPT(PN`;`));
  },

  *CallExpression(path) {
    const { node } = path;
    yield take(ref`callee`, _, PN`(`);
    yield take(commaSeparatedList(node, 'arguments'));
    yield take(_, PN`)`);
  },

  ...importVisitors,
  ...logicVisitors,
  ...structureVisitors,
  ...literalVisitors,
};

module.exports = { visitors, default: visitors };
