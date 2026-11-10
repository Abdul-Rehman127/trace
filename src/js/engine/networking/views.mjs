// Node trees ({ t, a, c }) and narration for the networking tools, shared by the build
// (first paint, worked examples) and the browser (fromTree). Pure, no DOM.
import { toDotted, toBinary } from './ipv4.mjs';
import { statesAt } from './tcp.mjs';

const N = (t, a, ...c) => ({ t, a: a || {}, c: c.flat().filter((x) => x !== null && x !== undefined && x !== '') });
const SR = (text) => N('span', { class: 'sr-only' }, text);
const fmt = (n) => n.toLocaleString('en-US');

// ---------- subnet calculator ----------

/** Rows of the subnet result list (children of a <dl>). */
export function subnetRowsTree(info) {
  const row = (label, value, note) => N('div', null, N('dt', null, label), N('dd', null, N('span', { class: 'mono' }, value), note ? N('small', null, note) : null));
  const rows = [];
  if (info.prefix === 31) {
    rows.push(row('First address', toDotted(info.network), 'Usable: a /31 is a point-to-point link'));
    rows.push(row('Second address', toDotted(info.broadcast), 'Usable: no broadcast address on a /31'));
  } else if (info.prefix === 32) {
    rows.push(row('Host address', toDotted(info.network), 'A /32 is a single host'));
  } else {
    rows.push(row('Network address', toDotted(info.network)));
    rows.push(row('Broadcast address', toDotted(info.broadcast)));
    rows.push(row('First usable host', toDotted(info.first)));
    rows.push(row('Last usable host', toDotted(info.last)));
  }
  rows.push(row('Usable hosts', fmt(info.usable), `${fmt(info.total)} addresses in the block`));
  rows.push(row('Subnet mask', toDotted(info.mask), `/${info.prefix}`));
  rows.push(row('Wildcard mask', toDotted(info.wildcard)));
  return rows;
}

/** Notes under the results: host bits set, special range, class as history. */
export function subnetNotesTree(info) {
  const notes = [];
  if (info.hostBitsSet && info.prefix < 31) notes.push(N('li', null, `${toDotted(info.address)} has host bits set, so it is a host inside the network ${toDotted(info.network)}/${info.prefix}.`));
  if (info.range) notes.push(N('li', null, info.range.text));
  notes.push(N('li', null, `Class ${info.cls} under the old class system (history only: prefixes replaced classes, so the class does not decide the mask).`));
  return notes;
}

/** The 32 bits in four octets, each marked network or host in text as well as color. */
export function binaryTree(info) {
  const bits = toBinary(info.address).replace(/\./g, '');
  const maskBits = toBinary(info.mask).replace(/\./g, '');
  const head = N('tr', null, N('th', { scope: 'row' }, 'Address'), [0, 1, 2, 3].map((o) => N('td', { class: 'oct' }, ...[0, 1, 2, 3, 4, 5, 6, 7].map((b) => {
    const i = o * 8 + b;
    return N('span', { class: `bit ${i < info.prefix ? 'nb' : 'hb'}${i === info.prefix - 1 ? ' edge' : ''}` }, bits[i]);
  }))));
  const mask = N('tr', null, N('th', { scope: 'row' }, 'Mask'), [0, 1, 2, 3].map((o) => N('td', { class: 'oct' }, ...[0, 1, 2, 3, 4, 5, 6, 7].map((b) => N('span', { class: 'bit' }, maskBits[o * 8 + b])))));
  const kinds = N('tr', { class: 'kinds' }, N('th', { scope: 'row' }, 'Bit is'), [0, 1, 2, 3].map((o) => N('td', { class: 'oct' }, ...[0, 1, 2, 3, 4, 5, 6, 7].map((b) => {
    const i = o * 8 + b;
    return N('span', { class: `bit ${i < info.prefix ? 'nb' : 'hb'}` }, i < info.prefix ? 'N' : 'H');
  }))));
  return N(
    'table',
    { class: 'bits' },
    N('caption', { class: 'sr-only' }, `${toDotted(info.address)} in binary: the first ${info.prefix} bits are the network part (N), the other ${32 - info.prefix} the host part (H).`),
    N('tbody', null, head, mask, kinds),
  );
}

