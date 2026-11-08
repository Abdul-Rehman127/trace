// Entry point for every page.
import { initTheme } from './ui/theme.mjs';
import { fillEmails } from './ui/email.mjs';
import { mountTool } from './ui/app.mjs';

initTheme();
fillEmails();
const tool = document.querySelector('[data-tool]');
if (tool) {
  const app = mountTool(tool);
  // Exposed for the end-to-end and frame-time tests only; holds no visitor data.
  window.__trace = app;
}
