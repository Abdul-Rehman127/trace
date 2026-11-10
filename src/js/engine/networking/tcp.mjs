// TCP connection setup and teardown on a simplified timeline (sections/networking/SPEC.md):
// every segment takes 1 time unit one way, the retransmission timeout is a fixed 3 units,
// and TIME_WAIT (2 MSL) is a fixed 4 units. States and sequence numbers follow the standard
// state machine. Pure, no DOM.

export const TCP_SCENARIOS = ['normal', 'simultaneous', 'lost'];
export const RTO = 3;
export const TIME_WAIT = 4;
const MOD = 2 ** 32;
const add = (a, b) => (a + b) % MOD;

/**
 * @param {{ scenario: 'normal'|'simultaneous'|'lost', isnClient: number, isnServer: number, data: number }} input
 */
export function simulateTcp({ scenario, isnClient, isnServer, data = 0 }) {
  const segments = [];
  const events = [];
  const states = { client: [{ t: 0, state: 'CLOSED' }], server: [{ t: 0, state: 'LISTEN' }] };
  const setState = (side, t, state, reason) => {
    states[side].push({ t, state });
    events.push({ t, side, reason, state });
  };
  const send = (from, t, flags, seq, ack, len = 0, lost = false) => {
    const seg = { id: segments.length, from, to: from === 'client' ? 'server' : 'client', t, arrive: lost ? null : t + 1, flags, seq, ack, len, lost };
    segments.push(seg);
    return seg;
  };
  const note = (t, side, reason, seg) => events.push({ t, side, reason, seg: seg ? seg.id : null });

  let t = 0;
  // ----- open -----
  if (scenario === 'lost') {
    const lost = send('client', t, ['SYN'], isnClient, null, 0, true);
    setState('client', t, 'SYN_SENT', 'send-syn');
    note(t, 'client', 'lost', lost);
    t += RTO;
    const again = send('client', t, ['SYN'], isnClient, null);
    note(t, 'client', 'retransmit', again);
  } else {
    const syn = send('client', t, ['SYN'], isnClient, null);
    setState('client', t, 'SYN_SENT', 'send-syn');
    note(t, 'client', 'send', syn);
  }
  t += 1;
  setState('server', t, 'SYN_RECEIVED', 'recv-syn');
  const synack = send('server', t, ['SYN', 'ACK'], isnServer, add(isnClient, 1));
  note(t, 'server', 'send-synack', synack);
  t += 1;
  setState('client', t, 'ESTABLISHED', 'recv-synack');
  const ack = send('client', t, ['ACK'], add(isnClient, 1), add(isnServer, 1));
  note(t, 'client', 'send-ack', ack);
  t += 1;
  setState('server', t, 'ESTABLISHED', 'established');

  // ----- optional data, client to server -----
  let clientNext = add(isnClient, 1);
  const serverNext = add(isnServer, 1);
  if (data > 0) {
    const d = send('client', t, ['PSH', 'ACK'], clientNext, serverNext, data);
    note(t, 'client', 'send-data', d);
    clientNext = add(clientNext, data);
    t += 1;
    const a = send('server', t, ['ACK'], serverNext, clientNext);
    note(t, 'server', 'ack-data', a);
    t += 1;
    note(t, 'client', 'data-acked', a);
  }

  // ----- close -----
  if (scenario === 'simultaneous') {
    const fc = send('client', t, ['FIN', 'ACK'], clientNext, serverNext);
    const fs = send('server', t, ['FIN', 'ACK'], serverNext, clientNext);
    setState('client', t, 'FIN_WAIT_1', 'send-fin');
    setState('server', t, 'FIN_WAIT_1', 'simultaneous-fin');
    note(t, 'client', 'send', fc);
    note(t, 'server', 'send', fs);
    t += 1;
    setState('client', t, 'CLOSING', 'recv-fin');
    setState('server', t, 'CLOSING', 'recv-fin');
    const ac = send('client', t, ['ACK'], add(clientNext, 1), add(serverNext, 1));
    const as = send('server', t, ['ACK'], add(serverNext, 1), add(clientNext, 1));
    note(t, 'client', 'ack-fin', ac);
    note(t, 'server', 'ack-fin', as);
    t += 1;
    setState('client', t, 'TIME_WAIT', 'time-wait');
    setState('server', t, 'TIME_WAIT', 'time-wait');
    t += TIME_WAIT;
    setState('client', t, 'CLOSED', 'closed');
    setState('server', t, 'CLOSED', 'closed');
  } else {
    const fin = send('client', t, ['FIN', 'ACK'], clientNext, serverNext);
    setState('client', t, 'FIN_WAIT_1', 'send-fin');
    note(t, 'client', 'send', fin);
    t += 1;
    setState('server', t, 'CLOSE_WAIT', 'recv-fin');
    const a1 = send('server', t, ['ACK'], serverNext, add(clientNext, 1));
    note(t, 'server', 'ack-fin', a1);
    t += 1;
    setState('client', t, 'FIN_WAIT_2', 'fin-acked');
    const sfin = send('server', t, ['FIN', 'ACK'], serverNext, add(clientNext, 1));
    setState('server', t, 'LAST_ACK', 'send-fin');
    note(t, 'server', 'send', sfin);
    t += 1;
    setState('client', t, 'TIME_WAIT', 'recv-fin');
    const last = send('client', t, ['ACK'], add(clientNext, 1), add(serverNext, 1));
    note(t, 'client', 'ack-fin', last);
    t += 1;
    setState('server', t, 'CLOSED', 'closed');
    const done = t - 1 + TIME_WAIT;
    setState('client', done, 'CLOSED', 'closed');
    t = done;
  }

  const wrapped = isnClient + 1 + data + 1 >= MOD || isnServer + 2 >= MOD;
  events.sort((a, b) => a.t - b.t);
  return { scenario, isnClient, isnServer, data, segments, events, states, end: t, wrapped };
}

/** Each side's state at time t. */
export function statesAt(result, t) {
  const at = (side) => {
    let s = result.states[side][0].state;
    for (const x of result.states[side]) if (x.t <= t) s = x.state;
    return s;
  };
  return { client: at('client'), server: at('server') };
}

/** Parse a whole number in [lo, hi] typed by a person. */
export function parseBounded(raw, lo, hi, label) {
  const s = String(raw ?? '').trim();
  if (!/^\d{1,10}$/.test(s) || Number(s) < lo || Number(s) > hi) {
    return { value: null, error: `${label} must be a whole number from ${lo} to ${hi.toLocaleString('en-US')}.` };
  }
  return { value: Number(s), error: null };
}
