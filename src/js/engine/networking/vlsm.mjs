// VLSM planner: largest requirement first, each block the smallest power of two that holds
// hosts + 2 addresses (network and broadcast), packed from the start of the parent network.
// Pure, no DOM. Rules in sections/networking/SPEC.md.
import { maskOf, prefixForSize, subnetInfo } from './ipv4.mjs';

export const VLSM_LIMITS = { subnets: 12, hosts: [1, 16777214] };

/**
 * @param {{ address: number, prefix: number }} parent
 * @param {{ name: string, hosts: number }[]} needs  in the order typed
 * @returns {{ parent, subnets: object[], unfit: object|null, used: number, free: number }}
 */
export function planVlsm(parent, needs) {
  const base = subnetInfo(parent.address, parent.prefix);
  const order = needs.map((n, i) => ({ ...n, index: i })).sort((a, b) => b.hosts - a.hosts || a.index - b.index);
  const end = base.network + base.total; // one past the parent's last address
  let next = base.network;
  const subnets = [];
  let unfit = null;
  for (const need of order) {
    const size = 2 ** (32 - prefixForSize(need.hosts + 2));
    const prefix = 32 - Math.log2(size);
    if (prefix < parent.prefix || next + size > end) {
      unfit = { ...need, size, prefix, missing: next + size - end, remaining: end - next };
      break;
    }
    const info = subnetInfo(next >>> 0, prefix);
    subnets.push({ ...need, size, prefix, mask: maskOf(prefix), network: info.network, first: info.first, last: info.last, broadcast: info.broadcast, usable: info.usable, unused: info.usable - need.hosts });
    next += size;
  }
  const used = next - base.network;
  return { parent: base, subnets, unfit, used, free: base.total - used };
}

/** Parse one line or list of host counts: "100, 50, 25" or "Sales 100; Lab 50". */
export function parseNeeds(raw) {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return { needs: null, error: 'Enter at least one host count, such as 100, 50, 25.' };
  const items = s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  if (items.length > VLSM_LIMITS.subnets) return { needs: null, error: `Use at most ${VLSM_LIMITS.subnets} subnets. This list has ${items.length}.` };
  const needs = [];
  for (const [i, item] of items.entries()) {
    const m = /^(?:(.*?)\s+)?(\d+)$/.exec(item);
    if (!m) return { needs: null, error: `"${item}" is not a host count. Write a number, optionally after a name, such as "Sales 100".` };
    const hosts = Number(m[2]);
    const [lo, hi] = VLSM_LIMITS.hosts;
    if (hosts < lo || hosts > hi) return { needs: null, error: `${hosts} hosts is out of range. Use whole numbers from ${lo} to ${hi.toLocaleString('en-US')}.` };
    const name = (m[1] || '').replace(/[:=]$/, '').trim().slice(0, 24) || `Subnet ${String.fromCharCode(65 + i)}`;
    needs.push({ name, hosts });
  }
  return { needs, error: null };
}