// ---------- VLSM ----------

export function vlsmRowsTree(plan) {
  return plan.subnets.map((s) =>
    N(
      'tr',
      null,
      N('th', { scope: 'row' }, s.name),
      N('td', null, fmt(s.hosts)),
      N('td', null, `/${s.prefix}`),
      N('td', { class: 'mono' }, `${toDotted(s.network)}`),
      N('td', { class: 'mono' }, `${toDotted(s.first)} to ${toDotted(s.last)}`),
      N('td', { class: 'mono' }, toDotted(s.broadcast)),
      N('td', null, fmt(s.unused)),
    ),
  );
}

/** The parent's address space as a bar: one block per subnet in proportion, then free space. */
export function vlsmBarTree(plan) {
  const total = plan.parent.total;
  // Widths in whole percent (classes w-1 to w-100, see networkingUtilityCss); labels hide below 8%.
  const pct = (n) => Math.max(1, Math.round((n / total) * 100));
  const cls = (p) => `w-${p}${p < 8 ? ' narrow' : ''}`;
  const blocks = plan.subnets.map((s, i) => N('div', { class: `vb c${(i % 8) + 1} ${cls(pct(s.size))}` }, N('span', null, s.name)));
  if (plan.free > 0) blocks.push(N('div', { class: `vb free ${cls(pct(plan.free))}` }, N('span', null, 'Free')));
  return N('div', { class: 'vbar', role: 'img', 'aria-label': `Address space of ${toDotted(plan.parent.network)}/${plan.parent.prefix}: ${plan.subnets.map((s) => `${s.name} ${fmt(s.size)} addresses`).join(', ')}${plan.free ? `, ${fmt(plan.free)} free` : ''}.` }, blocks);
}

export function vlsmSummary(plan) {
  const used = `${fmt(plan.used)} of ${fmt(plan.parent.total)} addresses allocated, ${fmt(plan.free)} free.`;
  if (!plan.unfit) return used;
  return `Does not fit: ${plan.unfit.name} needs a block of ${fmt(plan.unfit.size)} addresses (/${plan.unfit.prefix}), but only ${fmt(Math.max(0, plan.unfit.remaining))} are left in ${toDotted(plan.parent.network)}/${plan.parent.prefix}. The subnets above it fit. ${used}`;
}

// ---------- TCP ----------

const FLAG = (s) => s.flags.join(', ');
const numbers = (s) => `seq ${s.seq}${s.ack === null ? '' : `, ack ${s.ack}`}${s.len ? `, ${s.len} bytes` : ''}`;
const side = (x) => (x === 'client' ? 'The client' : 'The server');

