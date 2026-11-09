// IPv4 addresses and subnets on unsigned 32-bit integers. Pure, no DOM.
// Rules are fixed in sections/networking/SPEC.md (/31 point-to-point, /32 single host,
// strict parsing: no leading zeros, octets 0 to 255, contiguous masks).

const u32 = (n) => n >>> 0;

/** Mask for a prefix length 0..32. */
export const maskOf = (prefix) => (prefix === 0 ? 0 : u32(0xffffffff << (32 - prefix)));

/** Dotted decimal for an unsigned 32-bit integer. */
export const toDotted = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');

/** Binary octets for an unsigned 32-bit integer, e.g. "11000000.10101000.00000001.10000010". */
export const toBinary = (n) => [24, 16, 8, 0].map((s) => ((n >>> s) & 255).toString(2).padStart(8, '0')).join('.');

/** Parse a dotted IPv4 address. Returns { value, error }. */
export function parseAddress(raw) {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return { value: null, error: 'Enter an IPv4 address, such as 192.168.1.10.' };
  const parts = s.split('.');
  if (parts.length !== 4) return { value: null, error: `"${s}" needs four numbers separated by dots, such as 192.168.1.10.` };
  let value = 0;
  for (const p of parts) {
    if (p === '') return { value: null, error: `"${s}" has an empty part. Each of the four parts is a number from 0 to 255.` };
    if (!/^\d+$/.test(p)) return { value: null, error: `"${p}" is not a number. Each of the four parts is a number from 0 to 255.` };
    if (p.length > 1 && p[0] === '0') return { value: null, error: `"${p}" has a leading zero. Write ${Number(p)} instead; leading zeros are not allowed.` };
    if (p.length > 3 || Number(p) > 255) return { value: null, error: `${p} is larger than 255. Each part of an address is a number from 0 to 255.` };
    value = value * 256 + Number(p);
  }
  return { value: u32(value), error: null };
}

/** Prefix length for a dotted mask, or an error when the ones are not contiguous. */
export function parseMask(raw) {
  const a = parseAddress(raw);
  if (a.error) return { prefix: null, error: a.error.replace('an IPv4 address, such as 192.168.1.10', 'a subnet mask, such as 255.255.255.0') };
  let prefix = 0;
  while (prefix < 32 && (a.value >>> (31 - prefix)) & 1) prefix++;
  if (maskOf(prefix) !== a.value) return { prefix: null, error: `${raw.trim()} is not a valid subnet mask: the ones must all come first, then the zeros.` };
  return { prefix, error: null };
}

/** Parse "/26" or "26" as a prefix length. */
export function parsePrefix(raw) {
  const s = String(raw ?? '').trim().replace(/^\//, '');
  if (!/^\d{1,2}$/.test(s) || Number(s) > 32) return { prefix: null, error: 'The prefix must be a whole number from 0 to 32, such as /24.' };
  return { prefix: Number(s), error: null };
}

/**
 * Parse "a.b.c.d/n", "a.b.c.d/m.m.m.m" or "a.b.c.d m.m.m.m". Returns { address, prefix, error }.
 */
export function parseCidr(raw) {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return { address: null, prefix: null, error: 'Enter an address with a prefix, such as 192.168.1.130/26.' };
  const m = /^([^\s/]+)\s*(?:\/\s*|\s+)([^\s/]+)$/.exec(s);
  if (!m) {
    if (/^[^\s/]+$/.test(s)) return { address: null, prefix: null, error: 'Add a prefix or a mask, such as /24 or 255.255.255.0.' };
    return { address: null, prefix: null, error: 'Write the address, then / and the prefix, such as 192.168.1.130/26.' };
  }
  const a = parseAddress(m[1]);
  if (a.error) return { address: null, prefix: null, error: a.error };
  const p = m[2].includes('.') ? parseMask(m[2]) : parsePrefix(m[2]);
  if (p.error) return { address: null, prefix: null, error: p.error };
  return { address: a.value, prefix: p.prefix, error: null };
}

const RANGES = [
  [0x0a000000, 8, 'private', 'Private address (10.0.0.0/8, RFC 1918): used inside networks, not routed on the public internet.'],
  [0xac100000, 12, 'private', 'Private address (172.16.0.0/12, RFC 1918): used inside networks, not routed on the public internet.'],
  [0xc0a80000, 16, 'private', 'Private address (192.168.0.0/16, RFC 1918): used inside networks, not routed on the public internet.'],
  [0x7f000000, 8, 'loopback', 'Loopback (127.0.0.0/8): traffic to it stays on the same machine.'],
  [0xa9fe0000, 16, 'link-local', 'Link-local (169.254.0.0/16): addresses a device can give itself when no other address is available; not routed.'],
  [0x64400000, 10, 'shared', 'Shared address space (100.64.0.0/10): used between a provider and its customers for carrier-grade NAT.'],
  [0x00000000, 8, 'this-network', '"This network" (0.0.0.0/8): not used as a normal host address.'],
  [0xe0000000, 4, 'multicast', 'Multicast (224.0.0.0/4): addresses for groups of receivers, not single hosts.'],
  [0xf0000000, 4, 'reserved', 'Reserved (240.0.0.0/4): set aside, not used for normal hosts.'],
];

/** The special-range note for an address, or null for an ordinary public address. */
export function rangeNote(address) {
  if (address === 0xffffffff) return { kind: 'broadcast', text: 'Limited broadcast (255.255.255.255): reaches every host on the local network.' };
  for (const [base, prefix, kind, text] of RANGES) if (u32(address & maskOf(prefix)) === base) return { kind, text };
  return null;
}

/** Historical class letter by the first octet. */
export function classOf(address) {
  const first = address >>> 24;
  if (first < 128) return 'A';
  if (first < 192) return 'B';
  if (first < 224) return 'C';
  if (first < 240) return 'D';
  return 'E';
}

/**
 * Everything about one address and prefix.
 * Usable hosts: 2^(32-n) - 2 for n up to 30; /31 has 2 (point-to-point), /32 has 1.
 */
export function subnetInfo(address, prefix) {
  const mask = maskOf(prefix);
  const network = u32(address & mask);
  const wildcard = u32(~mask);
  const broadcast = u32(network | wildcard);
  const total = 2 ** (32 - prefix);
  let usable;
  let first;
  let last;
  if (prefix === 32) {
    usable = 1;
    first = network;
    last = network;
  } else if (prefix === 31) {
    usable = 2;
    first = network;
    last = broadcast;
  } else {
    usable = total - 2;
    first = network + 1;
    last = broadcast - 1;
  }
  return {
    address,
    prefix,
    mask,
    wildcard,
    network,
    broadcast,
    first: u32(first),
    last: u32(last),
    total,
    usable,
    hostBitsSet: address !== network,
    cls: classOf(address),
    range: rangeNote(address),
  };
}

/** Are two addresses in the same subnet for a prefix? */
export const sameSubnet = (a, b, prefix) => u32(a & maskOf(prefix)) === u32(b & maskOf(prefix));

/** Smallest prefix whose block holds at least `addresses` addresses (1..2^32). */
export function prefixForSize(addresses) {
  let p = 32;
  while (p > 0 && 2 ** (32 - p) < addresses) p--;
  return p;
}
