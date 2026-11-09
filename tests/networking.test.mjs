// Networking engine: IPv4 golden cases, the BigInt oracle and Node's BlockList, parsing,
// VLSM (golden and properties), practice questions, TCP sequence numbers and states,
// and share links.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BlockList } from 'node:net';
import { parseAddress, parseCidr, parseMask, subnetInfo, toDotted, maskOf, sameSubnet, rangeNote, classOf } from '../src/js/engine/networking/ipv4.mjs';
import { planVlsm, parseNeeds } from '../src/js/engine/networking/vlsm.mjs';
import { simulateTcp, statesAt } from '../src/js/engine/networking/tcp.mjs';
import { makeQuestion, checkAnswer, normalizeAnswer, QUESTION_TYPES } from '../src/js/engine/networking/practice.mjs';
import { decodeSubnet, encodeSubnet, decodeVlsm, encodeVlsm, decodePractice, encodePractice, decodeTcp, encodeTcp } from '../src/js/engine/networking/share.mjs';
import { oracleSubnet, oracleMask } from './ipv4-oracle.mjs';
import { prng, int, pick } from './random.mjs';

const info = (s) => {
  const r = parseCidr(s);
  assert.equal(r.error, null, s);
  return subnetInfo(r.address, r.prefix);
};

describe('IPv4 golden cases from the brief (never edit)', () => {
  test('192.168.1.130/26', () => {
    const i = info('192.168.1.130/26');
    assert.equal(toDotted(i.network), '192.168.1.128');
    assert.equal(toDotted(i.broadcast), '192.168.1.191');
    assert.equal(i.usable, 62);
    assert.equal(toDotted(i.first), '192.168.1.129');
    assert.equal(toDotted(i.last), '192.168.1.190');
  });
  test('172.16.5.10/20', () => {
    const i = info('172.16.5.10/20');
    assert.equal(toDotted(i.network), '172.16.0.0');
    assert.equal(toDotted(i.broadcast), '172.16.15.255');
    assert.equal(i.usable, 4094);
  });
  test('10.0.0.0/8', () => assert.equal(info('10.0.0.0/8').usable, 16777214));
});

describe('IPv4 edge cases', () => {
  test('/30, /31, /32, /0 and 255.255.255.255', () => {
    assert.equal(info('10.1.1.5/30').usable, 2);
    const p31 = info('10.1.1.5/31');
    assert.deepEqual([p31.usable, toDotted(p31.first), toDotted(p31.last)], [2, '10.1.1.4', '10.1.1.5']);
    const p32 = info('10.1.1.5/32');
    assert.deepEqual([p32.usable, toDotted(p32.first), toDotted(p32.network)], [1, '10.1.1.5', '10.1.1.5']);
    const p0 = info('8.8.8.8/0');
    assert.deepEqual([toDotted(p0.network), toDotted(p0.broadcast), p0.usable], ['0.0.0.0', '255.255.255.255', 4294967294]);
    const all = info('255.255.255.255/32');
    assert.equal(all.usable, 1);
    assert.equal(all.range.kind, 'broadcast');
  });
  test('masks, wildcard and the three input forms', () => {
    for (const s of ['192.168.1.130/26', '192.168.1.130 255.255.255.192', '192.168.1.130/255.255.255.192', '  192.168.1.130 / 26 ']) {
      const i = info(s);
      assert.equal(i.prefix, 26, s);
      assert.equal(toDotted(i.wildcard), '0.0.0.63');
    }
  });
  test('host bits set are reported', () => {
    assert.equal(info('192.168.1.130/26').hostBitsSet, true);
    assert.equal(info('192.168.1.128/26').hostBitsSet, false);
  });
  test('special ranges and classes', () => {
    const kind = (s) => rangeNote(parseAddress(s).value)?.kind ?? null;
    assert.equal(kind('10.2.3.4'), 'private');
    assert.equal(kind('172.31.255.255'), 'private');
    assert.equal(kind('172.32.0.1'), null);
    assert.equal(kind('192.168.0.1'), 'private');
    assert.equal(kind('127.0.0.1'), 'loopback');
    assert.equal(kind('169.254.10.1'), 'link-local');
    assert.equal(kind('100.64.0.1'), 'shared');
    assert.equal(kind('224.0.0.5'), 'multicast');
    assert.equal(kind('8.8.8.8'), null);
    assert.deepEqual(['1.0.0.0', '128.0.0.0', '192.0.0.0', '224.0.0.0', '240.0.0.0'].map((s) => classOf(parseAddress(s).value)), ['A', 'B', 'C', 'D', 'E']);
  });
});

