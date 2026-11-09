// Tiny DOM helpers. Everything is built with createElement and textContent;
// nothing in Trace parses HTML strings (the CSP enforces Trusted Types).

const SVG_NS = 'http://www.w3.org/2000/svg';

function apply(el, props) {
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'vars') for (const [name, value] of Object.entries(v)) el.style.setProperty(name, String(value));
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  return el;
}

const kids = (children) => children.flat(Infinity).filter((c) => c != null && c !== false && c !== '');

/** h('button', { class: 'x', onclick }, 'Label', child) */
export function h(tag, props = {}, ...children) {
  const el = apply(document.createElement(tag), props);
  el.append(...kids(children));
  return el;
}

/** svg('path', { d: '...' }) */
export function svg(tag, props = {}, ...children) {
  const el = apply(document.createElementNS(SVG_NS, tag), props);
  el.append(...kids(children));
  return el;
}

/** A sentence from narrate.mjs (strings and { pid } parts) as DOM nodes. */
export function sentenceNodes(parts) {
  return parts.map((p) => (typeof p === 'string' ? document.createTextNode(p) : h('strong', { text: p.pid })));
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** DOM from a node tree ({ t, a, c } with strings as text), as built by the engine view modules. */
export function fromTree(node, inSvg = false) {
  if (typeof node === 'string') return document.createTextNode(node);
  const svgNode = inSvg || node.t === 'svg';
  const el = svgNode ? document.createElementNS(SVG_NS, node.t) : document.createElement(node.t);
  for (const [k, v] of Object.entries(node.a)) el.setAttribute(k, v);
  for (const c of node.c) el.append(fromTree(c, svgNode));
  return el;
}

/** A transient message in the tool's toast element. */
export function createToast(el) {
  let timer = 0;
  return (text, ms = 1800) => {
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), ms);
  };
}

/** The "Copy link" chip: clipboard first, a selectable field when the clipboard is refused. */
export function bindCopy(root, getUrl, toast) {
  const btn = root.querySelector('[data-copy]');
  const fallback = root.querySelector('[data-copy-fallback]');
  const field = root.querySelector('[data-copy-field]');
  btn.addEventListener('click', async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      fallback.hidden = true;
      toast('Link copied');
    } catch {
      field.value = url;
      fallback.hidden = false;
      field.focus();
      field.select();
    }
  });
}

/**
 * Free-text fields show everything typed: CSS field-sizing grows them where supported;
 * elsewhere this sets the height from the content after typing and when the width changes.
 * Returns a function to call after setting the value from script.
 */
export function autoGrow(el) {
  const native = !!(window.CSS && CSS.supports('field-sizing', 'content'));
  const grow = () => {
    if (native) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  if (!native) {
    el.addEventListener('input', grow);
    let lastW = 0;
    new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w === lastW) return;
      lastW = w;
      grow();
    }).observe(el);
  }
  return grow;
}

/** Show or clear a field's error message, keeping aria-invalid and aria-describedby in step. */
export function fieldError(el, errEl, message) {
  const hint = `${el.id}-hint`;
  if (message) {
    errEl.textContent = message;
    errEl.hidden = false;
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', `${hint} ${errEl.id}`);
  } else {
    errEl.hidden = true;
    errEl.textContent = '';
    el.removeAttribute('aria-invalid');
    el.setAttribute('aria-describedby', hint);
  }
}

/** Replace the query string without adding history; quietly does nothing where refused. */
export function replaceQuery(query) {
  try {
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${query}${window.location.hash}`);
  } catch {
    /* some embedded browsers refuse; the copy button still works */
  }
}
