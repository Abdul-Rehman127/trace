// Extra build-time values for page templates and content fragments.
import { simulate } from '../js/engine/scheduling.mjs';
import { validateScenario } from '../js/engine/validate.mjs';
import { defaultScenario } from '../js/engine/presets.mjs';
import { workedExampleHtml } from './examples.mjs';
import { miniHtml } from './mini.mjs';

const ALGS = ['fcfs', 'sjf', 'srtf', 'priority', 'rr'];
const SUBJECT = {
  overview: 'Mistake on the CPU scheduling page',
  fcfs: 'Mistake on the FCFS page',
  sjf: 'Mistake on the SJF page',
  srtf: 'Mistake on the SRTF page',
  priority: 'Mistake on the Priority scheduling page',
  rr: 'Mistake on the Round Robin page',
  compare: 'Mistake on the compare page',
};

function heroHtml() {
  const s = validateScenario(defaultScenario('rr')).value;
  const r = simulate(s);
  return miniHtml(s, r, { lanes: true, hero: true, label: 'Round Robin with a 2-unit slice' });
}

export function pageData(page) {
  const data = {
    emailSubject: SUBJECT[page.key] || 'Mistake on Trace',
  };
  if (ALGS.includes(page.key)) data.example = workedExampleHtml(page.key);
  if (page.key === 'home') data.hero = heroHtml();
  return data;
}
