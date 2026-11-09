// Boolean expressions: tokenizer, precedence parser with positioned errors, evaluation,
// truth tables and printing. Pure, no DOM. Rules in sections/logic/SPEC.md.
// Precedence, highest first: NOT; AND, NAND; XOR, XNOR; OR, NOR. Binary operators are
// left-associative; two operands side by side mean AND.

export const MAX_VARS = 6;

const WORDS = { AND: 'AND', OR: 'OR', NOT: 'NOT', XOR: 'XOR', NAND: 'NAND', NOR: 'NOR', XNOR: 'XNOR', TRUE: '1', FALSE: '0' };
const SYMBOLS = [
  ['&&', 'AND'], ['||', 'OR'],
  ['&', 'AND'], ['*', 'AND'], ['·', 'AND'], ['∧', 'AND'], ['.', 'AND'],
  ['|', 'OR'], ['+', 'OR'], ['∨', 'OR'],
  ['^', 'XOR'], ['⊕', 'XOR'], ['⊙', 'XNOR'], ['↑', 'NAND'], ['↓', 'NOR'],
  ['!', 'NOT'], ['~', 'NOT'], ['¬', 'NOT'],
  ["'", 'POSTNOT'], ['’', 'POSTNOT'],
  ['(', '('], [')', ')'],
];

/** Tokens: { k: kind, v?: value, pos: 1-based position, text }. */
export function tokenize(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z]/.test(src[j])) j++;
      const word = src.slice(i, j).toUpperCase();
      if (WORDS[word] === '1' || WORDS[word] === '0') out.push({ k: 'const', v: WORDS[word] === '1', pos: i + 1, text: src.slice(i, j) });
      else if (WORDS[word]) out.push({ k: WORDS[word], pos: i + 1, text: src.slice(i, j) });
      else {
        // A run of letters that is not an operator word is a run of single-letter variables: AB = A AND B.
        for (let p = i; p < j; p++) out.push({ k: 'var', v: src[p].toUpperCase(), pos: p + 1, text: src[p] });
      }
      i = j;
      continue;
    }
    if (ch === '0' || ch === '1') {
      out.push({ k: 'const', v: ch === '1', pos: i + 1, text: ch });
      i++;
      continue;
    }
    const sym = SYMBOLS.find(([s]) => src.startsWith(s, i));
    if (sym) {
      out.push({ k: sym[1], pos: i + 1, text: sym[0] });
      i += sym[0].length;
      continue;
    }
    throw new LogicError(i + 1, `"${ch}" is not part of an expression. Use letters A to Z, 0, 1, operators and parentheses.`);
  }
  return out;
}

export class LogicError extends Error {
  constructor(pos, message) {
    super(`Position ${pos}: ${message}`);
    this.pos = pos;
  }
}

const LEVELS = [
  ['OR', 'NOR'],
  ['XOR', 'XNOR'],
  ['AND', 'NAND'],
];
const startsOperand = (t) => t && (t.k === 'var' || t.k === 'const' || t.k === '(' || t.k === 'NOT');

/**
 * Parse an expression. Returns { ast, vars, error } where error is a message with a
 * 1-based position, or null. AST nodes: { t: 'var', name } | { t: 'const', v } |
 * { t: 'not', a } | { t: 'bin', op, a, b }.
 */
