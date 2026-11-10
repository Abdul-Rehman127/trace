// Independent IPv4 oracle for differential tests. Written separately from
// src/js/engine/networking/ipv4.mjs with a different method on purpose: per-octet decimal
// arithmetic with block sizes, and BigInt for counts. No bit operators anywhere.

/** "a.b.c.d" and a prefix to { network, broadcast, first, last, usable, total } as dotted strings and BigInts. */
export function oracleSubnet(dotted, prefix) {
  const oct = dotted.split('.').map(Number);
  const net = [];
  const bc = [];
  for (let i = 0; i < 4; i++) {
    const bitsHere = Math.max(0, Math.min(8, prefix - i * 8)); // network bits in this octet
    const block = 2 ** (8 - bitsHere); // size of one block in this octet
    const start = Math.floor(oct[i] / block) * block;
    net.push(start);
    bc.push(start + block - 1);
  }
  const total = 2n ** BigInt(32 - prefix);
  const toInt = (o) => o.reduce((acc, x) => acc * 256n + BigInt(x), 0n);
  const fromInt = (n) => [3, 2, 1, 0].map((k) => String((n / 256n ** BigInt(k)) % 256n)).join('.');
  const n = toInt(net);
  const b = toInt(bc);
  let usable;
  let first;
  let last;
  if (prefix === 32) [usable, first, last] = [1n, n, n];
  else if (prefix === 31) [usable, first, last] = [2n, n, b];
  else [usable, first, last] = [total - 2n, n + 1n, b - 1n];
  return { network: fromInt(n), broadcast: fromInt(b), first: fromInt(first), last: fromInt(last), usable, total };
}

/** Mask for a prefix as a dotted string, built octet by octet. */
export function oracleMask(prefix) {
  return [0, 1, 2, 3].map((i) => 256 - 2 ** (8 - Math.max(0, Math.min(8, prefix - i * 8)))).join('.');
}
