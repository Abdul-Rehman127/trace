# Networking section (SPEC)

Source: `docs/NEXT_SECTIONS_BRIEF.md` section 5.2.

## Pages

| Path | What |
| --- | --- |
| `/networking/subnet-calculator/` | IPv4 address and prefix or mask in, every derived value out, with a labelled binary view |
| `/networking/subnetting-practice/` | Seeded generated questions, check, step-by-step solution |
| `/networking/vlsm-calculator/` | Parent network and host counts in, largest-first allocation out, with an address-space bar |
| `/networking/tcp-handshake/` | Client and server timelines: handshake, optional data, teardown; the shared player, narration and decision log |

No `/networking/` landing page (owner, same as memory). Breadcrumb "Networking" links to `/#networking`.

## IPv4 rules (engine `src/js/engine/networking/ipv4.mjs`, unsigned 32-bit integers)

- Address: four decimal octets 0 to 255 separated by dots. Rejected with a specific message: a leading zero ("010"), an octet above 255, anything not a digit, fewer or more than four octets, an empty octet.
- Prefix: `/n` with n 0 to 32, or a dotted mask, which must be contiguous ones then zeros (else "255.0.255.0 is not a valid subnet mask: the ones must all come first"). Input forms: `192.168.1.130/26`, `192.168.1.130 255.255.255.192`, `192.168.1.130/255.255.255.192`. Spaces around tokens are ignored.
- Host bits set are accepted: the result shows the network the address belongs to and says so.
- Derived: network, broadcast, mask, wildcard (inverse mask), total addresses `2^(32-n)`, usable hosts, first and last usable.
  - n 0 to 30: usable `2^(32-n) - 2`, first = network + 1, last = broadcast - 1.
  - /31: point-to-point link: both addresses usable, 2 hosts, no network or broadcast address in use (stated; the "network" and "broadcast" rows show the two addresses as first and last).
  - /32: a single host: 1 usable, the address itself.
- Class (history only): A 0 to 127, B 128 to 191, C 192 to 223, D 224 to 239 (multicast), E 240 to 255 (reserved). Copy says classes are historical and that prefixes replaced them.
- Special ranges noted: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (private, RFC 1918); 127.0.0.0/8 (loopback); 169.254.0.0/16 (link-local); 100.64.0.0/10 (shared address space for carrier NAT); 0.0.0.0/8 ("this network"); 224.0.0.0/4 (multicast); 240.0.0.0/4 (reserved); 255.255.255.255 (limited broadcast). The note applies to the address entered.
- Binary view: 32 bits in four octets; each bit marked network or host by position (text label row "N" / "H" as well as color), the prefix boundary drawn as a line.

Golden cases (never edit): 192.168.1.130/26: network 192.168.1.128, broadcast 192.168.1.191, 62 usable, first .129, last .190. 172.16.5.10/20: network 172.16.0.0, broadcast 172.16.15.255, 4094 usable. 10.0.0.0/8: 16,777,214 usable. Added: /30 (2 usable), /31 (2, point-to-point), /32 (1), /0 (network 0.0.0.0, broadcast 255.255.255.255, 4,294,967,294 usable), 255.255.255.255/32.

Oracle (`tests/ipv4-oracle.mjs`): strings and BigInt, per-octet arithmetic, no bit operators. Also checked against Node's `node:net` `BlockList` (subnet membership) where it applies, no new dependency.

## Subnetting practice

- Question types: network address, broadcast address, first and last usable host, number of usable hosts, subnet mask for a prefix (and prefix for a mask), same subnet (two hosts, one prefix: yes or no), how many subnets (borrowed bits from a classful or given parent).
- Levels: 1 prefixes on octet boundaries (/8, /16, /24) and /25 to /30; 2 any prefix /16 to /30; 3 any prefix /8 to /30 and masks in dotted form.
- Seeded: `?q=<seed>&level=<1..3>&type=<key or any>`. The same link always gives the same question. "Next question" changes the seed. Seeds are 32-bit, generated with the same mulberry32 PRNG as the tests.
- Check: answers are normalized (spaces, a leading slash for prefixes, "yes"/"no"); a wrong answer shows the expected answer and the full step-by-step solution, a right one shows the steps too.
- No storage: no streak counter. Decision: a streak in localStorage adds state to a privacy-clean tool for little value; skipped and logged.

## VLSM planner

- Input: parent network (address with prefix) and up to 12 required host counts (1 to 16,777,214), optional names. Sorted largest first; equal counts keep input order.
- Each subnet: smallest block with at least `hosts + 2` addresses (network and broadcast reserved; /31 and /32 are not used by the planner, stated). Allocated in order from the parent's network address, each block aligned to its size (guaranteed by largest-first).
- Output per subnet: name, hosts needed, block size, prefix, mask, network, first, last, broadcast, unused hosts in the block. Totals: used and free addresses of the parent. Bar: the parent's address space with each block in proportion, labelled by name in text.
- "Does not fit": if the next block would pass the parent's broadcast, stop and say which requirement did not fit and how many addresses were missing; earlier allocations are still shown.
- Golden VLSM case (by hand): 192.168.10.0/24 with 100, 50, 25, 10, 2 hosts: /25 .0 to .127; /26 .128 to .191; /27 .192 to .223; /28 .224 to .239; /30 .240 to .243; free .244 to .255 (12 addresses).

## TCP handshake and teardown

Model (stated on the page as simplified): one connection, client actively opens, server listening. Time in units; every segment takes 1 unit one way. No congestion control, no windows, no options.

- Open: client SYN (seq = ISN_c), server SYN-ACK (seq = ISN_s, ack = ISN_c + 1), client ACK (seq = ISN_c + 1, ack = ISN_s + 1). States CLOSED, LISTEN, SYN_SENT, SYN_RECEIVED, ESTABLISHED.
- Optional data: the client sends D bytes (0 to 1460) in one segment (PSH, ACK, seq = ISN_c + 1); the server acknowledges (ack = ISN_c + 1 + D).
- Close (client first): FIN from client, ACK from server (client FIN_WAIT_1 to FIN_WAIT_2, server CLOSE_WAIT), server FIN (LAST_ACK), client ACK (TIME_WAIT), server CLOSED; client leaves TIME_WAIT after 2 MSL, shown as a fixed 4 units (simplified).
- Presets: normal; simultaneous close (both FIN at once: FIN_WAIT_1 to CLOSING on both, then TIME_WAIT on both); lost packet (the client's first SYN is lost and the client retransmits it after a fixed timeout of 3 units, labelled simplified). Losing the SYN keeps a single timer in play: the listening server has none yet. Losing the SYN-ACK instead would start timers on both sides, which a fixed-timeout model would show misleadingly.
- ISNs: whole numbers 0 to 4,294,967,295, entered by the user; arithmetic modulo 2^32 (wraps, and the page says so when it does).

Golden: ISN_c 1000, ISN_s 5000, no data: SYN seq 1000; SYN-ACK seq 5000 ack 1001; ACK seq 1001 ack 5001; FIN seq 1001; ACK ack 1002; server FIN seq 5001; final ACK seq 1002 ack 5002. With 100 bytes: data seq 1001 len 100; ACK ack 1101; FIN seq 1101. Wrap: ISN 4294967295 gives ack 0.

Reason codes: send-syn, recv-syn, send-synack, recv-synack, send-ack, established, send-data, ack-data, send-fin, recv-fin, ack-fin, time-wait, closed, lost, retransmit, simultaneous-fin.

## Copy outline

Each page: how it works, generated worked example, rules (the /31 and /32 rules, the simplified TCP model), formulas, limits, exam mistakes, related, "Spotted a mistake?".
