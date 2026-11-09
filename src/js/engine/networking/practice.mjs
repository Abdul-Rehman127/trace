// Subnetting practice: seeded question generation, answer checking and worked solutions.
// The same seed, level and type always give the same question. Pure, no DOM.
import { prng, randInt } from '../prng.mjs';
import { subnetInfo, toDotted, maskOf, sameSubnet, parseAddress } from './ipv4.mjs';

export const QUESTION_TYPES = [
  { key: 'network', label: 'Network address' },
  { key: 'broadcast', label: 'Broadcast address' },
  { key: 'range', label: 'Usable host range' },
  { key: 'hosts', label: 'Number of hosts' },
  { key: 'mask', label: 'Subnet mask' },
  { key: 'same', label: 'Same subnet?' },
  { key: 'subnets', label: 'How many subnets' },
];
export const LEVELS = [1, 2, 3];

const fmt = (n) => n.toLocaleString('en-US');
const pick = (rand, list) => list[Math.floor(rand() * list.length)];

function prefixFor(rand, level) {
  if (level === 1) return pick(rand, [8, 16, 24, 25, 26, 27, 28, 29, 30]);
  if (level === 2) return randInt(rand, 16, 30);
  return randInt(rand, 8, 30);
}

// Addresses in familiar private ranges at level 1, anywhere ordinary (1 to 223) above.
function addressFor(rand, level) {
  if (level === 1) {
    const base = pick(rand, [[192, 168], [10, randInt(rand, 0, 255)], [172, randInt(rand, 16, 31)]]);
    return ((base[0] * 256 + base[1]) * 65536 + randInt(rand, 0, 255) * 256 + randInt(rand, 1, 254)) >>> 0;
  }
  return ((randInt(rand, 1, 223) * 16777216 + randInt(rand, 0, 255) * 65536 + randInt(rand, 0, 255) * 256 + randInt(rand, 0, 255)) >>> 0);
}

const octets = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255);
const perOctet = (a, b, op) => octets(a).map((x, i) => `${x} ${op} ${octets(b)[i]} = ${op === 'AND' ? x & octets(b)[i] : x | octets(b)[i]}`).join('; ');

/** Steps that apply to most questions: the mask, then the network and broadcast. */
function baseSteps(info) {
  return [
    `/${info.prefix} means ${info.prefix} network bits, so the mask is ${toDotted(info.mask)} and the wildcard (the host bits) is ${toDotted(info.wildcard)}.`,
    `Network = address AND mask, octet by octet: ${perOctet(info.address, info.mask, 'AND')}. So the network is ${toDotted(info.network)}.`,
    `Broadcast = network OR wildcard: ${perOctet(info.network, info.wildcard, 'OR')}. So the broadcast is ${toDotted(info.broadcast)}.`,
  ];
}

function hostsSteps(prefix) {
  const hostBits = 32 - prefix;
  if (prefix === 32) return ['/32 leaves no host bits: the block is one address, a single host.'];
  if (prefix === 31) return ['/31 leaves 1 host bit: 2 addresses. On a point-to-point link both are usable, so there are 2 hosts.'];
  return [`/${prefix} leaves ${hostBits} host bits: 2^${hostBits} = ${fmt(2 ** hostBits)} addresses. Take away the network and broadcast addresses: ${fmt(2 ** hostBits)} - 2 = ${fmt(2 ** hostBits - 2)} usable hosts.`];
}

/**
 * @param {number} seed  32-bit seed
 * @param {1|2|3} level
 * @param {string} type  a QUESTION_TYPES key, or 'any'
 */