/** What happens at time t, as sentences (arrays of strings and { pid } parts). */
export function narrateTcp(r, t) {
  const out = [];
  if (t === 0 && r.scenario !== 'lost') out.push(['The server is listening.']);
  const evs = r.events.filter((e) => e.t === t);
  if (!evs.length) {
    const st = statesAt(r, t);
    if (st.client === 'TIME_WAIT') {
      const who = st.server === 'TIME_WAIT' ? 'Both sides wait' : 'The client waits';
      return [[`${who} in `, { pid: 'TIME_WAIT' }, ' so that a late or repeated segment cannot be mistaken for part of a new connection.']];
    }
    if (st.client === 'SYN_SENT' && r.scenario === 'lost') return [['The client is waiting for an answer to its SYN. Its retransmission timer is running.']];
    return [['Nothing is sent or received at this moment.']];
  }
  for (const e of evs) {
    const s = e.seg !== null && e.seg !== undefined ? r.segments[e.seg] : null;
    switch (e.reason) {
      case 'send-syn':
        out.push([side(e.side), ' sends ', { pid: 'SYN' }, ` with its initial sequence number ${r.isnClient} and moves to `, { pid: 'SYN_SENT' }, '.']);
        break;
      case 'lost':
        out.push(['That SYN is lost on the way, so the server never sees it.']);
        break;
      case 'retransmit':
        out.push([`No answer came within the fixed ${3}-unit timeout, so the client sends the SYN again (${numbers(s)}).`]);
        break;
      case 'recv-syn':
        out.push(['The server receives the SYN and moves to ', { pid: 'SYN_RECEIVED' }, '.']);
        break;
      case 'send-synack':
        out.push(['It answers with ', { pid: 'SYN, ACK' }, `: its own initial sequence number ${s.seq}, and ack ${s.ack}, the client's sequence number plus 1, because a SYN uses up one sequence number.`]);
        break;
      case 'recv-synack':
        out.push(['The client receives the SYN, ACK and moves to ', { pid: 'ESTABLISHED' }, '.']);
        break;
      case 'send-ack':
        out.push(['It sends an ', { pid: 'ACK' }, ` (${numbers(s)}) to acknowledge the server's SYN.`]);
        break;
      case 'established':
        out.push(['The server receives the ACK and moves to ', { pid: 'ESTABLISHED' }, '. The connection is open.']);
        break;
      case 'send-data':
        out.push([side(e.side), ` sends ${s.len} bytes of data (${numbers(s)}).`]);
        break;
      case 'ack-data':
        out.push(['The server acknowledges the data with ack ', { pid: String(s.ack) }, ": the next byte it expects, which is the data's sequence number plus its length."]);
        break;
      case 'data-acked':
        out.push(['The client receives that ACK. All its data has been acknowledged.']);
        break;
      case 'send-fin':
        out.push([side(e.side), ' sends ', { pid: 'FIN' }, ` (${numbers(s ?? r.segments.find((x) => x.t === t && x.from === e.side))}) to close its direction and moves to `, { pid: e.state }, '.']);
        break;
      case 'simultaneous-fin':
        out.push(['At the same moment the server also sends ', { pid: 'FIN' }, ' and moves to ', { pid: 'FIN_WAIT_1' }, '. Both sides are closing at once.']);
        break;
      case 'recv-fin':
        out.push([side(e.side), ' receives a FIN and moves to ', { pid: e.state }, '.']);
        break;
      case 'ack-fin':
        out.push([side(e.side), ' acknowledges that FIN with an ', { pid: 'ACK' }, ` (${numbers(s)}); a FIN, like a SYN, uses up one sequence number.`]);
        break;
      case 'fin-acked':
        out.push(['The client receives the ACK for its FIN and moves to ', { pid: 'FIN_WAIT_2' }, ', waiting for the server to close its side.']);
        break;
      case 'time-wait':
        out.push([side(e.side), ' receives the ACK for its FIN and moves to ', { pid: 'TIME_WAIT' }, '.']);
        break;
      case 'closed':
        out.push([side(e.side), ' moves to ', { pid: 'CLOSED' }, statesAt(r, t - 1)[e.side] === 'TIME_WAIT' ? `: TIME_WAIT is over (a fixed ${4} units here).` : '.']);
        break;
      default:
        break;
    }
  }
  return out;
}

export const tcpSentenceText = (parts) => parts.map((p) => (typeof p === 'string' ? p : p.pid)).join('');

/** The segment list as table rows (time, from, flags, numbers). */
export function tcpRowsTree(r) {
  return r.segments.map((s) =>
    N(
      'tr',
      { 'data-t': String(s.t) },
      N('td', null, String(s.t)),
      N('td', null, s.from === 'client' ? 'Client to server' : 'Server to client'),
      N('td', null, FLAG(s)),
      N('td', { class: 'mono' }, String(s.seq)),
      N('td', { class: 'mono' }, s.ack === null ? '' : String(s.ack)),
      N('td', null, s.len ? String(s.len) : ''),
      N('td', null, s.lost ? 'Lost' : `Arrives at ${s.arrive}`),
    ),
  );
}