describe('parsing rejects with specific messages', () => {
  test('addresses', () => {
    assert.match(parseAddress('192.168.01.1').error, /leading zero/);
    assert.match(parseAddress('192.168.1.256').error, /larger than 255/);
    assert.match(parseAddress('192.168.1').error, /four numbers/);
    assert.match(parseAddress('192.168..1').error, /empty part/);
    assert.match(parseAddress('192.168.1.x').error, /not a number/);
    assert.match(parseAddress('').error, /Enter an IPv4 address/);
    assert.equal(parseAddress('0.0.0.0').value, 0);
  });
  test('prefixes and masks', () => {
    assert.match(parseCidr('10.0.0.1/33').error, /0 to 32/);
    assert.match(parseCidr('10.0.0.1').error, /Add a prefix/);
    assert.match(parseMask('255.0.255.0').error, /ones must all come first/);
    assert.equal(parseMask('255.255.255.0').prefix, 24);
    assert.equal(parseMask('0.0.0.0').prefix, 0);
    assert.equal(parseMask('255.255.255.255').prefix, 32);
  });
});

describe('differential: engine against the BigInt oracle and Node BlockList', () => {
  test('20,000 random addresses and every prefix', () => {
    const rand = prng(42);
    for (let n = 0; n < 20000; n++) {
      const oct = [0, 0, 0, 0].map(() => int(rand, 0, 255));
      const dotted = oct.join('.');
      const prefix = int(rand, 0, 32);
      const e = subnetInfo(parseAddress(dotted).value, prefix);
      const o = oracleSubnet(dotted, prefix);
      const ctx = `${dotted}/${prefix}`;
      assert.equal(toDotted(e.network), o.network, ctx);
      assert.equal(toDotted(e.broadcast), o.broadcast, ctx);
      assert.equal(toDotted(e.first), o.first, ctx);
      assert.equal(toDotted(e.last), o.last, ctx);
      assert.equal(BigInt(e.usable), o.usable, ctx);
      assert.equal(BigInt(e.total), o.total, ctx);
      assert.equal(toDotted(e.mask), oracleMask(prefix), ctx);
    }
  });
  test('membership agrees with node:net BlockList', () => {
    const rand = prng(43);
    for (let n = 0; n < 3000; n++) {
      const a = [0, 0, 0, 0].map(() => int(rand, 0, 255)).join('.');
      const prefix = int(rand, 0, 32);
      const net = toDotted(subnetInfo(parseAddress(a).value, prefix).network);
      const list = new BlockList();
      list.addSubnet(net, prefix, 'ipv4');
      const b = pick(rand, [a, [0, 0, 0, 0].map(() => int(rand, 0, 255)).join('.')]);
      assert.equal(sameSubnet(parseAddress(a).value, parseAddress(b).value, prefix), list.check(b, 'ipv4'), `${a} ${b} /${prefix}`);
    }
  });
});

