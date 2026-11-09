// Contrast checks for the color tokens in src/css/tokens.css (WCAG 2 formula).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/css/tokens.css', import.meta.url), 'utf8');

function block(selectorRe) {
  const m = selectorRe.exec(css);
  assert.ok(m, `block ${selectorRe} found`);
  const start = css.indexOf('{', m.index) + 1;
  let depth = 1;
  let i = start;
  while (depth) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') depth--;
    i++;
  }
  const tokens = {};
  for (const [, k, v] of css.slice(start, i - 1).matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) tokens[k] = v;
  return tokens;
}

const light = block(/^:root\s*\{/m);
const darkMedia = block(/:root:not\(\[data-theme="light"\]\)\s*\{/);
const darkManual = block(/^:root\[data-theme="dark"\]\s*\{/m);

function luminance(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

test('both dark blocks define the same tokens', () => {
  assert.deepEqual(darkMedia, darkManual);
});

for (const [name, t] of [['light', light], ['dark', darkMedia]]) {
  test(`${name}: text tokens reach 4.5:1 on every background`, () => {
    for (const fg of ['ink', 'ink-2', 'muted']) {
      for (const bg of ['bg', 'surface', 'sunk']) {
        const c = contrast(t[fg], t[bg]);
        assert.ok(c >= 4.5, `--${fg} on --${bg} is ${c.toFixed(2)}:1`);
      }
    }
  });
  test(`${name}: inverted primary button text reaches 4.5:1`, () => {
    assert.ok(contrast(t.bg, t.ink) >= 4.5);
  });
  test(`${name}: focus ring reaches 3:1 against backgrounds`, () => {
    for (const bg of ['bg', 'surface']) assert.ok(contrast(t.focus, t[bg]) >= 3, `focus on ${bg}`);
  });
  test(`${name}: control borders reach 3:1 in every state`, () => {
    // Default border, hover border, and the selected fill all mark a button's edge.
    for (const edge of ['line-control', 'muted', 'ink']) {
      for (const bg of ['bg', 'surface']) {
        const c = contrast(t[edge], t[bg]);
        assert.ok(c >= 3, `--${edge} on --${bg} is ${c.toFixed(2)}:1`);
      }
    }
  });
  test(`${name}: text on every process bar reaches 4.5:1`, () => {
    for (let i = 1; i <= 8; i++) {
      const c = contrast(t[`c${i}`], t[`on-c${i}`]);
      assert.ok(c >= 4.5, `on-c${i} over c${i} is ${c.toFixed(2)}:1`);
    }
  });
  test(`${name}: process fills are the locked set`, () => {
    const fills = Array.from({ length: 8 }, (_, i) => t[`c${i + 1}`].toLowerCase());
    assert.deepEqual(fills, name === 'light'
      ? ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']
      : ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']);
  });
}
