// Entry point for every page.
import { initTheme } from './ui/theme.mjs';
import { fillEmails } from './ui/email.mjs';
import { mountTool } from './ui/app.mjs';
import { mountCompare } from './ui/compare.mjs';
import { initHero } from './ui/hero.mjs';

initTheme();
fillEmails();
const tool = document.querySelector('[data-tool]');
if (tool) {
  const app = tool.dataset.alg === 'compare' ? mountCompare(tool) : mountTool(tool);
  // Exposed for the end-to-end and frame-time tests only; holds no visitor data.
  window.__trace = app;
}
const hero = document.querySelector('[data-hero]');
if (hero) initHero(hero);