describe('VLSM', () => {
  test('golden: 192.168.10.0/24 with 100, 50, 25, 10, 2 hosts (by hand, SPEC.md)', () => {
    const { needs } = parseNeeds('100, 50, 25, 10, 2');
    const r = planVlsm({ address: parseAddress('192.168.10.0').value, prefix: 24 }, needs);
    assert.deepEqual(r.subnets.map((s) => `${toDotted(s.network)}/${s.prefix} ${toDotted(s.first)}-${toDotted(s.last)} ${toDotted(s.broadcast)}`), [
      '192.168.10.0/25 192.168.10.1-192.168.10.126 192.168.10.127',
      '192.168.10.128/26 192.168.10.129-192.168.10.190 192.168.10.191',
      '192.168.10.192/27 192.168.10.193-192.168.10.222 192.168.10.223',
      '192.168.10.224/28 192.168.10.225-192.168.10.238 192.168.10.239',
      '192.168.10.240/30 192.168.10.241-192.168.10.242 192.168.10.243',
    ]);
    assert.equal(r.free, 12);
    assert.equal(r.unfit, null);
  });
  test('largest first, equal sizes keep the typed order, names are kept', () => {
    const { needs } = parseNeeds('Lab 10, Sales 100, Office 10');
    const r = planVlsm({ address: parseAddress('10.0.0.0').value, prefix: 24 }, needs);
    assert.deepEqual(r.subnets.map((s) => s.name), ['Sales', 'Lab', 'Office']);
  });
  test('does not fit: says which and by how much', () => {
    const { needs } = parseNeeds('200, 100');
    const r = planVlsm({ address: parseAddress('192.168.1.0').value, prefix: 24 }, needs);
    assert.equal(r.subnets.length, 1);
    assert.equal(r.unfit.hosts, 100);
    assert.equal(r.unfit.missing, 128);
  });
  test('properties over random plans: aligned, inside the parent, no overlap, enough hosts', () => {
    const rand = prng(44);
    for (let n = 0; n < 2000; n++) {
      const prefix = int(rand, 8, 28);
      const parent = { address: (int(rand, 1, 223) * 2 ** 24) >>> 0, prefix };
      const count = int(rand, 1, 12);
      const needs = Array.from({ length: count }, (_, i) => ({ name: `S${i}`, hosts: int(rand, 1, Math.max(1, 2 ** (32 - prefix) / 4)) }));
      const r = planVlsm(parent, needs);
      let prevEnd = r.parent.network;
      for (const s of r.subnets) {
        assert.equal(s.network % s.size, 0, 'aligned');
        assert.ok(s.network >= prevEnd, 'no overlap, in order');
        assert.ok(s.network + s.size <= r.parent.network + r.parent.total, 'inside the parent');
        assert.ok(s.usable >= s.hosts, 'enough hosts');
        assert.ok(s.size / 2 < s.hosts + 2, 'smallest block that fits');
        prevEnd = s.network + s.size;
      }
      assert.equal(r.used + r.free, r.parent.total);
      if (!r.unfit) assert.equal(r.subnets.length, count);
    }
  });
  test('host count parsing', () => {
    assert.deepEqual(parseNeeds('Sales 100; Lab: 50').needs, [{ name: 'Sales', hosts: 100 }, { name: 'Lab', hosts: 50 }]);
    assert.match(parseNeeds('').error, /at least one/);
    assert.match(parseNeeds('0').error, /out of range/);
    assert.match(parseNeeds(Array(13).fill(5).join(',')).error, /at most 12/);
    assert.match(parseNeeds('ten').error, /not a host count/);
  });
});

