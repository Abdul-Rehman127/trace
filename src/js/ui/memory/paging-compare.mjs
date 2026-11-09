// The page replacement compare page: all four algorithms on the same input.
import { encodePaging, decodePaging } from '../../engine/memory/share.mjs';
import { defaultPaging } from '../../engine/memory/presets.mjs';
import { cmpRowsTree, cmpStripsTree, byFramesTree, cmpNote, compareResults } from '../../engine/memory/views.mjs';
import { fromTree, createToast, bindCopy } from '../dom.mjs';
import { createPagingInputs } from './paging-inputs.mjs';

const URL_DEBOUNCE = 400;

export function mountPagingCompare(root) {
  const rows = root.querySelector('[data-cmp-rows]');
  const strips = root.querySelector('[data-cmp-strips]');
  const byFrames = root.querySelector('[data-byframes]');
  const note = root.querySelector('[data-cmp-note]');
  const toast = createToast(root.querySelector('[data-toast]'));
  const decoded = decodePaging(window.location.search, defaultPaging('fifo'));
  let current = null;

  function render(input) {
    current = { ...input, algorithm: 'fifo' };
    const results = compareResults(current);
    rows.replaceChildren(...cmpRowsTree(current, results).map(fromTree));
    strips.replaceChildren(...cmpStripsTree(results).map(fromTree));
    byFrames.replaceChildren(...byFramesTree(current).map(fromTree));
    note.textContent = cmpNote(current, results);
  }

  // The compare page has no algorithm of its own; the link keeps the pages, frames and Clock bit.
  const query = () => encodePaging(current).replace(/^alg=fifo&/, '');
  let urlTimer = 0;
  function scheduleUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      try {
        window.history.replaceState(window.history.state, '', `${window.location.pathname}?${query()}${current.options.newBit === 0 ? '&bit=0' : ''}`);
      } catch {
        /* the copy button still works */
      }
    }, URL_DEBOUNCE);
  }

  const inputs = createPagingInputs(root, {
    initial: decoded.input,
    onChange: (input) => {
      if (!input) return;
      render(input);
      scheduleUrl();
    },
  });
  bindCopy(root, () => `${window.location.origin}${window.location.pathname}?${query()}${current.options.newBit === 0 ? '&bit=0' : ''}`, toast);

  render(inputs.value() || decoded.input);
  if (decoded.notices.length) toast(decoded.notices.join(' '), 7000);
  return { get current() {
    return current;
  } };
}