const XC = 150;
const XS = 450;
const ROW = 40;
const TOP = 40;

/**
 * The two timelines as an SVG tree: client on the left, server on the right, time going down.
 * Each segment is an arrow from its send time to its arrival; a lost one stops halfway with a cross.
 * Elements carry data-t so the app can hide the ones that have not happened yet.
 */
export function tcpDiagramTree(r, { k } = {}) {
  // With k given, anything that happens after time k starts hidden (class fut), as on first paint.
  const fut = (t) => (k !== undefined && t > k ? ' fut' : '');
  const height = TOP + (r.end + 1) * ROW + 20;
  const y = (t) => TOP + t * ROW;
  const kids = [
    N('text', { x: String(XC), y: '20', class: 'td-h', 'text-anchor': 'middle' }, 'Client'),
    N('text', { x: String(XS), y: '20', class: 'td-h', 'text-anchor': 'middle' }, 'Server'),
    N('line', { x1: String(XC), y1: String(TOP - 8), x2: String(XC), y2: String(height - 10), class: 'td-axis' }),
    N('line', { x1: String(XS), y1: String(TOP - 8), x2: String(XS), y2: String(height - 10), class: 'td-axis' }),
  ];
  for (let t = 0; t <= r.end; t++) kids.push(N('text', { x: '12', y: String(y(t) + 4), class: 'td-t' }, String(t)));
  for (const side of ['client', 'server']) {
    for (const s of r.states[side]) {
      const left = side === 'client';
      kids.push(N('text', { x: String(left ? XC - 12 : XS + 12), y: String(y(s.t) + 4), class: `td-state${fut(s.t)}`, 'text-anchor': left ? 'end' : 'start', 'data-t': String(s.t) }, s.state));
    }
  }
  for (const s of r.segments) {
    const x1 = s.from === 'client' ? XC : XS;
    const x2 = s.from === 'client' ? XS : XC;
    const y1 = y(s.t);
    const tEnd = s.lost ? s.t + 0.5 : s.arrive;
    const xEnd = s.lost ? (x1 + x2) / 2 : x2;
    const label = `${FLAG(s)}  ${numbers(s)}`;
    const midX = (x1 + xEnd) / 2;
    const midY = (y1 + y(tEnd)) / 2 - 6;
    const dir = x2 > x1 ? 1 : -1;
    const g = N(
      'g',
      { class: `td-seg${s.lost ? ' lost' : ''} ${s.from}${fut(s.t)}`, 'data-t': String(s.t) },
      N('line', { x1: String(x1), y1: String(y1), x2: String(xEnd), y2: String(y(tEnd)), class: 'td-arrow' }),
      s.lost
        ? N('path', { d: `M${xEnd - 6} ${y(tEnd) - 6}l12 12M${xEnd + 6} ${y(tEnd) - 6}l-12 12`, class: 'td-x' })
        : N('path', { d: `M${x2} ${y(tEnd)}l${-10 * dir} -7M${x2} ${y(tEnd)}l${-10 * dir} 3`, class: 'td-head' }),
      N('text', { x: String(midX), y: String(midY), class: 'td-label', 'text-anchor': 'middle' }, label),
    );
    kids.push(g);
  }
  return N(
    'svg',
    { class: 'tcp-diagram', viewBox: `0 0 600 ${height}`, width: '600', height: String(height), role: 'img', 'aria-label': 'Client and server timelines; the segment table below lists the same exchange.' },
    N('line', { class: 'td-now', x1: '30', x2: '570', y1: String(TOP), y2: String(TOP), 'data-now': '' }),
    kids,
  );
}

export const TCP_ROW = ROW;
export const TCP_TOP = TOP;