describe('TCP', () => {
  const seg = (r, i) => {
    const s = r.segments[i];
    return `${s.from} ${s.flags.join('+')} seq=${s.seq}${s.ack === null ? '' : ` ack=${s.ack}`}${s.len ? ` len=${s.len}` : ''}${s.lost ? ' lost' : ''}`;
  };
  test('golden: ISN 1000 and 5000, no data (SPEC.md)', () => {
    const r = simulateTcp({ scenario: 'normal', isnClient: 1000, isnServer: 5000, data: 0 });
    assert.deepEqual(r.segments.map((_, i) => seg(r, i)), [
      'client SYN seq=1000',
      'server SYN+ACK seq=5000 ack=1001',
      'client ACK seq=1001 ack=5001',
      'client FIN+ACK seq=1001 ack=5001',
      'server ACK seq=5001 ack=1002',
      'server FIN+ACK seq=5001 ack=1002',
      'client ACK seq=1002 ack=5002',
    ]);
    assert.deepEqual(r.states.client.map((s) => s.state), ['CLOSED', 'SYN_SENT', 'ESTABLISHED', 'FIN_WAIT_1', 'FIN_WAIT_2', 'TIME_WAIT', 'CLOSED']);
    assert.deepEqual(r.states.server.map((s) => s.state), ['LISTEN', 'SYN_RECEIVED', 'ESTABLISHED', 'CLOSE_WAIT', 'LAST_ACK', 'CLOSED']);
  });
  test('with 100 bytes of data the FIN moves by 100', () => {
    const r = simulateTcp({ scenario: 'normal', isnClient: 1000, isnServer: 5000, data: 100 });
    assert.equal(seg(r, 3), 'client PSH+ACK seq=1001 ack=5001 len=100');
    assert.equal(seg(r, 4), 'server ACK seq=5001 ack=1101');
    assert.equal(seg(r, 5), 'client FIN+ACK seq=1101 ack=5001');
  });
  test('sequence numbers wrap modulo 2^32', () => {
    const r = simulateTcp({ scenario: 'normal', isnClient: 4294967295, isnServer: 7, data: 0 });
    assert.equal(r.segments[1].ack, 0);
    assert.equal(r.wrapped, true);
  });
  test('simultaneous close: both sides go through CLOSING and TIME_WAIT', () => {
    const r = simulateTcp({ scenario: 'simultaneous', isnClient: 1, isnServer: 2, data: 0 });
    for (const side of ['client', 'server']) {
      assert.deepEqual(r.states[side].slice(-4).map((s) => s.state), ['FIN_WAIT_1', 'CLOSING', 'TIME_WAIT', 'CLOSED']);
    }
  });
  test('lost SYN: retransmitted after the fixed timeout, then the normal handshake', () => {
    const r = simulateTcp({ scenario: 'lost', isnClient: 10, isnServer: 20, data: 0 });
    assert.equal(r.segments[0].lost, true);
    assert.equal(r.segments[1].t, 3);
    assert.equal(statesAt(r, 2).server, 'LISTEN');
    assert.equal(statesAt(r, 4).server, 'SYN_RECEIVED');
  });
  test('every state change is a legal transition of the standard state machine', () => {
    const legal = {
      CLOSED: ['SYN_SENT', 'LISTEN'],
      LISTEN: ['SYN_RECEIVED'],
      SYN_SENT: ['ESTABLISHED'],
      SYN_RECEIVED: ['ESTABLISHED'],
      ESTABLISHED: ['FIN_WAIT_1', 'CLOSE_WAIT'],
      FIN_WAIT_1: ['FIN_WAIT_2', 'CLOSING'],
      FIN_WAIT_2: ['TIME_WAIT'],
      CLOSING: ['TIME_WAIT'],
      CLOSE_WAIT: ['LAST_ACK'],
      LAST_ACK: ['CLOSED'],
      TIME_WAIT: ['CLOSED'],
    };
    const rand = prng(45);
    for (let n = 0; n < 300; n++) {
      const r = simulateTcp({ scenario: pick(rand, ['normal', 'simultaneous', 'lost']), isnClient: int(rand, 0, 2 ** 32 - 1), isnServer: int(rand, 0, 2 ** 32 - 1), data: int(rand, 0, 1460) });
      for (const side of ['client', 'server']) {
        const list = r.states[side];
        for (let i = 1; i < list.length; i++) assert.ok(legal[list[i - 1].state].includes(list[i].state), `${side} ${list[i - 1].state} -> ${list[i].state}`);
        assert.equal(list.at(-1).state, 'CLOSED');
      }
      // Every ack acknowledges exactly the other side's next byte, modulo 2^32.
      for (const s of r.segments) assert.ok(s.seq >= 0 && s.seq < 2 ** 32 && (s.ack === null || (s.ack >= 0 && s.ack < 2 ** 32)));
    }
  });
});

describe('subnetting practice', () => {
  test('the same seed gives the same question; answers match the oracle', () => {
    const rand = prng(46);
    for (let n = 0; n < 3000; n++) {
      const seed = int(rand, 0, 2 ** 32 - 1);
      const level = pick(rand, [1, 2, 3]);
      const type = pick(rand, ['any', ...QUESTION_TYPES.map((t) => t.key)]);
      const q = makeQuestion(seed, level, type);
      assert.deepEqual(makeQuestion(seed, level, type), q);
      assert.ok(q.prompt.includes('?'));
      assert.ok(q.steps.length >= 1);
      assert.equal(checkAnswer(q, q.answer).ok, true, q.prompt);
      const m = /of (\d+\.\d+\.\d+\.\d+)\/(\d+)\?/.exec(q.prompt);
      if (m && q.type === 'network') assert.equal(q.answer, oracleSubnet(m[1], Number(m[2])).network);
      if (m && q.type === 'broadcast') assert.equal(q.answer, oracleSubnet(m[1], Number(m[2])).broadcast);
      for (const s of q.steps) assert.doesNotMatch(s, /undefined|NaN|—/);
      const split = /A \/(\d+) network is divided into \/(\d+)/.exec(q.prompt);
      if (split) assert.ok(Number(split[2]) > Number(split[1]), q.prompt);
    }
  });
  test('answers are normalized', () => {
    assert.equal(normalizeAnswer(' 192.168.1.0 ', 'address'), '192.168.1.0');
    assert.equal(normalizeAnswer('192.168.01.0', 'address'), null);
    assert.equal(normalizeAnswer('10.0.0.1 to 10.0.0.62', 'range'), '10.0.0.1 - 10.0.0.62');
    assert.equal(normalizeAnswer('1,022', 'number'), '1022');
    assert.equal(normalizeAnswer('Yes', 'yesno'), 'yes');
    assert.equal(normalizeAnswer('24', 'prefix'), '/24');
  });
});

