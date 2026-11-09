// Entry point for every page.
import { initTheme } from './ui/theme.mjs';
import { fillEmails } from './ui/email.mjs';
import { mountTool } from './ui/app.mjs';
import { mountCompare } from './ui/compare.mjs';
import { initHero } from './ui/hero.mjs';
import { mountPaging } from './ui/memory/paging-app.mjs';
import { mountPagingCompare } from './ui/memory/paging-compare.mjs';
import { mountSubnet } from './ui/networking/subnet-app.mjs';
import { mountVlsm } from './ui/networking/vlsm-app.mjs';
import { mountPractice } from './ui/networking/practice-app.mjs';
import { mountTcp } from './ui/networking/tcp-app.mjs';
import { mountLogic } from './ui/logic/logic-app.mjs';
import { mountCircuit } from './ui/logic/circuit-app.mjs';
import { mountTree } from './ui/ai/tree-app.mjs';
import { mountArena } from './ui/ai/arena-app.mjs';
import { mountAiCompare } from './ui/ai/compare-app.mjs';

const MOUNT = {
  paging: mountPaging,
  'paging-compare': mountPagingCompare,
  'net-subnet': mountSubnet,
  'net-vlsm': mountVlsm,
  'net-practice': mountPractice,
  'net-tcp': mountTcp,
  'lg-table': mountLogic,
  'lg-simplify': mountLogic,
  'lg-equiv': mountLogic,
  'lg-circuit': mountCircuit,
  'ai-tree': mountTree,
  'ai-arena': mountArena,
  'ai-compare': mountAiCompare,
};

initTheme();
fillEmails();
const tool = document.querySelector('[data-tool]');
if (tool) {
  const kind = tool.dataset.tool;
  const app = MOUNT[kind] ? MOUNT[kind](tool) : tool.dataset.alg === 'compare' ? mountCompare(tool) : mountTool(tool);
  // Exposed for the end-to-end and frame-time tests only; holds no visitor data.
  window.__trace = app;
}
const hero = document.querySelector('[data-hero]');
if (hero) initHero(hero);
