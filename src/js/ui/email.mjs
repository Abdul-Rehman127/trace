// The mistake-report address is assembled here so it never appears whole in the HTML.
// Without JavaScript, [data-email] elements keep their plain text fallback
// ("Email: abdul at abmans dot com").
import { h } from './dom.mjs';

const address = () => [['a', 'b', 'd', 'u', 'l'].join(''), ['abmans', 'com'].join('.')].join('@');

function fill(el) {
  const addr = address();
  const subject = el.getAttribute('data-email-subject');
  const href = `mailto:${addr}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  if (el.tagName === 'A') {
    el.setAttribute('href', href);
    el.textContent = addr;
    return;
  }
  const label = el.getAttribute('data-email-label');
  el.replaceChildren(...(label === null ? ['Email: '] : label ? [label, ' '] : []), h('a', { href, text: addr }));
}

/** Fill every [data-email] element, including those inside <template> content. */
export function fillEmails(root = document) {
  for (const el of root.querySelectorAll('[data-email]')) fill(el);
  for (const t of root.querySelectorAll('template')) fillEmails(t.content);
}