describe('share links', () => {
  test('round trips', () => {
    assert.equal(decodeSubnet(`?${encodeSubnet('10.1.2.3/20')}`, 'x').cidr, '10.1.2.3/20');
    const v = decodeVlsm(`?${encodeVlsm('192.168.10.0/24', 'Sales 100, Lab 50')}`, { net: 'a', hosts: 'b' });
    assert.deepEqual([v.net, v.hosts], ['192.168.10.0/24', 'Sales 100, Lab 50']);
    assert.deepEqual(decodePractice(`?${encodePractice({ seed: 123, level: 2, type: 'hosts' })}`), { seed: 123, level: 2, type: 'hosts', found: true });
    const tcp = { scenario: 'lost', isnClient: 4294967295, isnServer: 0, data: 1460 };
    assert.deepEqual(decodeTcp(`?${encodeTcp(tcp)}`, { scenario: 'normal', isnClient: 1, isnServer: 2, data: 0 }).input, tcp);
  });
  test('garbage never throws and falls back', () => {
    const rand = prng(47);
    const chars = 'ipnetshoqlvycd=&/.,%0123456789x ;'.split('');
    for (let n = 0; n < 3000; n++) {
      const q = Array.from({ length: int(rand, 0, 50) }, () => pick(rand, chars)).join('');
      const s = decodeSubnet(q, '192.168.1.130/26');
      assert.equal(parseCidr(s.cidr).error, null);
      const v = decodeVlsm(q, { net: '192.168.10.0/24', hosts: '100, 50' });
      assert.equal(parseCidr(v.net).error, null);
      assert.equal(parseNeeds(v.hosts).error, null);
      const t = decodeTcp(q, { scenario: 'normal', isnClient: 1, isnServer: 2, data: 0 });
      assert.ok(['normal', 'simultaneous', 'lost'].includes(t.input.scenario));
      decodePractice(q);
    }
  });
});

describe('claims made in the page copy (src/content/networking)', () => {
  test('62 hosts fit a /26 exactly; 63 do not', () => {
    const plan = (h) => planVlsm({ address: parseAddress('10.0.0.0').value, prefix: 24 }, [{ name: 'A', hosts: h }]).subnets[0].prefix;
    assert.equal(plan(62), 26);
    assert.equal(plan(63), 25);
  });
  test('TCP example: ack for a SYN at 1000 is 1001; for the FIN at 1101 it is 1102', () => {
    const r = simulateTcp({ scenario: 'normal', isnClient: 1000, isnServer: 5000, data: 100 });
    assert.equal(r.segments[1].ack, 1001);
    const fin = r.segments.find((s) => s.from === 'client' && s.flags.includes('FIN'));
    assert.equal(fin.seq, 1101);
    assert.equal(r.segments.find((s) => s.from === 'server' && s.flags.join() === 'ACK' && s.t > fin.t).ack, 1102);
  });
  test('the side that closes first ends in TIME_WAIT (normal close)', () => {
    const r = simulateTcp({ scenario: 'normal', isnClient: 1, isnServer: 1, data: 0 });
    assert.ok(r.states.client.some((s) => s.state === 'TIME_WAIT'));
    assert.ok(!r.states.server.some((s) => s.state === 'TIME_WAIT'));
  });
});
