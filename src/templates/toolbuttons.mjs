// Tool buttons for the home page and the 404 page: an icon tile with a tiny timeline that
// shows what each algorithm does, a title and line of text, and a round arrow button.
// On hover the icon's bars draw in from the left, as if the timeline were playing.
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ESC[c]);

const CPU = '/operating-systems/cpu-scheduling/';

// One bar: lane 0-2 (top to bottom), start and end on a 0-32 axis, process color 1-8.
const bar = (lane, x0, x1, c) => `<rect class="g f${c}" x="${x0}" y="${5 + lane * 9}" width="${x1 - x0}" height="6" rx="2"/>`;
// Faint lane tracks behind the bars, so each icon reads as a small timeline.
// Grouped, so the bars stay rect 1, 2, 3... for the staggered draw-in.
const RAILS = `<g class="rails">${[0, 1, 2].map((l) => `<rect x="2" y="${5 + l * 9}" width="28" height="6" rx="2"/>`).join('')}</g>`;
// One vertical bar for the comparison glyph, bottom-aligned.
const col = (x, h, c) => `<rect class="g gv f${c}" x="${x}" y="${28 - h}" width="5" height="${h}" rx="1.5"/>`;

const GLYPHS = {
  overview: [bar(0, 2, 14, 1), bar(1, 8, 20, 2), bar(2, 15, 30, 3)],
  fcfs: [bar(0, 2, 15, 1), bar(1, 15, 23, 2), bar(2, 23, 30, 3)],
  sjf: [bar(0, 2, 8, 2), bar(1, 8, 15, 3), bar(2, 15, 30, 1)],
  srtf: [bar(0, 2, 9, 1), bar(1, 9, 15, 2), bar(2, 15, 22, 3), bar(0, 22, 30, 1)],
  priority: [bar(0, 2, 13, 4), bar(1, 13, 22, 1), bar(2, 22, 30, 3)],
  rr: [bar(0, 2, 7, 1), bar(1, 7, 12, 2), bar(2, 12, 16, 3), bar(0, 16, 21, 1), bar(1, 21, 25, 2), bar(2, 25, 28, 3), bar(0, 28, 30, 1)],
  compare: ['<path class="gm-line" d="M2 28.5h28"/>', col(4, 15, 1), col(10, 22, 2), col(16, 11, 3), col(22, 18, 4)],
  home: ['<path class="gm-stroke" d="M5 15 16 6l11 9M8.5 13v13h15V13M13.5 26v-7h5v7"/>'],
};
const RAILED = new Set(['overview', 'fcfs', 'sjf', 'srtf', 'priority', 'rr']);
// Accent per button: the icon tile is tinted with one process color.
const ACCENT = { overview: 1, fcfs: 1, sjf: 2, srtf: 3, priority: 4, rr: 7, compare: 5, home: 1 };

const ARROW =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

export const TOOL_BUTTONS = {
  home: { href: '/', glyph: 'home', name: 'Trace home', desc: 'Every simulator in one list' },
  overview: { href: CPU, glyph: 'overview', primary: true, name: 'CPU scheduling simulator', desc: 'All five algorithms in one place, and how to choose between them' },
  overviewShort: { href: CPU, glyph: 'overview', name: 'CPU scheduling simulator', desc: 'FCFS, SJF, SRTF, Priority and Round Robin' },
  fcfs: { href: `${CPU}fcfs/`, glyph: 'fcfs', name: 'First Come First Served', desc: 'Runs processes in the order they arrive' },
  sjf: { href: `${CPU}sjf/`, glyph: 'sjf', name: 'Shortest Job First', desc: 'Picks the shortest waiting job when the CPU frees up' },
  srtf: { href: `${CPU}srtf/`, glyph: 'srtf', name: 'Shortest Remaining Time First', desc: 'Interrupts for any job that would finish sooner' },
  priority: { href: `${CPU}priority/`, glyph: 'priority', name: 'Priority scheduling', desc: 'Runs the most important ready process, with or without interrupting' },
  rr: { href: `${CPU}round-robin/`, glyph: 'rr', name: 'Round Robin', desc: 'Gives each process a fixed slice in turn' },
  compare: { href: `${CPU}compare/`, glyph: 'compare', name: 'Compare scheduling algorithms', desc: 'All five on the same processes, side by side' },
};

function button(t) {
  const rails = RAILED.has(t.glyph) ? RAILS : '';
  return (
    `<li${t.primary ? ' class="tb-li-primary"' : ''}><a class="tb a${ACCENT[t.glyph]}${t.primary ? ' tb-primary' : ''}" href="${esc(t.href)}">` +
    `<span class="tb-ic" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 32 32" focusable="false">${rails}${GLYPHS[t.glyph].join('')}</svg></span>` +
    `<span class="tb-text"><span class="tl-name">${esc(t.name)}</span><span class="tl-desc">${esc(t.desc)}</span></span>` +
    `<span class="tb-go" aria-hidden="true">${ARROW}</span>` +
    `</a></li>`
  );
}

/** A list of tool buttons by key, e.g. toolButtons(['fcfs', 'rr'], 'extra-class'). */
export function toolButtons(keys, extraClass = '') {
  return `<ul class="tool-links${extraClass ? ` ${extraClass}` : ''}">\n${keys.map((k) => `          ${button(TOOL_BUTTONS[k])}`).join('\n')}\n        </ul>`;
}
