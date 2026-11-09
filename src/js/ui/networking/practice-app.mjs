// Subnetting practice: one generated question at a time, checked in the browser.
// Nothing is stored; the question lives in the link (seed, level, kind).
import { makeQuestion, checkAnswer, HINTS } from '../../engine/networking/practice.mjs';
import { encodePractice, decodePractice } from '../../engine/networking/share.mjs';
import { h, createToast, bindCopy, autoGrow, replaceQuery } from '../dom.mjs';

const FIRST_SEED = 20261108;

/** A fresh 32-bit seed for "Next question". */
function newSeed() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}

export function mountPractice(root) {
  const prompt = root.querySelector('[data-pr-prompt]');
  const meta = root.querySelector('[data-pr-meta]');
  const form = root.querySelector('[data-pr-form]');
  const answer = root.querySelector('[data-pr-answer]');
  const hint = root.querySelector('[data-pr-hint]');
  const result = root.querySelector('[data-pr-result]');
  const steps = root.querySelector('[data-pr-steps]');
  const levelButtons = [...root.querySelectorAll('[data-level] button')];
  const typeButtons = [...root.querySelectorAll('[data-type]')];
  const toast = createToast(root.querySelector('[data-toast]'));
  const grow = autoGrow(answer);

  const decoded = decodePractice(window.location.search);
  const state = { seed: decoded.seed ?? FIRST_SEED, level: decoded.level, type: decoded.type };
  let q = null;

  function show({ fromUser }) {
    q = makeQuestion(state.seed, state.level, state.type);
    prompt.textContent = q.prompt;
    meta.textContent = `(level ${state.level})`;
    hint.textContent = HINTS[q.format];
    answer.value = '';
    answer.removeAttribute('aria-invalid');
    grow();
    result.replaceChildren();
    steps.replaceChildren(...q.steps.map((s) => h('li', { text: s })));
    steps.hidden = true;
    for (const b of levelButtons) b.setAttribute('aria-pressed', String(Number(b.dataset.value) === state.level));
    for (const b of typeButtons) b.setAttribute('aria-pressed', String(b.dataset.type === state.type));
    if (fromUser) replaceQuery(encodePractice(state));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const r = checkAnswer(q, answer.value);
    if (!r.readable) {
      answer.setAttribute('aria-invalid', 'true');
      result.replaceChildren(h('span', { class: 'no', text: `That answer could not be read. ${HINTS[q.format]}` }));
      return;
    }
    answer.removeAttribute('aria-invalid');
    result.replaceChildren(
      r.ok ? h('span', { class: 'ok', text: 'Correct.' }) : h('span', { class: 'no', text: `Not quite. The answer is ${r.expected}.` }),
    );
    steps.hidden = false;
  });
  root.querySelector('[data-pr-show]').addEventListener('click', () => {
    result.replaceChildren(h('span', { text: `The answer is ${q.answer}.` }));
    steps.hidden = false;
  });
  root.querySelector('[data-pr-next]').addEventListener('click', () => {
    state.seed = newSeed();
    show({ fromUser: true });
    answer.focus();
  });
  for (const b of levelButtons) {
    b.addEventListener('click', () => {
      state.level = Number(b.dataset.value);
      state.seed = newSeed();
      show({ fromUser: true });
    });
  }
  for (const b of typeButtons) {
    b.addEventListener('click', () => {
      state.type = b.dataset.type;
      state.seed = newSeed();
      show({ fromUser: true });
    });
  }
  bindCopy(root, () => `${window.location.origin}${window.location.pathname}?${encodePractice(state)}`, toast);

  show({ fromUser: false });
  return { get question() {
    return q;
  }, state };
}
