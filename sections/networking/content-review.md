# Trace: content review, networking section

Generated from the built pages by scripts/section-review.mjs. Interactive parts are replaced by a note; their interface copy is listed once at the end. Word counts cover the written content under the tool.

---

## Page: /networking/subnet-calculator/

- Title: IPv4 Subnet Calculator with Binary View | Trace
- Description (144 characters): Enter an IPv4 address with a prefix or mask and see the network, broadcast, usable host range and mask, with every bit labelled in binary. Free.
- Written content: 618 words

### H1: IPv4 subnet calculator

Enter an address with a prefix or a mask. Every value updates as you type, and the binary view shows which bits are network and which are host.

[Subnet calculator](/networking/subnet-calculator/) / [Practice](/networking/subnetting-practice/) / [VLSM](/networking/vlsm-calculator/) / [TCP handshake](/networking/tcp-handshake/)

#### Address

IPv4 address with prefix or maskFor example 192.168.1.130/26 or 192.168.1.130 255.255.255.192
192.168.1.130/26

192.168.1.130/26
172.16.5.10/20
10.0.0.1/8
Point-to-point /31
Single host /32

Copy link

Copy this link

#### Subnet

Network address192.168.1.128Broadcast address192.168.1.191First usable host192.168.1.129Last usable host192.168.1.190Usable hosts6264 addresses in the blockSubnet mask255.255.255.192/26Wildcard mask0.0.0.63

#### In binary

| Address | 11000000 | 10101000 | 00000001 | 10000010 |
| Mask | 11111111 | 11111111 | 11111111 | 11000000 |
| Bit is | NNNNNNNN | NNNNNNNN | NNNNNNNN | NNHHHHHH |

- 192.168.1.130 has host bits set, so it is a host inside the network 192.168.1.128/26.
- Private address (192.168.0.0/16, RFC 1918): used inside networks, not routed on the public internet.
- Class C under the old class system (history only: prefixes replaced classes, so the class does not decide the mask).

#### How subnetting an IPv4 address works

An IPv4 address is 32 bits, written as four numbers from 0 to 255. A prefix such as /26 splits those bits in two: the first 26 bits name the network, the remaining 6 name a host inside it. Every device on the same network shares the network bits. The subnet mask is the same split written as an address: 26 ones followed by 6 zeros, which is 255.255.255.192.

Two addresses in every block are special. The **network address** has all host bits set to 0 and names the block itself. The **broadcast address** has all host bits set to 1 and reaches every host in the block. Everything between them is a usable host address. The calculator above works this out as you type, and the binary view marks each bit as N (network) or H (host).

#### Worked example

Take 192.168.1.130/26. The mask is 255.255.255.192, so the last octet has 2 network bits and 6 host bits:

| Address | 11000000 | 10101000 | 00000001 | 10000010 |
| Mask | 11111111 | 11111111 | 11111111 | 11000000 |
| Bit is | NNNNNNNN | NNNNNNNN | NNNNNNNN | NNHHHHHH |

Setting the 6 host bits to 0 gives the network address 192.168.1.128. Setting them to 1 gives the broadcast address 192.168.1.191. The usable hosts run from 192.168.1.129 to 192.168.1.190: 62 addresses. The wildcard mask, the inverse of the subnet mask, is 0.0.0.63.

The same method works on any octet. For 172.16.5.10/20 the boundary falls inside the third octet, so the block runs from 172.16.0.0 to 172.16.15.255, with 4,094 usable hosts. A /8 such as 10.0.0.0/8 has 16,777,214.

#### Rules this calculator uses

- **/31:** a block of two addresses used for a point-to-point link between two routers. Both addresses are usable hosts; there is no network or broadcast address in use.

- **/32:** a single host. The block is one address.

- **Host bits set:** 192.168.1.130/26 has host bits set (130 is not the start of a block). That is accepted: the calculator shows the network the address belongs to and says so.

- **Strict input:** each part must be 0 to 255, without leading zeros. Some systems read "010" as octal (8), so Trace rejects it instead of guessing.

- **Classes are history:** class A, B and C told you the mask from the first octet. Prefixes (CIDR) replaced that, so the class is shown only as a note.

#### Formulas

- Addresses in a block `= 2^(32 - prefix)`

