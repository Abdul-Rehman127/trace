// Build-time values for the networking templates (net-*.html) and the worked examples in
// src/content/networking/*.html. Every number quoted in the copy is computed here.
import { parseCidr, subnetInfo, toDotted } from '../js/engine/networking/ipv4.mjs';
import { planVlsm, parseNeeds } from '../js/engine/networking/vlsm.mjs';
import { simulateTcp, statesAt } from '../js/engine/networking/tcp.mjs';
import { makeQuestion, QUESTION_TYPES, HINTS } from '../js/engine/networking/practice.mjs';
import { subnetRowsTree, subnetNotesTree, binaryTree, vlsmRowsTree, vlsmBarTree, vlsmSummary, narrateTcp, tcpDiagramTree, tcpRowsTree } from '../js/engine/networking/views.mjs';
import { treeToHtml } from '../js/engine/memory/table.mjs';
import { selector, transportHtml } from './parts.mjs';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const html = (nodes) => (Array.isArray(nodes) ? nodes : [nodes]).map(treeToHtml).join('');
const fmt = (n) => n.toLocaleString('en-US');

const NET = '/networking/';
export const NET_LINKS = [
  { alg: 'subnet', label: 'Subnet calculator', path: `${NET}subnet-calculator/` },
  { alg: 'practice', label: 'Practice', path: `${NET}subnetting-practice/` },
  { alg: 'vlsm', label: 'VLSM', path: `${NET}vlsm-calculator/` },
  { alg: 'tcp', label: 'TCP handshake', path: `${NET}tcp-handshake/` },
];

export const NET_DEFAULTS = {
  subnet: '192.168.1.130/26',
  vlsm: { net: '192.168.10.0/24', hosts: 'Sales 100, Office 50, Lab 25, Servers 10, Link 2' },
  tcp: { scenario: 'normal', isnClient: 1000, isnServer: 5000, data: 0 },
  practiceSeed: 20261108,
};

const SUBNET_EXAMPLES = [
  ['192.168.1.130/26', '192.168.1.130/26'],
  ['172.16.5.10/20', '172.16.5.10/20'],
  ['10.0.0.1/8', '10.0.0.1/8'],
  ['Point-to-point /31', '203.0.113.6/31'],
  ['Single host /32', '198.51.100.7/32'],
];
const VLSM_EXAMPLES = [
  ['Five subnets in a /24', '192.168.10.0/24', 'Sales 100, Office 50, Lab 25, Servers 10, Link 2'],
  ['Does not fit', '192.168.20.0/24', 'Campus 200, Guests 100'],
  ['Links and a LAN', '10.20.0.0/22', 'LAN 500, WAN1 2, WAN2 2, WAN3 2'],
];

const COPY_CHIP = `<button type="button" class="chip chip-link" data-copy>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>
              <span>Copy link</span>
            </button>`;
const COPY_FALLBACK = `<div class="copy-fallback" data-copy-fallback hidden>
            <label for="share-url">Copy this link</label>
            <input id="share-url" type="text" readonly data-copy-field>
          </div>`;

const sentencesHtml = (sentences) =>
  sentences.map((parts) => parts.map((p) => (typeof p === 'string' ? esc(p) : `<strong>${esc(p.pid)}</strong>`)).join('')).join(' ');

