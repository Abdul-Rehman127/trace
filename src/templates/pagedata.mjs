// Extra build-time values for page templates and content fragments.
import { simulate } from '../js/engine/scheduling.mjs';
import { validateScenario } from '../js/engine/validate.mjs';
import { defaultScenario } from '../js/engine/presets.mjs';
import { workedExampleHtml } from './examples.mjs';
import { miniHtml } from './mini.mjs';
import { toolButtons, hubSectionsHtml } from './toolbuttons.mjs';
import { pagingExampleHtml } from './memory.mjs';
import { simulatePaging, faultRate, faultsByFrames } from '../js/engine/memory/paging.mjs';
import { narratePagingStep, pagingSentenceText } from '../js/engine/memory/narrate.mjs';

const ALGS = ['fcfs', 'sjf', 'srtf', 'priority', 'rr'];
const SUBJECT = {
  overview: 'Mistake on the CPU scheduling page',
  fcfs: 'Mistake on the FCFS page',
  sjf: 'Mistake on the SJF page',
  srtf: 'Mistake on the SRTF page',
  priority: 'Mistake on the Priority scheduling page',
  rr: 'Mistake on the Round Robin page',
  compare: 'Mistake on the compare page',
  'memory/overview': 'Mistake on the page replacement page',
  'memory/fifo': 'Mistake on the FIFO page replacement page',
  'memory/lru': 'Mistake on the LRU page replacement page',
  'memory/opt': 'Mistake on the Optimal page replacement page',
  'memory/clock': 'Mistake on the Clock page replacement page',
  'memory/compare': 'Mistake on the page replacement compare page',
};

// Worked examples for the page replacement pages. Every number the prose quotes is computed here.
const PR_EXAMPLES = {
  fifo: { refs: [1, 3, 0, 3, 5, 6, 3], frames: 3 },
  lru: { refs: [7, 0, 1, 2, 0, 3, 0, 4], frames: 3 },
  opt: { refs: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3], frames: 3 },
  clock: { refs: [1, 2, 3, 4, 1, 2, 5, 1], frames: 3 },
};
const CLASSIC = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
const BELADY = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];

function memoryData(alg) {
  const out = {};
  const faults = (a, refs, frames, newBit = 1) => simulatePaging({ algorithm: a, refs, frames, options: { newBit } }).faults;
  for (const a of ['fifo', 'lru', 'opt', 'clock']) out[`classic_${a}`] = String(faults(a, CLASSIC, 3));
  for (const a of ['fifo', 'lru', 'opt', 'clock']) {
    out[`belady3_${a}`] = String(faults(a, BELADY, 3));
    out[`belady4_${a}`] = String(faults(a, BELADY, 4));
  }
  out.clockBit0 = String(faults('clock', BELADY, 3, 0));
  out.fifoByFrames = faultsByFrames('fifo', BELADY).join(', ');
  if (PR_EXAMPLES[alg]) {
    const { refs, frames } = PR_EXAMPLES[alg];
    const ex = pagingExampleHtml(alg, refs, frames);
    const r = ex.result;
    const rate = faultRate(r.faults, r.references);
    const firstEvict = r.steps.findIndex((s) => s.evicted !== null);
    const firstSecond = r.steps.findIndex((s) => s.reason === 'clock-second-chance');
    Object.assign(out, {
      example: ex.table,
      exRefs: refs.join(', '),
      exFrames: String(frames),
      exFaults: String(r.faults),
      exHits: String(r.hits),
      exRefCount: String(r.references),
      exRate: `${rate.num}/${rate.den}`,
      exPercent: `${rate.percent}%`,
      exEvictStep: String(firstEvict + 1),
      exEvictText: narratePagingStep(r, firstEvict + 1).map(pagingSentenceText).join(' '),
      exSecondText: firstSecond >= 0 ? narratePagingStep(r, firstSecond + 1).map(pagingSentenceText).join(' ') : '',
      exSecondStep: String(firstSecond + 1),
    });
  }
  return out;
}

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
  if (page.key.startsWith('memory/')) Object.assign(data, memoryData(page.key.slice(7)));
  if (page.key === 'home') {
    data.hero = heroHtml();
    data.hubSections = hubSectionsHtml();
  }
  if (page.key === 'notfound') data.toolButtons = toolButtons(['home', 'overviewShort', 'prOverviewShort'], 'notfound-links');
  return data;
}
