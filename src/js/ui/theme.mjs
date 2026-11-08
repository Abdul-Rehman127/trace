// Theme toggle. The choice is stored in localStorage when available; the site works without it.

const KEY = 'trace-theme';
const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');

function stored() {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function store(value) {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
}

export const currentTheme = () => root.dataset.theme || (media.matches ? 'dark' : 'light');

function label(button) {
  button.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

export function setTheme(value) {
  root.dataset.theme = value;
  store(value);
  for (const b of document.querySelectorAll('[data-theme-toggle]')) label(b);
}

export const toggleTheme = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark');

export function initTheme() {
  const saved = stored();
  if (saved) root.dataset.theme = saved;
  for (const button of document.querySelectorAll('[data-theme-toggle]')) {
    label(button);
    button.hidden = false;
    button.addEventListener('click', toggleTheme);
  }
  media.addEventListener('change', () => {
    for (const b of document.querySelectorAll('[data-theme-toggle]')) label(b);
  });
}