- Usable hosts `= 2^(32 - prefix) - 2` for prefixes up to /30; 2 for /31; 1 for /32

- Network `= address AND mask`; broadcast `= network OR wildcard`

- Wildcard `= 255.255.255.255 - mask`, octet by octet

#### Special ranges

Some addresses are set aside. 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16 are private (RFC 1918): used inside home and office networks and not routed on the public internet. 127.0.0.0/8 is loopback, and 169.254.0.0/16 is link-local, the range a device can give itself when nothing else assigns an address. The calculator notes these when the address you enter falls in one.

#### Common exam mistakes

- **Forgetting the two reserved addresses.** A /26 has 64 addresses but 62 usable hosts.

- **Using the wrong octet.** For a /20 the interesting octet is the third, not the fourth.

- **Treating the given address as the network.** 192.168.1.130/26 belongs to 192.168.1.128/26.

- **Applying "minus 2" to /31 and /32.** Those two follow their own rules above.

#### Related

- [Subnetting practice](/networking/subnetting-practice/), generated questions with worked steps

- [VLSM subnet planner](/networking/vlsm-calculator/), for subnets of different sizes

- [TCP handshake and teardown](/networking/tcp-handshake/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the address you entered, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /networking/subnetting-practice/

- Title: Subnetting Practice Questions with Solutions | Trace
- Description (149 characters): Generated subnetting questions at three levels: network, broadcast, host range, masks and more. Check your answer and see the steps. Free, no signup.
- Written content: 511 words

### H1: Subnetting practice

Answer a generated question, check it, and read the worked steps. Every question has its own link, so you can share the exact one.

[Subnet calculator](/networking/subnet-calculator/) / [Practice](/networking/subnetting-practice/) / [VLSM](/networking/vlsm-calculator/) / [TCP handshake](/networking/tcp-handshake/)

#### Questions

LevelLevel 1 uses familiar prefixes; level 3 uses any prefix and dotted masks
Level 1 / Level 2 / Level 3

Kind of question
Any
Network address
Broadcast address
Usable host range
Number of hosts
Subnet mask
Same subnet?
How many subnets

Copy link

Copy this link

#### Question

What is the usable host range of 10.202.164.136/30? Give the first and last usable address.

Your answer

Write two addresses, such as 10.0.0.1 - 10.0.0.62.

Check
Show the solution
Next question

#### How the practice questions work

Each question is generated from a number called a seed. The same seed, level and kind of question always give the same question, so the link in the address bar points at exactly the question on screen. "Next question" picks a new seed. Nothing is stored and nothing is sent anywhere: the answer is checked in your browser.

Level 1 uses familiar private addresses and the prefixes that come up most: /8, /16, /24 and /25 to /30. Level 2 uses any prefix from /16 to /30. Level 3 uses any prefix from /8 to /30, any ordinary address, and sometimes asks you to turn a dotted mask back into a prefix.

#### Worked example

"What is the broadcast address of 172.31.133.104/8?" The answer is 172.255.255.255, and these are the steps Trace shows after you check:

- /8 means 8 network bits, so the mask is 255.0.0.0 and the wildcard (the host bits) is 0.255.255.255.
- Network = address AND mask, octet by octet: 172 AND 255 = 172; 31 AND 0 = 0; 133 AND 0 = 0; 104 AND 0 = 0. So the network is 172.0.0.0.
- Broadcast = network OR wildcard: 172 OR 0 = 172; 0 OR 255 = 255; 0 OR 255 = 255; 0 OR 255 = 255. So the broadcast is 172.255.255.255.

#### The kinds of question

- **Network and broadcast address:** AND the address with the mask; then OR the network with the wildcard.

- **Usable host range:** one after the network to one before the broadcast. Answer with two addresses, such as 10.0.0.1 - 10.0.0.62.

- **Number of hosts:** 2 to the power of the host bits, minus 2.

- **Subnet mask:** the prefix as ones followed by zeros, written as four numbers; or the other way round.

- **Same subnet:** two addresses are in the same subnet when their network addresses match. Answer yes or no.

- **How many subnets:** borrowing bits from the host part gives 2 to the power of the borrowed bits.

#### Formulas

- Usable hosts `= 2^(32 - prefix) - 2`

- Subnets from borrowing `= 2^(new prefix - old prefix)`

- Network `= address AND mask`; broadcast `= network OR wildcard`

#### How answers are read

Spaces are ignored. Addresses must be four numbers from 0 to 255 without leading zeros. Prefixes can be written with or without the slash. Host counts can include commas, such as 1,022. If an answer cannot be read, the message says what form is expected instead of marking it wrong.

#### Common exam mistakes

- **Off by one in the range.** The first usable host is network plus one, not the network itself.

- **Counting subnets from the wrong prefix.** Borrowed bits are new prefix minus old prefix.

- **Mixing up mask and wildcard.** The wildcard is the mask with every bit flipped.

#### Related

- [IPv4 subnet calculator](/networking/subnet-calculator/), to check any answer bit by bit

- [VLSM subnet planner](/networking/vlsm-calculator/)

#### Spotted a mistake?

If a question or a step looks wrong, please say so. Paste the link from "Copy link", which points at the exact question.

Email: abdul at abmans dot com

---

## Page: /networking/vlsm-calculator/

- Title: VLSM Calculator and Subnet Planner | Trace
- Description (151 characters): Enter a network and the hosts each subnet needs. The planner allocates largest first, shows every range and spare space, and says when it will not fit.
- Written content: 503 words

### H1: VLSM subnet planner

Enter a network and how many hosts each subnet needs. The plan gives each one the smallest block that fits, largest first.

[Subnet calculator](/networking/subnet-calculator/) / [Practice](/networking/subnetting-practice/) / [VLSM](/networking/vlsm-calculator/) / [TCP handshake](/networking/tcp-handshake/)

#### Requirements

Network to divideAddress with prefix, for example 192.168.10.0/24
192.168.10.0/24

Hosts needed per subnetSeparated by commas, optionally named: Sales 100, Lab 50. Up to 12.
Sales 100, Office 50, Lab 25, Servers 10, Link 2

Five subnets in a /24
Does not fit
Links and a LAN

Copy link

Copy this link

#### Plan, largest first

| Subnet | Hosts | Prefix | Network | Usable range | Broadcast | Spare |

| Sales | 100 | /25 | 192.168.10.0 | 192.168.10.1 to 192.168.10.126 | 192.168.10.127 | 26 |
| Office | 50 | /26 | 192.168.10.128 | 192.168.10.129 to 192.168.10.190 | 192.168.10.191 | 12 |
| Lab | 25 | /27 | 192.168.10.192 | 192.168.10.193 to 192.168.10.222 | 192.168.10.223 | 5 |
| Servers | 10 | /28 | 192.168.10.224 | 192.168.10.225 to 192.168.10.238 | 192.168.10.239 | 4 |
| Link | 2 | /30 | 192.168.10.240 | 192.168.10.241 to 192.168.10.242 | 192.168.10.243 | 0 |

SalesOfficeLabServersLinkFree

244 of 256 addresses allocated, 12 free.

#### How VLSM works

Variable Length Subnet Masking (VLSM) divides one network into subnets of different sizes, so each part of a network gets roughly what it needs instead of every subnet being as large as the biggest. A department of 100 hosts needs a /25; a link between two routers needs only a /30.

The planner above follows the usual method. It sorts the requirements from largest to smallest, gives each one the smallest block that holds its hosts plus the two reserved addresses (network and broadcast), and places the blocks one after another from the start of the network. Going largest first keeps every block aligned to its own size, so no space is wasted between blocks and every block starts on a valid boundary.

#### Worked example

Divide 192.168.10.0/24 into subnets for 100, 50, 25, 10 and 2 hosts:

| Subnet | Hosts | Prefix | Network | Usable range | Broadcast | Spare |
| Subnet A | 100 | /25 | 192.168.10.0 | 192.168.10.1 to 192.168.10.126 | 192.168.10.127 | 26 |
| Subnet B | 50 | /26 | 192.168.10.128 | 192.168.10.129 to 192.168.10.190 | 192.168.10.191 | 12 |
| Subnet C | 25 | /27 | 192.168.10.192 | 192.168.10.193 to 192.168.10.222 | 192.168.10.223 | 5 |
| Subnet D | 10 | /28 | 192.168.10.224 | 192.168.10.225 to 192.168.10.238 | 192.168.10.239 | 4 |
| Subnet E | 2 | /30 | 192.168.10.240 | 192.168.10.241 to 192.168.10.242 | 192.168.10.243 | 0 |

100 hosts need 102 addresses, so the smallest block is 128 (/25). 50 hosts need 52 addresses, so 64 (/26). 25 need 27, so 32 (/27). 10 need 12, so 16 (/28). 2 need 4, so 4 (/30). The blocks fill the network in that order and 12 addresses are left, starting at 192.168.10.244.

#### Rules this planner uses

- Each subnet needs `hosts + 2` addresses; the block is the next power of two.

- Largest first; requirements of the same size keep the order you typed them in.

- Blocks are placed from the start of the network with no gaps.

- /31 and /32 are not used, even for a two-host link, so every subnet keeps a network and a broadcast address. Some designs use /31 for router links; this planner does not.

- If a block does not fit in what is left, the planner says which requirement failed and how many addresses were missing; the subnets that did fit are still shown.

#### Formulas

- Block size `= smallest power of 2 at least hosts + 2`

- Prefix `= 32 - log2(block size)`

- Spare hosts in a block `= block size - 2 - hosts needed`

#### Common exam mistakes

- **Forgetting the two reserved addresses.** 62 hosts fit a /26 exactly; 63 do not.

- **Allocating in the order given.** Placing a small subnet first can push a large one onto a boundary it cannot start on.

- **Overlapping ranges.** Each block starts right after the previous block's broadcast address.

#### Related

- [IPv4 subnet calculator](/networking/subnet-calculator/), to look at any one block bit by bit

- [Subnetting practice](/networking/subnetting-practice/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Paste the link from "Copy link", which includes your network and host counts.

Email: abdul at abmans dot com

---

## Page: /networking/tcp-handshake/

- Title: TCP Three-Way Handshake and Teardown Simulator | Trace
- Description (140 characters): Watch a TCP connection open and close step by step: SYN, SYN-ACK, ACK, FIN, every state, and the sequence and acknowledgement numbers. Free.
- Written content: 632 words

### H1: TCP handshake and teardown

Press play and watch a connection open, carry data and close, with the state of each side and every sequence number explained.

[Subnet calculator](/networking/subnet-calculator/) / [Practice](/networking/subnetting-practice/) / [VLSM](/networking/vlsm-calculator/) / [TCP handshake](/networking/tcp-handshake/)

#### Connection

Client initial sequence number0 to 4,294,967,295

Server initial sequence number0 to 4,294,967,295

Data the client sendsBytes, 0 to 1,460 (0 for none)

Normal open and close
Simultaneous close
Lost SYN

Copy link

Copy this link

0.5x
1x
2x
4x

1x
time0of 10

Why this happened

The server is listening. The client sends **SYN** with its initial sequence number 1000 and moves to **SYN_SENT**.

The client receives a FIN and moves to **CLOSING**. The server receives a FIN and moves to **CLOSING**. The client acknowledges that FIN with an **ACK** (seq 1456, ack 4294967292); a FIN, like a SYN, uses up one sequence number. The server acknowledges that FIN with an **ACK** (seq 4294967292, ack 1456); a FIN, like a SYN, uses up one sequence number.

The client receives that ACK. All its data has been acknowledged. The client sends **FIN** (seq 1455, ack 4294967291) to close its direction and moves to **FIN_WAIT_1**. At the same moment the server also sends **FIN** and moves to **FIN_WAIT_1**. Both sides are closing at once.

The server receives the SYN and moves to **SYN_RECEIVED**. It answers with **SYN, ACK**: its own initial sequence number 4294967290, and ack 4294967291, the client's sequence number plus 1, because a SYN uses up one sequence number.

States now
ClientSYN_SENTServerLISTEN

Decision log

One line per moment. Choose a line to move there.

#### Segments

| Time | Direction | Flags | Seq | Ack | Data | Delivery |

| 0 | Client to server | SYN | 1000 | | | Arrives at 1 |
| 1 | Server to client | SYN, ACK | 5000 | 1001 | | Arrives at 2 |
| 2 | Client to server | ACK | 1001 | 5001 | | Arrives at 3 |
| 3 | Client to server | FIN, ACK | 1001 | 5001 | | Arrives at 4 |
| 4 | Server to client | ACK | 5001 | 1002 | | Arrives at 5 |
| 5 | Server to client | FIN, ACK | 5001 | 1002 | | Arrives at 6 |
| 6 | Client to server | ACK | 1002 | 5002 | | Arrives at 7 |

Model: every segment takes 1 time unit one way; the retransmission timeout is a fixed 3 units and TIME_WAIT a fixed 4 units. Real systems measure and vary these.

#### How TCP opens and closes a connection

TCP gives two programs a reliable stream of bytes. Before any data flows, both sides agree on where their byte numbering starts, which is what the three-way handshake does. The client sends **SYN** with its initial sequence number (ISN). The server answers **SYN, ACK** with its own ISN and acknowledges the client's ISN plus one. The client sends **ACK** for the server's ISN plus one. Both sides are then ESTABLISHED.

Closing is done one direction at a time. The side that closes first sends **FIN**; the other acknowledges it and, when it is done too, sends its own FIN, which the first side acknowledges. The side that closed first then waits in TIME_WAIT before the connection is fully gone. The simulator above shows each segment as an arrow from sender to receiver, with each side's state as it changes.

#### Worked example

With a client ISN of 1000, a server ISN of 5000 and 100 bytes of data from the client, the exchange takes 12 time units in this model:

| Time | Direction | Flags | Seq | Ack | Data | Delivery |
| 0 | Client to server | SYN | 1000 | | | Arrives at 1 |
| 1 | Server to client | SYN, ACK | 5000 | 1001 | | Arrives at 2 |
| 2 | Client to server | ACK | 1001 | 5001 | | Arrives at 3 |
| 3 | Client to server | PSH, ACK | 1001 | 5001 | 100 | Arrives at 4 |
| 4 | Server to client | ACK | 5001 | 1101 | | Arrives at 5 |
| 5 | Client to server | FIN, ACK | 1101 | 5001 | | Arrives at 6 |
| 6 | Server to client | ACK | 5001 | 1102 | | Arrives at 7 |
| 7 | Server to client | FIN, ACK | 5001 | 1102 | | Arrives at 8 |
| 8 | Client to server | ACK | 1102 | 5002 | | Arrives at 9 |

The SYN and each FIN use up one sequence number even though they carry no data, which is why the server acknowledges 1001 after a SYN with sequence number 1000, and why the acknowledgement for the client's FIN at 1101 is 1102.

#### The model, and what it leaves out

- Every segment takes exactly 1 time unit from sender to receiver.

- The retransmission timeout is a fixed 3 units and TIME_WAIT is a fixed 4 units. Real systems measure the round trip time to set the timeout and use a longer TIME_WAIT; the fixed values here only keep the timeline readable.

- There is no window, no congestion control and no options. Data is one segment from the client.

- Sequence numbers wrap around after 4,294,967,295, as in the real protocol; try an ISN near the top to see it.

#### The three scenarios

- **Normal open and close:** the client opens, optionally sends data, and closes first. The server passes through CLOSE_WAIT and LAST_ACK; the client through FIN_WAIT_1, FIN_WAIT_2 and TIME_WAIT.

- **Simultaneous close:** both sides send FIN at the same moment. Each receives the other's FIN while in FIN_WAIT_1, moves to CLOSING, and both end in TIME_WAIT.

- **Lost SYN:** the client's first SYN never arrives. After the timeout the client sends it again, and the handshake then goes ahead as normal.

#### Sequence and acknowledgement numbers

- Ack for a SYN or FIN `= its sequence number + 1`

- Ack for data `= sequence number + bytes`

- All arithmetic is `mod 2^32`

#### Common exam mistakes

- **Acknowledging the same number that was sent.** The ack is the next byte expected, so it is one more after a SYN or FIN.

- **Mixing up which side goes to TIME_WAIT.** It is the side that closed first.

- **Forgetting CLOSE_WAIT.** After acknowledging the other side's FIN, a side can keep sending until it closes too.

#### Related

- [IPv4 subnet calculator](/networking/subnet-calculator/)

- [VLSM subnet planner](/networking/vlsm-calculator/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Paste the link from "Copy link", which includes the scenario and numbers you used.

Email: abdul at abmans dot com

---

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