/** Values for the networking templates. */
export function networkingData(page) {
  const base = { selector: selector({ ...page, algorithm: page.tool }, NET_LINKS), copyChip: COPY_CHIP, copyFallback: COPY_FALLBACK };
  if (page.template === 'net-subnet') {
    const p = parseCidr(NET_DEFAULTS.subnet);
    const info = subnetInfo(p.address, p.prefix);
    return {
      ...base,
      cidr: NET_DEFAULTS.subnet,
      examples: SUBNET_EXAMPLES.map(([label, v]) => `<button type="button" class="chip" data-example="${esc(v)}">${esc(label)}</button>`).join('\n            '),
      rows: html(subnetRowsTree(info)),
      bits: treeToHtml(binaryTree(info)),
      notes: html(subnetNotesTree(info)),
    };
  }
  if (page.template === 'net-vlsm') {
    const p = parseCidr(NET_DEFAULTS.vlsm.net);
    const plan = planVlsm({ address: p.address, prefix: p.prefix }, parseNeeds(NET_DEFAULTS.vlsm.hosts).needs);
    return {
      ...base,
      net: NET_DEFAULTS.vlsm.net,
      hosts: NET_DEFAULTS.vlsm.hosts,
      examples: VLSM_EXAMPLES.map(([label, net, hosts]) => `<button type="button" class="chip" data-net="${esc(net)}" data-hosts="${esc(hosts)}">${esc(label)}</button>`).join('\n            '),
      rows: html(vlsmRowsTree(plan)),
      bar: treeToHtml(vlsmBarTree(plan)),
      summary: vlsmSummary(plan),
    };
  }
  if (page.template === 'net-practice') {
    const q = makeQuestion(NET_DEFAULTS.practiceSeed, 1, 'any');
    return {
      ...base,
      prompt: q.prompt,
      hint: HINTS[q.format],
      types: [['any', 'Any'], ...QUESTION_TYPES.map((t) => [t.key, t.label])]
        .map(([key, label]) => `<button type="button" class="chip" data-type="${key}" aria-pressed="${key === 'any'}">${esc(label)}</button>`)
        .join('\n              '),
    };
  }
  // TCP
  const r = simulateTcp(NET_DEFAULTS.tcp);
  const st = statesAt(r, 0);
  const sizers = [];
  for (const sc of ['normal', 'simultaneous', 'lost']) {
    const x = simulateTcp({ scenario: sc, isnClient: 4294967290, isnServer: 4294967290, data: 1460 });
    for (let t = 0; t <= x.end; t++) sizers.push(sentencesHtml(narrateTcp(x, t)));
  }
  const plain = (s) => s.replace(/<[^>]+>/g, '');
  return {
    ...base,
    transport: transportHtml('time', r.end),
    isnClient: String(NET_DEFAULTS.tcp.isnClient),
    isnServer: String(NET_DEFAULTS.tcp.isnServer),
    data: String(NET_DEFAULTS.tcp.data),
    diagram: treeToHtml(tcpDiagramTree(r, { k: 0 })),
    end: String(r.end),
    whyText: sentencesHtml(narrateTcp(r, 0)),
    whySizers: [...new Set(sizers)].sort((a, b) => plain(b).length - plain(a).length).slice(0, 3).map((t) => `<p>${t}</p>`).join(''),
    clientState: st.client,
    serverState: st.server,
    rows: html(tcpRowsTree(r)),
  };
}

/** Worked-example values for the content pages. */
export function networkingContentData(key) {
  const out = {};
  if (key === 'networking/subnet') {
    const i = (s) => {
      const p = parseCidr(s);
      return subnetInfo(p.address, p.prefix);
    };
    const a = i('192.168.1.130/26');
    Object.assign(out, {
      exNet: toDotted(a.network),
      exBc: toDotted(a.broadcast),
      exFirst: toDotted(a.first),
      exLast: toDotted(a.last),
      exUsable: fmt(a.usable),
      exMask: toDotted(a.mask),
      exWild: toDotted(a.wildcard),
      ex20: `${toDotted(i('172.16.5.10/20').network)} to ${toDotted(i('172.16.5.10/20').broadcast)}`,
      ex20Usable: fmt(i('172.16.5.10/20').usable),
      ex8Usable: fmt(i('10.0.0.0/8').usable),
      example: `<div class="table-scroll net-bits">${treeToHtml(binaryTree(a))}</div>`,
    });
  }
  if (key === 'networking/vlsm') {
    const p = parseCidr('192.168.10.0/24');
    const plan = planVlsm({ address: p.address, prefix: p.prefix }, parseNeeds('100, 50, 25, 10, 2').needs);
    out.example = `<div class="table-scroll"><table class="data net-table"><caption class="sr-only">VLSM plan for 192.168.10.0/24</caption><thead><tr><th scope="col">Subnet</th><th scope="col">Hosts</th><th scope="col">Prefix</th><th scope="col">Network</th><th scope="col">Usable range</th><th scope="col">Broadcast</th><th scope="col">Spare</th></tr></thead><tbody>${html(vlsmRowsTree(plan))}</tbody></table></div>`;
    out.exFree = fmt(plan.free);
    out.exFreeFrom = toDotted(plan.parent.network + plan.used);
  }
  if (key === 'networking/tcp') {
    const r = simulateTcp({ scenario: 'normal', isnClient: 1000, isnServer: 5000, data: 100 });
    out.example = `<div class="table-scroll"><table class="data net-table"><caption class="sr-only">Segments for client ISN 1000, server ISN 5000, 100 bytes of data</caption><thead><tr><th scope="col">Time</th><th scope="col">Direction</th><th scope="col">Flags</th><th scope="col">Seq</th><th scope="col">Ack</th><th scope="col">Data</th><th scope="col">Delivery</th></tr></thead><tbody>${html(tcpRowsTree(r))}</tbody></table></div>`;
    out.exEnd = String(r.end);
  }
  if (key === 'networking/practice') {
    const q = makeQuestion(7, 1, 'broadcast');
    out.exPrompt = q.prompt;
    out.exAnswer = q.answer;
    out.exSteps = `<ol>${q.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`;
  }
  return out;
}

/** Width classes for the VLSM bar: w-1 to w-100 as flex-grow in percent. */
export function networkingUtilityCss() {
  return Array.from({ length: 100 }, (_, i) => `.vb.w-${i + 1}{flex:${i + 1} 1 0}`).join('');
}