export function makeQuestion(seed, level = 1, type = 'any') {
  const rand = prng(seed);
  const kind = type === 'any' ? pick(rand, QUESTION_TYPES).key : type;
  const prefix = prefixFor(rand, level);
  const address = addressFor(rand, level);
  const info = subnetInfo(address, prefix);
  const cidr = `${toDotted(address)}/${prefix}`;
  const q = { seed: seed >>> 0, level, type: kind };

  if (kind === 'network') {
    return { ...q, prompt: `What is the network address of ${cidr}?`, answer: toDotted(info.network), format: 'address', steps: baseSteps(info).slice(0, 2) };
  }
  if (kind === 'broadcast') {
    return { ...q, prompt: `What is the broadcast address of ${cidr}?`, answer: toDotted(info.broadcast), format: 'address', steps: baseSteps(info) };
  }
  if (kind === 'range') {
    return {
      ...q,
      prompt: `What is the usable host range of ${cidr}? Give the first and last usable address.`,
      answer: `${toDotted(info.first)} - ${toDotted(info.last)}`,
      format: 'range',
      steps: [...baseSteps(info), `The first usable host is one after the network (${toDotted(info.first)}) and the last is one before the broadcast (${toDotted(info.last)}).`],
    };
  }
  if (kind === 'hosts') {
    return { ...q, prompt: `How many usable host addresses does a /${prefix} network have?`, answer: String(info.usable), format: 'number', steps: hostsSteps(prefix) };
  }
  if (kind === 'mask') {
    const reverse = level === 3 && rand() < 0.5;
    const mask = toDotted(maskOf(prefix));
    const bin = octets(maskOf(prefix)).map((o) => o.toString(2).padStart(8, '0')).join('.');
    return reverse
      ? { ...q, prompt: `Which prefix length matches the subnet mask ${mask}?`, answer: `/${prefix}`, format: 'prefix', steps: [`In binary the mask is ${bin}.`, `Count the ones: ${prefix}. So the prefix is /${prefix}.`] }
      : { ...q, prompt: `What is the subnet mask for /${prefix}?`, answer: mask, format: 'address', steps: [`/${prefix} means the first ${prefix} bits are ones: ${bin}.`, `Each group of 8 bits as a number: ${mask}.`] };
  }
  if (kind === 'same') {
    // Half the time the second host is in the same block, otherwise in a neighbouring one.
    const size = 2 ** (32 - prefix);
    const offset = rand() < 0.5 ? randInt(rand, 0, size - 1) : size + randInt(rand, 0, Math.min(size - 1, 255));
    const other = (info.network + offset) >>> 0;
    const same = sameSubnet(address, other, prefix);
    const otherNet = subnetInfo(other, prefix).network;
    return {
      ...q,
      prompt: `With a /${prefix} prefix, are ${toDotted(address)} and ${toDotted(other)} in the same subnet?`,
      answer: same ? 'yes' : 'no',
      format: 'yesno',
      steps: [
        `The mask for /${prefix} is ${toDotted(info.mask)}.`,
        `${toDotted(address)} AND mask = ${toDotted(info.network)}.`,
        `${toDotted(other)} AND mask = ${toDotted(otherNet)}.`,
        same ? 'The network addresses match, so they are in the same subnet.' : 'The network addresses differ, so they are in different subnets.',
      ],
    };
  }
  // subnets: split a parent prefix into equal smaller subnets.
  // Parent first, then the borrowed bits, so the subnets are always smaller than the parent.
  const parent = randInt(rand, level === 1 ? 16 : 8, 28);
  const borrowed = randInt(rand, 1, Math.min(level === 1 ? 4 : 8, 30 - parent));
  const child = parent + borrowed;
  return {
    ...q,
    prompt: `A /${parent} network is divided into /${child} subnets of equal size. How many subnets are there?`,
    answer: String(2 ** borrowed),
    format: 'number',
    steps: [`Going from /${parent} to /${child} borrows ${child} - ${parent} = ${borrowed} bits for the subnet number.`, `${borrowed} bits give 2^${borrowed} = ${fmt(2 ** borrowed)} subnets.`],
  };
}

/** Normalize an answer for comparison; returns null when it cannot be read. */
export function normalizeAnswer(raw, format) {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return null;
  if (format === 'number') return /^\d[\d,\s]*$/.test(s) ? String(Number(s.replace(/[,\s]/g, ''))) : null;
  if (format === 'yesno') return /^(y|yes|same)$/.test(s) ? 'yes' : /^(n|no|different)$/.test(s) ? 'no' : null;
  if (format === 'prefix') return /^\/?\s*\d{1,2}$/.test(s) ? `/${Number(s.replace(/[/\s]/g, ''))}` : null;
  if (format === 'address') {
    const a = parseAddress(s);
    return a.error ? null : toDotted(a.value);
  }
  // range: two addresses separated by "-", "to", "," or spaces
  const parts = s.split(/\s*(?:-|to|,|\s)\s*/).filter(Boolean);
  if (parts.length !== 2) return null;
  const [a, b] = parts.map(parseAddress);
  return a.error || b.error ? null : `${toDotted(a.value)} - ${toDotted(b.value)}`;
}

/** Check an answer: { ok, readable, expected }. */
export function checkAnswer(question, raw) {
  const got = normalizeAnswer(raw, question.format);
  return { ok: got !== null && got === question.answer, readable: got !== null, expected: question.answer };
}

export const HINTS = {
  address: 'Write an address such as 192.168.1.0.',
  range: 'Write two addresses, such as 10.0.0.1 - 10.0.0.62.',
  number: 'Write a whole number.',
  yesno: 'Write yes or no.',
  prefix: 'Write a prefix such as /24.',
};
