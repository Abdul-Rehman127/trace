// Tool buttons for the home page and the 404 page: an icon tile with a tiny timeline that
// shows what each algorithm does, a title and line of text, and a round arrow button.
// On hover the icon's bars draw in from the left, as if the timeline were playing.
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ESC[c]);

const CPU = '/operating-systems/cpu-scheduling/';
const PR = '/memory/page-replacement/';
const NET = '/networking/';
const LG = '/logic/';
// A small square (one page in one frame) for the memory glyphs.
const sq = (x, y, c) => `<rect class="g f${c}" x="${x}" y="${y}" width="6" height="6" rx="1.5"/>`;

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
  // Memory: frames over time, pages coming in.
  prOverview: [sq(3, 5, 1), sq(10, 5, 1), sq(17, 5, 1), sq(24, 5, 4), sq(10, 14, 2), sq(17, 14, 2), sq(24, 14, 2), sq(17, 23, 3), sq(24, 23, 3)],
  prFifo: [sq(5, 9, 1), sq(13, 9, 2), sq(21, 9, 3), '<path class="gm-stroke" d="M27 23H6M9 20l-3 3 3 3"/>'],
  prLru: [sq(3, 5, 1), sq(3, 14, 2), sq(3, 23, 3), bar(0, 12, 29, 1), bar(1, 12, 21, 2), bar(2, 12, 15, 3)],
  prOpt: [sq(3, 5, 1), sq(3, 14, 2), sq(3, 23, 3), '<path class="gm-dash" d="M12 8h17M12 17h8M12 26h12"/>', '<path class="gm-stroke" d="M25 4l4 4-4 4"/>'],
  // Networking: bits split at the prefix, a practice card, nested blocks, two timelines.
  netSubnet: [bar(0, 2, 18, 1), bar(0, 18, 30, 4), bar(1, 2, 18, 1), bar(2, 2, 30, 3)],
  netPractice: ['<path class="gm-stroke" d="M7 5h18v22H7zM11 11h10M11 16h10M11 21h6"/>'],
  netVlsm: [bar(0, 2, 30, 1), bar(1, 2, 16, 2), bar(1, 16, 23, 3), bar(1, 23, 27, 4), bar(2, 2, 9, 5)],
  netTcp: ['<path class="gm-stroke" d="M8 3v26M24 3v26M8 8l16 5M24 15l-16 5M8 22l16 5"/>'],
  // Logic: a truth table, a gate, a K-map, two equal sides.
  lgTable: [sq(4, 5, 1), sq(13, 5, 3), sq(22, 5, 1), sq(4, 14, 3), sq(13, 14, 1), sq(22, 14, 3), sq(4, 23, 1), sq(13, 23, 1), sq(22, 23, 3)],
  lgCircuit: ['<path class="gm-stroke" d="M3 11h7M3 21h7M10 7h7a9 9 0 0 1 0 18h-7zM26 16h4"/>'],
  lgSimplify: ['<path class="gm-stroke" d="M4 4h24v24H4zM16 4v24M4 16h24"/>', sq(6, 6, 1), sq(20, 6, 1), sq(6, 20, 3), sq(20, 20, 3)],
  lgEquiv: ['<path class="gm-stroke" d="M6 12h20M6 20h20"/>'],
  prClock: ['<circle class="gm-stroke" cx="16" cy="16" r="9"/>', '<path class="gm-stroke" d="M16 16l5-5"/>', sq(13, 1, 1), sq(25, 13, 2), sq(13, 25, 3), sq(1, 13, 4)],
};
const RAILED = new Set(['overview', 'fcfs', 'sjf', 'srtf', 'priority', 'rr', 'prLru']);
// Accent per button: the icon tile is tinted with one process color.
const ACCENT = { overview: 1, fcfs: 1, sjf: 2, srtf: 3, priority: 4, rr: 7, compare: 5, home: 1, prOverview: 3, prFifo: 1, prLru: 2, prOpt: 4, prClock: 7, netSubnet: 1, netPractice: 2, netVlsm: 3, netTcp: 7, lgTable: 4, lgCircuit: 1, lgSimplify: 3, lgEquiv: 2 };

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
  prOverview: { href: PR, glyph: 'prOverview', primary: true, name: 'Page replacement simulator', desc: 'FIFO, LRU, Optimal and Clock in one place, and how they differ' },
  prOverviewShort: { href: PR, glyph: 'prOverview', name: 'Page replacement simulator', desc: 'FIFO, LRU, Optimal and Clock' },
  prFifo: { href: `${PR}fifo/`, glyph: 'prFifo', name: 'FIFO page replacement', desc: 'Evicts the page that has been in memory longest' },
  prLru: { href: `${PR}lru/`, glyph: 'prLru', name: 'LRU page replacement', desc: 'Evicts the page that has gone unused longest' },
  prOpt: { href: `${PR}optimal/`, glyph: 'prOpt', name: 'Optimal page replacement', desc: 'Evicts the page needed furthest in the future' },
  prClock: { href: `${PR}clock/`, glyph: 'prClock', name: 'Clock page replacement', desc: 'Gives pages with their reference bit set a second chance' },
  netSubnet: { href: `${NET}subnet-calculator/`, glyph: 'netSubnet', primary: true, name: 'IPv4 subnet calculator', desc: 'Network, broadcast, host range and mask, with every bit labelled' },
  netPractice: { href: `${NET}subnetting-practice/`, glyph: 'netPractice', name: 'Subnetting practice', desc: 'Generated questions at three levels, with worked steps' },
  netVlsm: { href: `${NET}vlsm-calculator/`, glyph: 'netVlsm', name: 'VLSM subnet planner', desc: 'Fit subnets of different sizes into one network, largest first' },
  netTcp: { href: `${NET}tcp-handshake/`, glyph: 'netTcp', name: 'TCP handshake and teardown', desc: 'SYN, SYN-ACK, ACK and FIN, with every state and sequence number' },
  lgTable: { href: `${LG}truth-table/`, glyph: 'lgTable', primary: true, name: 'Truth table generator', desc: 'Any expression, every row, every subexpression and the canonical forms' },
  lgCircuit: { href: `${LG}circuit/`, glyph: 'lgCircuit', name: 'Logic circuit simulator', desc: 'Draw the gates, switch inputs, watch the change travel' },
  lgSimplify: { href: `${LG}simplifier/`, glyph: 'lgSimplify', name: 'Boolean simplifier', desc: 'Karnaugh map, Quine-McCluskey and every minimal answer' },
  lgEquiv: { href: `${LG}equivalence/`, glyph: 'lgEquiv', name: 'Equivalence checker', desc: 'Two expressions, the same function or the first row that differs' },
  prCompare: { href: `${PR}compare/`, glyph: 'compare', name: 'Compare page replacement algorithms', desc: 'All four on the same pages, and faults with 1 to 8 frames' },
};

