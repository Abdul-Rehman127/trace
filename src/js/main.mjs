// Entry point for every page.
import { initTheme } from './ui/theme.mjs';
import { fillEmails } from './ui/email.mjs';
import { mountTool } from './ui/app.mjs';
import { mountCompare } from './ui/compare.mjs';
import { initHero } from './ui/hero.mjs';
import { mountPaging } from './ui/memory/paging-app.mjs';
import { mountPagingCompare } from './ui/memory/paging-compare.mjs';

initTheme();
fillEmails();
const tool = document.querySelector('[data-tool]');
if (tool) {
  const kind = tool.dataset.tool;
  const app =
    kind === 'paging' ? mountPaging(tool) : kind === 'paging-compare' ? mountPagingCompare(tool) : tool.dataset.alg === 'compare' ? mountCompare(tool) : mountTool(tool);
  // Exposed for the end-to-end and frame-time tests only; holds no visitor data.
  window.__trace = app;
}
const hero = document.querySelector('[data-hero]');
if (hero) initHero(hero);
