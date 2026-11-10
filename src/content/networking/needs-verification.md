## Needs verification (networking section)

Every number on these pages is computed by the engine at build time. Claims backed by tests in `tests/networking.test.mjs`: the brief's golden subnets, /30 /31 /32 /0, the VLSM worked example and "62 hosts fit a /26 exactly; 63 do not", every TCP sequence and acknowledgement number in the example, "the side that closes first ends in TIME_WAIT", and every TCP state change being a legal transition of the standard state machine.

Open (claims about practice and conventions, not checked by code):

1. **"Some systems read 010 as octal (8)"** (subnet calculator rules). True of some address parsers; the page uses it only as the reason for rejecting leading zeros.
2. **/31 "used for a point-to-point link between two routers"** and **"Some designs use /31 for router links; this planner does not"** (subnet calculator, VLSM).
3. **Special ranges**: the private, loopback, link-local, shared (100.64.0.0/10), "this network", multicast and reserved descriptions, and "not routed on the public internet" for private ranges.
4. **"Prefixes (CIDR) replaced" classes** and "the class does not decide the mask" (subnet calculator).
5. **TCP model notes**: "Real systems measure the round trip time to set the timeout and use a longer TIME_WAIT" (TCP page); the TIME_WAIT reason "so that a late or repeated segment cannot be mistaken for part of a new connection" (narration). TIME_WAIT also lets the final ACK be resent if it is lost; the narration names only the first reason.
6. **"A SYN and each FIN use up one sequence number"** (TCP page and narration): standard; listed because it is the claim students most often check.
7. **Lost SYN scenario**: the server has no timer while listening, so only the client retransmits. The page does not say how many times a real client retries.
8. **Practice levels**: "the prefixes that come up most: /8, /16, /24 and /25 to /30" (practice page). A judgement, not measured.