/** The sections listed on the home page. Only built sections appear here. */
export const HUB_SECTIONS = [
  {
    id: 'operating-systems',
    title: 'Operating systems',
    text: 'How an operating system shares one CPU between many processes. Enter your own processes, press play, and read the reason for every decision.',
    keys: ['overview', 'fcfs', 'sjf', 'srtf', 'priority', 'rr', 'compare'],
  },
  {
    id: 'memory',
    title: 'Memory',
    text: 'How an operating system chooses which page leaves memory when a new one has to come in. Enter the pages a program asks for, press play, and see every hit, fault and eviction.',
    keys: ['prOverview', 'prFifo', 'prLru', 'prOpt', 'prClock', 'prCompare'],
  },
  {
    id: 'networking',
    title: 'Networking',
    text: 'How addresses are split into networks and hosts, and how two computers open and close a connection. Type an address or press play and see every step.',
    keys: ['netSubnet', 'netPractice', 'netVlsm', 'netTcp'],
  },
  {
    id: 'logic',
    title: 'Logic',
    text: 'How Boolean expressions become truth tables, circuits and their shortest equivalent forms. Type an expression and see every row, gate and step.',
    keys: ['lgTable', 'lgCircuit', 'lgSimplify', 'lgEquiv'],
  },
];

/** The home page section blocks. */
export function hubSectionsHtml() {
  return HUB_SECTIONS.map(
    (sec) => `      <section class="section-block" id="${sec.id}" aria-labelledby="h-${sec.id}">
        <h2 id="h-${sec.id}">${esc(sec.title)}</h2>
        <p>${esc(sec.text)}</p>
        ${toolButtons(sec.keys)}
      </section>`,
  ).join('\n');
}

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
