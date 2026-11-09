// Share links for the networking tools. Decoding never throws; unreadable parts fall back
// to the page default with a notice.
//   Subnet calculator: ?ip=192.168.1.130/26
//   VLSM:              ?net=192.168.10.0/24&hosts=Sales 100,Lab 50
//   Practice:          ?q=<seed>&level=1&type=any
//   TCP:               ?s=normal&c=1000&sv=5000&d=0
import { parseCidr } from './ipv4.mjs';
import { parseNeeds } from './vlsm.mjs';
import { TCP_SCENARIOS, parseBounded } from './tcp.mjs';
import { QUESTION_TYPES, LEVELS } from './practice.mjs';

const MAX_QUERY = 2048;

function params(search) {
  const text = typeof search === 'string' ? search : '';
  if (text.length > MAX_QUERY) return { p: null, notice: 'This link is too long to read, so the default example is shown.' };
  try {
    return { p: new URLSearchParams(text.startsWith('?') ? text.slice(1) : text), notice: null };
  } catch {
    return { p: null, notice: 'This link could not be read, so the default example is shown.' };
  }
}
const get = (p, k) => {
  try {
    return p.get(k);
  } catch {
    return null;
  }
};

export const encodeSubnet = (cidr) => `ip=${encodeURIComponent(cidr).replace(/%2F/g, '/')}`;
export function decodeSubnet(search, fallback) {
  const { p, notice } = params(search);
  if (!p) return { cidr: fallback, notices: [notice], found: false };
  const ip = get(p, 'ip');
  if (ip === null) return { cidr: fallback, notices: [], found: false };
  const r = parseCidr(ip);
  if (r.error) return { cidr: fallback, notices: [`The address in this link could not be used: ${r.error}`], found: false };
  return { cidr: ip.trim(), notices: [], found: true };
}

export const encodeVlsm = (net, hostsText) => `net=${encodeURIComponent(net).replace(/%2F/g, '/')}&hosts=${encodeURIComponent(hostsText).replace(/%2C/g, ',').replace(/%20/g, '+')}`;
export function decodeVlsm(search, fallback) {
  const { p, notice } = params(search);
  if (!p) return { ...fallback, notices: [notice], found: false };
  const out = { ...fallback, notices: [], found: false };
  const net = get(p, 'net');
  if (net !== null) {
    const r = parseCidr(net);
    if (r.error) out.notices.push(`The network in this link could not be used: ${r.error}`);
    else Object.assign(out, { net: net.trim(), found: true });
  }
  const hosts = get(p, 'hosts');
  if (hosts !== null) {
    const r = parseNeeds(hosts);
    if (r.error) out.notices.push(`The host counts in this link could not be used: ${r.error}`);
    else Object.assign(out, { hosts: hosts.trim(), found: true });
  }
  return out;
}

export const encodePractice = ({ seed, level, type }) => `q=${seed >>> 0}&level=${level}&type=${type}`;
export function decodePractice(search) {
  const { p } = params(search);
  const out = { seed: null, level: 1, type: 'any', found: false };
  if (!p) return out;
  const q = get(p, 'q');
  if (q !== null && /^\d{1,10}$/.test(q) && Number(q) < 2 ** 32) Object.assign(out, { seed: Number(q), found: true });
  const level = Number(get(p, 'level'));
  if (LEVELS.includes(level)) out.level = level;
  const type = get(p, 'type');
  if (type && (type === 'any' || QUESTION_TYPES.some((t) => t.key === type))) out.type = type;
  return out;
}

export const encodeTcp = ({ scenario, isnClient, isnServer, data }) => `s=${scenario}&c=${isnClient}&sv=${isnServer}&d=${data}`;
export function decodeTcp(search, fallback) {
  const { p, notice } = params(search);
  const out = { input: { ...fallback }, notices: notice ? [notice] : [], found: false };
  if (!p) return out;
  const s = get(p, 's');
  if (s !== null) {
    if (TCP_SCENARIOS.includes(s)) Object.assign(out, { found: true }, { input: { ...out.input, scenario: s } });
    else out.notices.push('The scenario in this link is not known, so the normal one is shown.');
  }
  for (const [k, field, hi, label] of [['c', 'isnClient', 2 ** 32 - 1, 'The client sequence number'], ['sv', 'isnServer', 2 ** 32 - 1, 'The server sequence number'], ['d', 'data', 1460, 'The data size']]) {
    const v = get(p, k);
    if (v === null) continue;
    const r = parseBounded(v, 0, hi, label);
    if (r.error) out.notices.push(`${r.error} The default was used.`);
    else {
      out.input[field] = r.value;
      out.found = true;
    }
  }
  return out;
}