export function parseExpr(src) {
  const text = typeof src === 'string' ? src : '';
  if (!text.trim()) return { ast: null, vars: [], error: 'Enter an expression, such as A AND (B OR NOT C).', pos: 1 };
  let tokens;
  try {
    tokens = tokenize(text);
  } catch (e) {
    return { ast: null, vars: [], error: e.message, pos: e.pos };
  }
  let i = 0;
  const peek = () => tokens[i];
  const endPos = text.length + 1;
  const describe = (t) => (t ? `"${t.text}"` : 'the end');
  const after = () => (i > 0 ? ` after ${describe(tokens[i - 1])}` : '');

  function binary(level) {
    if (level === LEVELS.length) return unary();
    let left = binary(level + 1);
    for (;;) {
      const t = peek();
      if (t && LEVELS[level].includes(t.k)) {
        i++;
        const right = binary(level + 1);
        left = { t: 'bin', op: t.k, a: left, b: right };
      } else if (level === LEVELS.length - 1 && startsOperand(t)) {
        // Implicit AND: two operands side by side.
        const right = unary();
        left = { t: 'bin', op: 'AND', a: left, b: right };
      } else return left;
    }
  }
  function unary() {
    const t = peek();
    if (t && t.k === 'NOT') {
      i++;
      return postfix({ t: 'not', a: unary() });
    }
    return postfix(primary());
  }
  function postfix(node) {
    let n = node;
    while (peek() && peek().k === 'POSTNOT') {
      i++;
      n = { t: 'not', a: n };
    }
    return n;
  }
  function primary() {
    const t = peek();
    if (!t) throw new LogicError(endPos, `expected a variable, 0, 1, NOT or "("${after()}, but the expression ends here.`);
    if (t.k === 'var') {
      i++;
      return { t: 'var', name: t.v };
    }
    if (t.k === 'const') {
      i++;
      return { t: 'const', v: t.v };
    }
    if (t.k === '(') {
      i++;
      const inner = binary(0);
      const close = peek();
      if (!close || close.k !== ')') throw new LogicError(close ? close.pos : endPos, `expected ")" to close the "(" at position ${t.pos}.`);
      i++;
      return inner;
    }
    throw new LogicError(t.pos, `expected a variable, 0, 1, NOT or "("${after()}, not ${describe(t)}.`);
  }

  try {
    const ast = binary(0);
    if (i < tokens.length) {
      const t = tokens[i];
      throw new LogicError(t.pos, t.k === ')' ? 'this ")" has no matching "(".' : `expected an operator before ${describe(t)}.`);
    }
    const vars = [...variablesOf(ast)].sort();
    if (vars.length > MAX_VARS) return { ast: null, vars, error: `This expression uses ${vars.length} variables (${vars.join(', ')}). Trace handles up to ${MAX_VARS}.`, pos: 1 };
    return { ast, vars, error: null, pos: null };
  } catch (e) {
    if (e instanceof LogicError) return { ast: null, vars: [], error: e.message, pos: e.pos };
    throw e;
  }
}

export function variablesOf(ast, set = new Set()) {
  if (ast.t === 'var') set.add(ast.name);
  else if (ast.t === 'not') variablesOf(ast.a, set);
  else if (ast.t === 'bin') {
    variablesOf(ast.a, set);
    variablesOf(ast.b, set);
  }
  return set;
}

export const OPS = {
  AND: (a, b) => a && b,
  OR: (a, b) => a || b,
  XOR: (a, b) => a !== b,
  NAND: (a, b) => !(a && b),
  NOR: (a, b) => !(a || b),
  XNOR: (a, b) => a === b,
};

/** Evaluate with an assignment { A: true, ... }. */
export function evaluate(ast, env) {
  switch (ast.t) {
    case 'var':
      return !!env[ast.name];
    case 'const':
      return ast.v;
    case 'not':
      return !evaluate(ast.a, env);
    default:
      return OPS[ast.op](evaluate(ast.a, env), evaluate(ast.b, env));
  }
}

/** The assignment for row r over vars (first variable is the most significant bit). */
export function rowEnv(vars, r) {
  const env = {};
  vars.forEach((v, i) => (env[v] = ((r >> (vars.length - 1 - i)) & 1) === 1));
  return env;
}

/** Output column of the truth table: outputs[r] for r = 0..2^n - 1. */
export function truthColumn(ast, vars) {
  return Array.from({ length: 2 ** vars.length }, (_, r) => evaluate(ast, rowEnv(vars, r)));
}

const SYMBOL = { AND: 'AND', OR: 'OR', XOR: 'XOR', NAND: 'NAND', NOR: 'NOR', XNOR: 'XNOR' };
const PREC = { OR: 0, NOR: 0, XOR: 1, XNOR: 1, AND: 2, NAND: 2 };

/** Print an expression with only the parentheses its precedence needs. */
export function toText(ast, parentPrec = -1, rightSide = false) {
  if (ast.t === 'var') return ast.name;
  if (ast.t === 'const') return ast.v ? '1' : '0';
  if (ast.t === 'not') {
    const inner = toText(ast.a, 3);
    return ast.a.t === 'var' || ast.a.t === 'const' || ast.a.t === 'not' ? `NOT ${inner}` : `NOT (${toText(ast.a)})`;
  }
  const p = PREC[ast.op];
  const s = `${toText(ast.a, p)} ${SYMBOL[ast.op]} ${toText(ast.b, p, true)}`;
  return p < parentPrec || (rightSide && p === parentPrec) ? `(${s})` : s;
}

/** Every distinct subexpression (not the variables), innermost first, for truth-table columns. */
export function subexpressions(ast) {
  const out = [];
  const seen = new Set();
  (function walk(n) {
    if (n.t === 'var' || n.t === 'const') return;
    if (n.t === 'not') walk(n.a);
    else {
      walk(n.a);
      walk(n.b);
    }
    const key = toText(n);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(n);
    }
  })(ast);
  return out;
}
