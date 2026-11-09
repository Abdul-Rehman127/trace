# Networking section: report

Branch `next-2`. Built after the section 1 review fixes; not reviewed yet (the owner reviews sections 2 to 4 together).

## What was built

- **IPv4 subnet calculator** (`/networking/subnet-calculator/`): takes an address with a prefix or a dotted mask, in three input forms.
  - It shows network, broadcast, first and last usable, usable hosts, mask and wildcard.
  - A binary view labels every bit N or H in text as well as by colour.
  - Notes cover host bits being set, special ranges (private RFC 1918, loopback, link-local, shared, multicast, reserved, broadcast) and the class as history.
  - Point-to-point /31 and single-host /32 follow their own rules. Leading zeros are rejected with a specific message.
- **Subnetting practice** (`/networking/subnetting-practice/`): seven question kinds at three levels, generated from a seed in the link. The answer is checked in the browser and the full worked steps are shown. Nothing is stored (no streak counter; logged in DECISIONS.md).
- **VLSM planner** (`/networking/vlsm-calculator/`):
  - Takes a parent network and up to 12 named host counts, and allocates largest first, each subnet getting the smallest block that fits.
  - Shows every range, the spare hosts, and a bar of the address space with a full text label.
  - Says which requirement does not fit and by how much.
- **TCP handshake and teardown** (`/networking/tcp-handshake/`): client and server timelines on the shared player, with narration, decision log and a states panel.
  - Normal open and close, simultaneous close, and lost SYN with retransmission.
  - User initial sequence numbers (with wrap-around modulo 2^32) and optional data.
  - The simplified timing model is stated twice: under the table and in the content.
- **Written content** for each page, generated from the engine: 618, 511, 503 and 632 words.
- **Home hub:** a Networking section with icon buttons. The About page names the section.

## Gates (`npm run verify:full`, all 6 passed, 12.8 min, with Logic built alongside)

| Gate | Result |
| --- | --- |
| Engine tests | 29 networking tests pass, including:<br>- the brief's goldens (192.168.1.130/26, 172.16.5.10/20, 10.0.0.0/8) and /30, /31, /32, /0, 255.255.255.255<br>- 20,000 random address and prefix pairs against a BigInt per-octet oracle, and 3,000 membership checks against `node:net` `BlockList`<br>- the hand-checked VLSM case and VLSM properties over 2,000 random plans<br>- TCP sequence and ack numbers (goldens and wrap) and every state change being a legal transition<br>- practice determinism and answers matching the oracle, and the share-link round trip and fuzzing |
| Content lint | 24 pages clean |
| Contrast | Token tests in both themes (shared) |
| Browser tests | 341 pass across the site in Chromium and WebKit. The networking ones cover:<br>- live updates, positioned errors and share round trips for all four tools<br>- TCP reset, input and scenario changes mid-play, with no stale state<br>- a hidden tab freezing playback<br>- 390 px without sideways scroll, reduced motion, and CLS 0 with fonts blocked |
| Lighthouse mobile | 23 of 23 pages pass. The networking pages score 100 / 100 / 100 / 100 with CLS 0 |
| Frame time | TCP heavy case (lost SYN, 1,460 bytes, 4x speed, 4x CPU throttle, median of 5): p95 16.8 ms, max 16.8 ms |

## Deviations and why

- **Lost-packet preset:** loses the client's SYN, not the SYN-ACK. With a lost SYN-ACK both sides' timers would be running, which a fixed-timeout model would show misleadingly. The SPEC records this.
- **VLSM never allocates /31 or /32,** so every subnet keeps a network and a broadcast address. The page says so.
- **Practice has no streak counter;** see DECISIONS.md.
- **Bug fixed site-wide (found by the layout-shift test):** the transport's clock total was built as 0 and changed width when the script started. It is now rendered from the default run on every simulator page.

## Open questions

- None that block. The TCP model's fixed timings are labelled as simplified; say if you want them adjustable.

## Needs verification

See the end of `sections/networking/content-review.md` (source `src/content/networking/needs-verification.md`): the octal reason for rejecting leading zeros, /31 router-link usage, the special-range descriptions, "CIDR replaced classes", the TCP model notes and the TIME_WAIT reason, and the practice level choices.

## Review material

Screenshots: branch `review-shots`, folder `networking/`. That's 108 JPEGs: 4 pages, light and dark, 1440, 1024 and 390 px, in default, hover, selected and focus states, plus mid-play and end for TCP.
