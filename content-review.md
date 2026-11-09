# Trace: content review

The full text of every page, extracted from the built HTML. Interactive parts of the simulator pages are replaced by a note; their interface copy is listed once at the end. Word counts cover the written content only (the article under the tool).

---

## Page: /

- Title: Trace: step-by-step simulators for how computers decide
- Description (143 characters): Step-by-step simulators that show how computers decide: which process runs, which page leaves memory. Press play and read why. Free, no signup.

### H1: Watch computers decide

Trace shows, one step at a time, how a computer chooses what to do next, and says why at every step. It runs in your browser. Free, no signup.

[Timeline graphic]

Round Robin with a 2-unit slice: four processes take turns on one CPU. [Open it in the simulator](/operating-systems/cpu-scheduling/round-robin/)

#### Operating systems

How an operating system shares one CPU between many processes. Enter your own processes, press play, and read the reason for every decision.

- [CPU scheduling simulator: All five algorithms in one place, and how to choose between them](/operating-systems/cpu-scheduling/)

- [First Come First Served: Runs processes in the order they arrive](/operating-systems/cpu-scheduling/fcfs/)

- [Shortest Job First: Picks the shortest waiting job when the CPU frees up](/operating-systems/cpu-scheduling/sjf/)

- [Shortest Remaining Time First: Interrupts for any job that would finish sooner](/operating-systems/cpu-scheduling/srtf/)

- [Priority scheduling: Runs the most important ready process, with or without interrupting](/operating-systems/cpu-scheduling/priority/)

- [Round Robin: Gives each process a fixed slice in turn](/operating-systems/cpu-scheduling/round-robin/)

- [Compare scheduling algorithms: All five on the same processes, side by side](/operating-systems/cpu-scheduling/compare/)

#### Memory

How an operating system chooses which page leaves memory when a new one has to come in. Enter the pages a program asks for, press play, and see every hit, fault and eviction.

- [Page replacement simulator: FIFO, LRU, Optimal and Clock in one place, and how they differ](/memory/page-replacement/)

- [FIFO page replacement: Evicts the page that has been in memory longest](/memory/page-replacement/fifo/)

- [LRU page replacement: Evicts the page that has gone unused longest](/memory/page-replacement/lru/)

- [Optimal page replacement: Evicts the page needed furthest in the future](/memory/page-replacement/optimal/)

- [Clock page replacement: Gives pages with their reference bit set a second chance](/memory/page-replacement/clock/)

- [Compare page replacement algorithms: All four on the same pages, and faults with 1 to 8 frames](/memory/page-replacement/compare/)

---

## Page: /operating-systems/cpu-scheduling/

- Title: CPU Scheduling Simulator with Gantt Chart | Trace
- Description (141 characters): Enter your processes, pick FCFS, SJF, SRTF, Priority or Round Robin, press play, and see why each process runs when it does. Free, no signup.
- Written content: 569 words

### H1: CPU scheduling simulator

Pick an algorithm, enter your processes and press play. Every scheduling decision comes with the reason for it.

FCFS / SJF / SRTF / Priority / Round Robin

[Interactive simulator: see "Interface copy" at the end]

#### What CPU scheduling decides

A computer usually has more processes ready to run than it has processors. CPU scheduling is the rule that decides which ready process gets the CPU next, and for how long. The five algorithms on this page all answer that question differently: by arrival order, by job length, by remaining work, by importance, or by taking turns. The simulator above runs any of them on the same processes, so you can switch and watch the timeline change.

Every schedule here is shown as a timeline, which textbooks call a Gantt chart: time runs left to right, the top lane shows who has the CPU, and each process has its own lane with its runs and its waiting stretches.

#### How schedules are measured

Three numbers per process describe how a schedule treated it. **Turnaround time** is how long the process spent in the system, from arrival to finish. **Waiting time** is the part of that it spent ready but not running. **Response time** is how long it waited before it ran for the first time. Averages over all processes let you compare algorithms; CPU utilization and throughput describe the schedule as a whole.

- Turnaround time `= finished - arrival`

- Waiting time `= turnaround - burst`

- Response time `= first run - arrival`

- CPU utilization `= total burst / last finish`, and throughput `= processes / last finish`

#### Which one should I use?

There is no single best algorithm; each one wins on a different measure. Use this table as a starting point, then try your own processes in the [compare view](/operating-systems/cpu-scheduling/compare/).

| Algorithm | Preemptive | Can starve | Best for | Main weakness |

| FCFS | No | No | Simple batches where arrival order is fair | Short jobs wait behind long ones |

| SJF | No | Yes, long jobs | Low average waiting time when job lengths are known | Needs burst lengths in advance |

| SRTF | Yes | Yes, long jobs | The lowest average waiting time, if switching is cheap | Many switches, needs remaining times |

| Priority | Either | Yes, low priority, unless aging is used | Work where some processes matter more | Importance can leave long waits |

| Round Robin | Yes | No | Interactive use and fair response times | Higher average turnaround; depends on the quantum |

A few rules of thumb follow from the table. If you care about average waiting time and know how long jobs take, the shortest-first family (SJF, SRTF) is hard to beat. If you care about every process getting a turn quickly, Round Robin is the usual answer. If processes differ in importance, Priority expresses that directly, and FCFS remains the baseline the others are measured against.

#### What Trace assumes

The simulator follows the classic textbook model: one CPU, time in whole units, each process needing one CPU burst with no input or output in between, and switching between processes taking no time. Real schedulers deal with all of these, but exam questions usually do not, and the simple model makes every decision visible. The tie-break rules are stated on each algorithm's page and, where textbooks differ, you can switch them.

#### The five algorithms

- [First Come First Served](/operating-systems/cpu-scheduling/fcfs/)

- [Shortest Job First](/operating-systems/cpu-scheduling/sjf/)

- [Shortest Remaining Time First](/operating-systems/cpu-scheduling/srtf/)

- [Priority scheduling](/operating-systems/cpu-scheduling/priority/)

- [Round Robin](/operating-systems/cpu-scheduling/round-robin/)

- [Compare all five](/operating-systems/cpu-scheduling/compare/)

#### Spotted a mistake?

If something on this page looks wrong, please tell me what and why.

Email: abdul at abmans dot com

---

## Page: /operating-systems/cpu-scheduling/fcfs/

- Title: FCFS Scheduling Simulator with Gantt Chart | Trace
- Description (146 characters): Enter your processes, press play, and watch First Come First Served run them in arrival order, with waiting and turnaround times. Free, no signup.
- Written content: 774 words

### H1: First Come First Served scheduling

The CPU runs processes in the order they arrive, each one to the end. Press play and watch every decision.

[FCFS](/operating-systems/cpu-scheduling/fcfs/) / [SJF](/operating-systems/cpu-scheduling/sjf/) / [SRTF](/operating-systems/cpu-scheduling/srtf/) / [Priority](/operating-systems/cpu-scheduling/priority/) / [Round Robin](/operating-systems/cpu-scheduling/round-robin/)

[Interactive simulator: see "Interface copy" at the end]

#### How First Come First Served works

First Come First Served (FCFS) is the simplest CPU scheduling algorithm: processes get the CPU in the order they arrive. When the CPU becomes free, the scheduler takes the process that has been in the ready queue the longest, and that process keeps the CPU until its whole burst is done. Nothing can interrupt it, so FCFS is non-preemptive.

Two details decide every schedule. If two processes arrive at the same time, Trace gives the CPU to the lower process number first, so P1 goes before P2. If nothing is ready when the CPU frees up, the CPU sits idle until the next arrival, and the timeline shows that gap as idle time.

The behavior to remember is the convoy effect. One long process at the front of the queue makes every short process behind it wait for its entire burst, much like cars stuck behind a slow truck on a single-lane road. FCFS looks only at arrival order, never at how long a job is, so the same work can produce very different waiting times depending on who shows up first.

Because each process runs exactly once, from start to finish, its response time and its waiting time are always the same number under FCFS. That stops being true for the preemptive algorithms, where a process can start, stop and wait again.

#### Worked example

Three processes arrive at time 0 with bursts of 24, 3 and 3 units. They all arrive together, so the tie rule puts P1 first, and the two short jobs wait behind the long one.

FCFS. Order of execution: P1 0 to 24, P2 24 to 27, P3 27 to 30.

[Timeline graphic]

| Process | Arrival | Burst | Finished | Turnaround | Waiting | Response |

| P1 | 0 | 24 | 24 | 24 | 0 | 0 |
| P2 | 0 | 3 | 27 | 27 | 24 | 24 |
| P3 | 0 | 3 | 30 | 30 | 27 | 27 |

| Average | | | | 27 | 17 | 17 |

[Open this example in the simulator](/operating-systems/cpu-scheduling/fcfs/?alg=fcfs&p=0:24,0:3,0:3)

The average waiting time is (0 + 24 + 27) / 3 = 17. Now imagine the two short jobs had arrived a moment before P1. The order becomes P2, P3, P1 and the average wait drops to (0 + 3 + 6) / 3 = 3, with exactly the same amount of work. That gap is the convoy effect in numbers.

#### Formulas

- Turnaround time `= finished - arrival`

- Waiting time `= turnaround - burst`

- Response time `= first run - arrival`

Take P3 from the example: it finishes at 30 and arrived at 0, so its turnaround time is 30. Its burst is 3, so it spent 30 - 3 = 27 units waiting. It started at 27, which makes its response time 27 as well, as expected for FCFS. Averages are the sum over all processes divided by the number of processes. The simulator shows them to two decimals and gives the exact fraction when you hover or focus the number.

#### Strengths and weaknesses

##### Strengths

- Easy to understand and to implement with a single queue.

- No starvation: every process that arrives eventually runs.

- Very little scheduling work, since a decision is needed only when a process finishes.

##### Weaknesses

- The convoy effect: short jobs stuck behind a long one inflate the average waiting time.

- A poor fit for interactive use, because one long job delays everything behind it.

- No way for an urgent process to get ahead, since nothing is ever preempted.

#### Common exam mistakes

- **Ordering by process number instead of arrival time.** If P3 arrives at time 1 and P2 at time 2, P3 runs first. Process numbers only break ties between equal arrival times.

- **Forgetting idle time.** If the first process arrives at time 2, the CPU is idle from 0 to 2. The timeline starts at 0, and the idle stretch lowers CPU utilization.

- **Using the start time as the waiting time.** That only works when the process arrived at 0. In general waiting time is start time minus arrival time for FCFS.

- **Measuring turnaround from time 0.** Turnaround runs from the moment the process arrives, not from the start of the timeline.

#### Related

- [Shortest Job First](/operating-systems/cpu-scheduling/sjf/), the same one-shot runs ordered by burst length

- [Round Robin](/operating-systems/cpu-scheduling/round-robin/), which adds time slices to arrival order

- [Shortest Remaining Time First](/operating-systems/cpu-scheduling/srtf/)

- [Priority scheduling](/operating-systems/cpu-scheduling/priority/)

- [Compare all five algorithms](/operating-systems/cpu-scheduling/compare/)

- [How to choose a scheduling algorithm](/operating-systems/cpu-scheduling/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the processes you entered, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /operating-systems/cpu-scheduling/sjf/

- Title: SJF Scheduling Simulator with Gantt Chart | Trace
- Description (145 characters): Enter your processes, press play, and see Shortest Job First pick the smallest burst each time the CPU frees up, with every step explained. Free.
- Written content: 784 words

### H1: Shortest Job First scheduling

Whenever the CPU frees up, the shortest waiting job goes next and runs to the end. Press play and watch every decision.

[FCFS](/operating-systems/cpu-scheduling/fcfs/) / [SJF](/operating-systems/cpu-scheduling/sjf/) / [SRTF](/operating-systems/cpu-scheduling/srtf/) / [Priority](/operating-systems/cpu-scheduling/priority/) / [Round Robin](/operating-systems/cpu-scheduling/round-robin/)

[Interactive simulator: see "Interface copy" at the end]

#### How Shortest Job First works

Shortest Job First (SJF) makes one decision each time the CPU becomes free: out of the processes that are already waiting, it runs the one with the smallest burst. Once a process starts, it runs to the end, even if a shorter one arrives a moment later. This page covers that non-preemptive form. The version that interrupts for a shorter newcomer has its own page, [Shortest Remaining Time First](/operating-systems/cpu-scheduling/srtf/).

Only processes that have arrived are candidates. A 1-unit job arriving at time 5 cannot be chosen at time 4, however short it is. When two waiting processes have the same burst, Trace picks the one that arrived earlier, and if they also arrived together, the lower process number.

The idea behind SJF is that a short job finishing early shortens the wait of everyone queued behind it, while a long job finishing early helps nobody much. When all the processes are ready at the same moment, running them shortest first gives the lowest possible average waiting time of any order.

The catch is that the scheduler has to know each burst before it runs. Exercises give you the numbers, but a real system can only guess. Textbook treatments often estimate the next burst of a process from the lengths of its previous bursts, for example with an exponential average. SJF also risks starvation: if short jobs keep arriving, a long job can be passed over again and again.

#### Worked example

Four processes arrive at time 0 with bursts of 6, 8, 7 and 3. With everything ready at once, SJF simply sorts by burst: P4 (3), then P1 (6), P3 (7) and P2 (8).

SJF. Order of execution: P4 0 to 3, P1 3 to 9, P3 9 to 16, P2 16 to 24.

[Timeline graphic]

| Process | Arrival | Burst | Finished | Turnaround | Waiting | Response |

| P1 | 0 | 6 | 9 | 9 | 3 | 3 |
| P2 | 0 | 8 | 24 | 24 | 16 | 16 |
| P3 | 0 | 7 | 16 | 16 | 9 | 9 |
| P4 | 0 | 3 | 3 | 3 | 0 | 0 |

| Average | | | | 13 | 7 | 7 |

[Open this example in the simulator](/operating-systems/cpu-scheduling/sjf/?alg=sjf&p=0:6,0:8,0:7,0:3)

The average waiting time is (3 + 16 + 9 + 0) / 4 = 7. Running the same four processes in arrival order, as FCFS would, gives waits of 0, 6, 14 and 21, an average of 10.25. The difference comes entirely from letting P4 go first instead of last.

#### Formulas

- Turnaround time `= finished - arrival`

- Waiting time `= turnaround - burst`

- Response time `= first run - arrival`

In the example, P2 is the longest job and runs last: it finishes at 24, so its turnaround is 24 and its waiting time is 24 - 8 = 16. As in every non-preemptive algorithm, each process runs in one piece, so its response time equals its waiting time.

#### Strengths and weaknesses

##### Strengths

- The lowest average waiting time of any order when all jobs are ready together and their bursts are known.

- Short jobs finish quickly, which makes the system feel faster for them.

- No preemption, so each process runs in one piece with no switching cost.

##### Weaknesses

- Needs burst lengths in advance, which real systems can only estimate.

- Long jobs can starve if shorter ones keep arriving.

- A short job that arrives just after a long one has started must wait for all of it.

#### Common exam mistakes

- **Interrupting the running job.** In non-preemptive SJF a shorter arrival waits until the current job finishes. Switching on arrival is SRTF, a different algorithm with different answers.

- **Choosing a job that has not arrived yet.** At each decision, look only at processes whose arrival time is at or before the current time.

- **Breaking ties by process number first.** Between equal bursts, the earlier arrival goes first; the process number only decides when arrival times match too. Many courses break ties by arrival order, which is what Trace does. Check yours.

- **Calling SJF optimal in every case.** Its guarantee holds for average waiting time with known bursts. It says nothing about fairness, and long jobs can be delayed without limit.

#### Related

- [Shortest Remaining Time First](/operating-systems/cpu-scheduling/srtf/), the preemptive form

- [First Come First Served](/operating-systems/cpu-scheduling/fcfs/), the same structure ordered by arrival

- [Priority scheduling](/operating-systems/cpu-scheduling/priority/), where burst length can act as the priority

- [Round Robin](/operating-systems/cpu-scheduling/round-robin/)

- [Compare all five algorithms](/operating-systems/cpu-scheduling/compare/)

- [How to choose a scheduling algorithm](/operating-systems/cpu-scheduling/)

#### Spotted a mistake?

Tell me which number or sentence looks wrong, and include the link from "Copy link" if you changed the processes, so I can reproduce exactly what you saw.

Email: abdul at abmans dot com

---

## Page: /operating-systems/cpu-scheduling/srtf/

- Title: SRTF Scheduling Simulator with Gantt Chart | Trace
- Description (143 characters): Enter your processes, press play, and see Shortest Remaining Time First preempt when a shorter job arrives, with each decision explained. Free.
- Written content: 827 words

### H1: Shortest Remaining Time First scheduling

At every moment the process with the least time left runs, even if that means interrupting another. Press play and watch every decision.

[FCFS](/operating-systems/cpu-scheduling/fcfs/) / [SJF](/operating-systems/cpu-scheduling/sjf/) / [SRTF](/operating-systems/cpu-scheduling/srtf/) / [Priority](/operating-systems/cpu-scheduling/priority/) / [Round Robin](/operating-systems/cpu-scheduling/round-robin/)

[Interactive simulator: see "Interface copy" at the end]

#### How Shortest Remaining Time First works

Shortest Remaining Time First (SRTF) is the preemptive version of Shortest Job First. At every moment the CPU belongs to the process with the least work left. Since remaining times only change for the running process, the decision can only change at two kinds of moments: when the running process finishes, and when a new process arrives.

The arrival check is where most of the action happens. The newcomer's burst is compared with the time the running process has **left**, not with its original burst. If the newcomer needs strictly less, it takes over and the interrupted process goes back to the ready queue with its remaining time intact, to resume later from where it stopped.

In Trace, if a newcomer needs exactly as much time as the running process has left, the running process keeps the CPU, because switching would gain nothing. Other ties, between waiting processes, go to the earlier arrival and then to the lower process number.

With known burst lengths and free switching, SRTF gives the lowest average waiting time of any schedule for the same processes. Real systems pay for each switch and cannot know remaining times exactly, and long jobs can starve when short ones keep arriving. Trace treats a switch as taking no time, so the numbers here are the textbook ideal.

#### Worked example

P1 arrives at 0 needing 8. At time 1, P2 arrives needing 4, less than the 7 that P1 has left, so P2 takes over. At times 2 and 3, P3 (9) and P4 (5) arrive, but neither needs less than P2's remaining time, so P2 keeps running until it finishes at 5.

SRTF. Order of execution: P1 0 to 1, P2 1 to 5, P4 5 to 10, P1 10 to 17, P3 17 to 26.

[Timeline graphic]

| Process | Arrival | Burst | Finished | Turnaround | Waiting | Response |

| P1 | 0 | 8 | 17 | 17 | 9 | 0 |
| P2 | 1 | 4 | 5 | 4 | 0 | 0 |
| P3 | 2 | 9 | 26 | 24 | 15 | 15 |
| P4 | 3 | 5 | 10 | 7 | 2 | 2 |

| Average | | | | 13 | 6.50 (13/2) | 4.25 (17/4) |

[Open this example in the simulator](/operating-systems/cpu-scheduling/srtf/?alg=srtf&p=0:8,1:4,2:9,3:5)

From time 5 on, the shortest remaining job is P4 (5), then P1 (7 left), then P3 (9). The average waiting time is (9 + 0 + 15 + 2) / 4 = 6.5. Look at P1: its response time is 0 because it started immediately, but it waited 9 units in total, from 1 to 10. Non-preemptive SJF on the same processes averages 7.75, because it cannot let P2 in early.

#### Formulas

- Turnaround time `= finished - arrival`

- Waiting time `= turnaround - burst`

- Response time `= first run - arrival`

The waiting formula already counts every gap, which matters once processes are split. P1 finishes at 17 after arriving at 0, so its turnaround is 17, and 17 - 8 = 9 units of waiting: the stretch from 1 to 10 when it was ready but not running. Response time only measures the first wait, so for preempted processes it is often much smaller than the waiting time.

#### Strengths and weaknesses

##### Strengths

- The lowest average waiting time when bursts are known and switching is free.

- Short jobs that arrive late still get through quickly.

- Reacts to every arrival instead of waiting for the CPU to free up.

##### Weaknesses

- Needs to know how much work each process has left.

- Long jobs can be preempted again and again and may starve.

- More context switches than SJF, each of which costs time in a real system.

#### Common exam mistakes

- **Comparing against the original burst.** At time 1 in the example, P2's 4 is compared with P1's remaining 7, not with P1's burst of 8.

- **Preempting on a tie.** When the newcomer needs exactly what the running process has left, check the rule your course uses. Trace keeps the running process, and the page states it so you can match your textbook.

- **Losing the waiting time after a preemption.** A process that is interrupted keeps accumulating waiting time until it gets the CPU back. Use turnaround minus burst rather than adding gaps by hand.

- **Mixing up response and waiting time.** They are equal in FCFS and SJF, but not here: P1 above has a response time of 0 and a waiting time of 9.

- **Checking only when a process finishes.** That is non-preemptive SJF. SRTF must re-check at every arrival.

#### Related

- [Shortest Job First](/operating-systems/cpu-scheduling/sjf/), the non-preemptive form

- [Priority scheduling](/operating-systems/cpu-scheduling/priority/) with preemption turned on

- [Round Robin](/operating-systems/cpu-scheduling/round-robin/)

- [First Come First Served](/operating-systems/cpu-scheduling/fcfs/)

- [Compare all five algorithms](/operating-systems/cpu-scheduling/compare/)

- [How to choose a scheduling algorithm](/operating-systems/cpu-scheduling/)

#### Spotted a mistake?

Preemptive schedules are easy to get subtly wrong, in textbooks and in tools. If you think this one is, send the processes or the copied link and the answer you expected.

Email: abdul at abmans dot com

---

## Page: /operating-systems/cpu-scheduling/priority/

- Title: Priority Scheduling Simulator with Gantt Chart | Trace
- Description (142 characters): Enter processes with priorities, choose preemptive or not, press play, and see why each one gets the CPU when it does. Free, no signup needed.
- Written content: 855 words

### H1: Priority scheduling

The most important ready process runs first. You choose whether a new arrival can interrupt. Press play and watch every decision.

[FCFS](/operating-systems/cpu-scheduling/fcfs/) / [SJF](/operating-systems/cpu-scheduling/sjf/) / [SRTF](/operating-systems/cpu-scheduling/srtf/) / [Priority](/operating-systems/cpu-scheduling/priority/) / [Round Robin](/operating-systems/cpu-scheduling/round-robin/)

[Interactive simulator: see "Interface copy" at the end]

#### How Priority scheduling works

In Priority scheduling every process carries a priority number, and the scheduler runs the ready process with the best one. What counts as best is a convention, and it differs between textbooks and systems. Trace uses lower number means higher priority by default, so priority 1 beats priority 3. The "Highest priority" switch flips this when your question uses the opposite convention.

The algorithm comes in two forms. Non-preemptive Priority decides only when the CPU becomes free, and the chosen process then runs to the end. Preemptive Priority also checks every arrival: a newcomer with a strictly better priority takes the CPU at once, and the interrupted process goes back to wait. A newcomer with the same priority does not interrupt. In both forms, ties between waiting processes go to the earlier arrival and then to the lower process number.

The weakness of strict priority is starvation. A low-priority process can wait indefinitely while higher-priority work keeps arriving. The usual remedy is aging, which slowly improves the priority of a process the longer it waits. Trace does not apply aging, so the schedules here show plain priority exactly as defined.

Priority scheduling is also a general frame for other algorithms. If you use the burst length as the priority, non-preemptive Priority becomes Shortest Job First, which is a useful way to check your understanding of both.

#### Worked example

Five processes arrive at time 0 with bursts 10, 1, 2, 1 and 5 and priorities 3, 1, 4, 5 and 2. With everyone ready together, non-preemptive Priority simply runs them from best to worst: P2 (1), P5 (2), P1 (3), P3 (4), P4 (5).

Priority (non-preemptive, lower number means higher priority). Order of execution: P2 0 to 1, P5 1 to 6, P1 6 to 16, P3 16 to 18, P4 18 to 19.

[Timeline graphic]

| Process | Arrival | Burst | Priority | Finished | Turnaround | Waiting | Response |

| P1 | 0 | 10 | 3 | 16 | 16 | 6 | 6 |
| P2 | 0 | 1 | 1 | 1 | 1 | 0 | 0 |
| P3 | 0 | 2 | 4 | 18 | 18 | 16 | 16 |
| P4 | 0 | 1 | 5 | 19 | 19 | 18 | 18 |
| P5 | 0 | 5 | 2 | 6 | 6 | 1 | 1 |

| Average | | | | | 12 | 8.20 (41/5) | 8.20 (41/5) |

[Open this example in the simulator](/operating-systems/cpu-scheduling/priority/?alg=priority&p=0:10:3,0:1:1,0:2:4,0:1:5,0:5:2)

The average waiting time is (6 + 0 + 16 + 18 + 1) / 5 = 8.2. Priority does not try to minimize waiting time: the same processes under SJF would average 3.2. It optimizes for importance, not speed, and that trade-off is the point of the algorithm.

##### With preemption turned on

Try a case where arrivals happen while something runs: P1 (burst 7, priority 3) at time 0, P2 (4, priority 1) at 2, P3 (2, priority 2) at 3 and P4 (3, priority 1) at 5. At time 2, P2 preempts P1. At time 5, P4 arrives with the same priority as P2, so P2 keeps the CPU and finishes at 6. Then P4, P3 and finally the rest of P1 run, for an average waiting time of 4. [Open this case in the simulator](/operating-systems/cpu-scheduling/priority/?alg=priority&pre=1&p=0:7:3,2:4:1,3:2:2,5:3:1).

#### Formulas

- Turnaround time `= finished - arrival`

- Waiting time `= turnaround - burst`

- Response time `= first run - arrival`

The priority number never appears in these formulas; it only decides the order. P4 in the first example has the worst priority, so it runs last: it finishes at 19, its turnaround is 19 and it waits 19 - 1 = 18 units for a job that needs just 1.

#### Strengths and weaknesses

##### Strengths

- Lets important work go first, which arrival order and burst length cannot express.

- The preemptive form reacts at once to urgent arrivals.

- A general scheme: other policies, like SJF, are special cases of it.

##### Weaknesses

- Low-priority processes can starve without aging.

- Average waiting time can be poor, since importance and length are unrelated.

- The meaning of the numbers is a convention that must be agreed first.

#### Common exam mistakes

- **Assuming the bigger number wins.** Read the question for the convention. Many exercises use 1 as the highest priority, but not all of them do.

- **Ignoring arrival times.** A priority 1 process that arrives at time 6 cannot run at time 2, no matter how important it is.

- **Forgetting to check arrivals in the preemptive form.** Every arrival is a possible preemption point, not only the moments when a process finishes.

- **Preempting on equal priority.** An arrival with the same priority as the running process waits. Trace follows this rule; check that your course does too.

#### Related

- [Shortest Job First](/operating-systems/cpu-scheduling/sjf/), Priority with burst length as the priority

- [Shortest Remaining Time First](/operating-systems/cpu-scheduling/srtf/), the preemptive counterpart of SJF

- [Round Robin](/operating-systems/cpu-scheduling/round-robin/)

- [First Come First Served](/operating-systems/cpu-scheduling/fcfs/)

- [Compare all five algorithms](/operating-systems/cpu-scheduling/compare/)

- [How to choose a scheduling algorithm](/operating-systems/cpu-scheduling/)

#### Spotted a mistake?

If the order or a number looks wrong, mention which priority convention and which form (preemptive or not) you expected, plus the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /operating-systems/cpu-scheduling/round-robin/

- Title: Round Robin Scheduling Simulator with Gantt Chart | Trace
- Description (144 characters): Set a time quantum, enter your processes, press play, and watch Round Robin rotate the ready queue, with every slice explained. Free, no signup.
- Written content: 883 words

### H1: Round Robin scheduling

Each process gets the CPU for a fixed slice, then goes to the back of the line. Press play and watch every decision.

[FCFS](/operating-systems/cpu-scheduling/fcfs/) / [SJF](/operating-systems/cpu-scheduling/sjf/) / [SRTF](/operating-systems/cpu-scheduling/srtf/) / [Priority](/operating-systems/cpu-scheduling/priority/) / [Round Robin](/operating-systems/cpu-scheduling/round-robin/)

[Interactive simulator: see "Interface copy" at the end]

#### How Round Robin works

Round Robin (RR) gives every process a turn of fixed length, called the time quantum or time slice. The ready queue is first in, first out. The process at the front runs for up to one quantum; if it still has work left when the slice ends, it goes to the back of the queue and the next process gets its turn.

Three situations decide most schedules. If a process finishes before its slice ends, it gives up the CPU at that moment, and the next process starts straight away with a full slice. If a slice ends and nobody else is waiting, the same process simply continues with a new slice; the timeline marks that boundary with a thin tick inside the bar. And a process that arrives in the middle of a slice joins the back of the queue at its arrival time, ahead of the process whose slice is still running.

One moment where sources differ is a new arrival at the exact instant a slice ends. Trace puts the new arrival in the queue first by default, then the process whose slice just ended. The "Ties at the same moment" switch reverses that, so you can match the convention your course uses. The Tie trap preset shows a case where the choice changes the answer.

The quantum shapes everything. A very large quantum means no process is ever cut off, and Round Robin turns into First Come First Served. A very small one gives every process a quick first turn, but in a real system each switch costs time, which Trace does not model. Do not expect average waiting time to move steadily as you change the quantum: for the example below it is 5.67 with a quantum of 4, 5.00 with 3, 6.33 with 2 and 17 with 24.

#### Worked example

Three processes arrive at time 0 with bursts 24, 3 and 3, and the quantum is 4. P1 runs first, uses its full slice and goes to the back. P2 and P3 each finish within their first slice, at 7 and 10.

Round Robin with a time quantum of 4. Order of execution: P1 0 to 4, P2 4 to 7, P3 7 to 10, P1 10 to 14, P1 14 to 18, P1 18 to 22, P1 22 to 26, P1 26 to 30.

[Timeline graphic]

| Process | Arrival | Burst | Finished | Turnaround | Waiting | Response |

| P1 | 0 | 24 | 30 | 30 | 6 | 0 |
| P2 | 0 | 3 | 7 | 7 | 4 | 4 |
| P3 | 0 | 3 | 10 | 10 | 7 | 7 |

| Average | | | | 15.67 (47/3) | 5.67 (17/3) | 3.67 (11/3) |

[Open this example in the simulator](/operating-systems/cpu-scheduling/round-robin/?alg=rr&q=4&tie=new&p=0:24,0:3,0:3)

From time 10, P1 is alone, so it keeps the CPU slice after slice until it finishes at 30. The average waiting time is (6 + 4 + 7) / 3 = 17/3, about 5.67, compared with 17 under FCFS for the same processes. Round Robin cuts the waiting time of the short jobs at the cost of finishing the long one later than it would otherwise.

#### Formulas

- Turnaround time `= finished - arrival`

- Waiting time `= turnaround - burst`

- Response time `= first run - arrival`

Round Robin splits processes into many pieces, so add up waiting with the formula rather than by hand. P1 finishes at 30 with a burst of 24, so it waited 30 - 24 = 6 units, all of them between 4 and 10. Its response time is 0, because it started at once. Response time is where Round Robin usually shines, since every process gets the CPU within a bounded time after arriving.

#### Strengths and weaknesses

##### Strengths

- Fair: every ready process gets a turn, and nothing starves.

- Good response time, which suits interactive and time-sharing use.

- Needs no burst lengths or priorities, only the quantum.

##### Weaknesses

- Average turnaround is often higher than with SJF, because long and short jobs share the CPU.

- Performance depends heavily on choosing the quantum well.

- Frequent switches cost time in a real system.

#### Common exam mistakes

- **Getting the queue order wrong on a tie.** When an arrival and a slice end happen together, check which one your course puts first. Trace shows the rule in use and explains it in one line.

- **Letting a finished process keep its slice.** A process that needs only 1 unit of a 4-unit slice leaves after 1 unit; the next process starts immediately.

- **Putting the preempted process back at the front.** It goes to the back, behind everyone already waiting.

- **Forgetting arrivals during a slice.** They join the queue when they arrive, so they are ahead of the process whose slice is running when that slice ends.

- **Counting slices instead of time.** Waiting time is measured in time units, from arrival to completion, minus the burst.

#### Related

- [First Come First Served](/operating-systems/cpu-scheduling/fcfs/), what Round Robin becomes with a huge quantum

- [Shortest Remaining Time First](/operating-systems/cpu-scheduling/srtf/), another preemptive algorithm

- [Shortest Job First](/operating-systems/cpu-scheduling/sjf/)

- [Priority scheduling](/operating-systems/cpu-scheduling/priority/)

- [Compare all five algorithms](/operating-systems/cpu-scheduling/compare/)

- [How to choose a scheduling algorithm](/operating-systems/cpu-scheduling/)

#### Spotted a mistake?

Round Robin answers depend on small rules, so please include the quantum, the tie setting and the processes, or simply the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /operating-systems/cpu-scheduling/compare/

- Title: Compare CPU Scheduling Algorithms | Trace
- Description (144 characters): Run FCFS, SJF, SRTF, Priority and Round Robin on the same processes and compare average waiting, turnaround and response times. Free, no signup.
- Written content: 344 words

### H1: Compare scheduling algorithms

Run all five algorithms on the same processes and compare their averages side by side. Change the processes on the left and every row updates at once.

[Interactive comparison: see "Interface copy" at the end]

#### How to read the comparison

Each row runs one algorithm on exactly the processes on the left, with the same quantum for Round Robin and the same priority settings for Priority. The lowest value in each column is marked. Click an algorithm's name to open that schedule in its own simulator, where you can play it step by step and read the reason for every decision.

You will usually notice that the last finish time is the same in every row. None of these algorithms leaves the CPU idle while a process is ready, so they all complete the same total work at the same moment. What changes is who waits along the way, and that is what the averages measure.

#### Patterns worth looking for

- SRTF usually has the lowest average waiting time, because it always runs whatever can finish soonest. SJF is close behind when few processes arrive while another is running.

- Round Robin often has the best response time but a higher average turnaround, because it shares the CPU instead of finishing jobs one at a time.

- FCFS is the baseline. When a long job arrives first, its waiting times jump; when jobs arrive shortest first, it can match SJF exactly.

- Priority answers a different question, importance rather than speed, so it can rank last on every average and still be the right choice.

#### A word of caution

Averages depend heavily on the workload. One set of processes can make any algorithm look good or bad, so try several: the presets, a mix of long and short jobs, and jobs that arrive while others run. The written pages for each algorithm explain why the numbers come out as they do.

#### Related

- [How to choose a scheduling algorithm](/operating-systems/cpu-scheduling/)

- [First Come First Served](/operating-systems/cpu-scheduling/fcfs/)

- [Shortest Job First](/operating-systems/cpu-scheduling/sjf/)

- [Shortest Remaining Time First](/operating-systems/cpu-scheduling/srtf/)

- [Priority scheduling](/operating-systems/cpu-scheduling/priority/)

- [Round Robin](/operating-systems/cpu-scheduling/round-robin/)

#### Spotted a mistake?

Send the link from "Copy link" with the row that looks wrong.

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/

- Title: Page Replacement Simulator: FIFO, LRU, Optimal, Clock | Trace
- Description (141 characters): Enter a reference string and a frame count, pick FIFO, LRU, Optimal or Clock, press play, and see every page fault and why it happened. Free.
- Written content: 604 words

### H1: Page replacement simulator

Pick an algorithm, enter the pages a program asks for, and press play. Every hit, fault and eviction comes with the reason for it.

FIFO / LRU / Optimal / Clock

[Interactive simulator: see "Interface copy" at the end]

#### What page replacement decides

With virtual memory, a program's memory is split into pages, and only some of them sit in physical memory at once, each in a frame. When the program asks for a page that is not in a frame, that is a page fault: the page has to be loaded, which is slow. If every frame is already full, one page has to leave first. Page replacement is the rule that picks which one.

The simulator above takes the pages a program asks for, in order (the reference string), and the number of frames. Each column of the step table is one reference: the frame rows show what is in memory after it, the Result row shows a hit or a fault, and the Evicted row shows which page left. The four algorithms here answer "which page leaves?" in four different ways, so switch between them and watch the table change.

#### How results are measured

The main number is the count of page faults: fewer is better, because each fault means a slow load. The fault rate divides that by the number of references, so strings of different lengths can be compared. Trace counts every fault, including the first ones that only fill empty frames.

- Fault rate `= page faults / references`

- Hit rate `= hits / references = 1 - fault rate`

#### How the four algorithms differ

On the classic 20-page string with 3 frames, FIFO has 15 faults, LRU 12, Clock 14 and Optimal 9. Use this table as a starting point, then try your own strings in the [compare view](/memory/page-replacement/compare/).

| Algorithm | Evicts | Work on a hit | Belady's anomaly | Used as |

| FIFO | The page loaded first | None | Can happen | The simplest policy |

| LRU | The page unused for longest | Update the recency order | Cannot happen | A target that real systems approximate |

| Optimal | The page needed furthest ahead | None, but needs the future | Cannot happen | A benchmark, not a real policy |

| Clock | The first page without its reference bit | Set one bit | Can happen | A cheap approximation of LRU |

#### More frames, more faults?

Adding frames usually reduces faults, but not always. On the string 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5, FIFO has 9 faults with 3 frames and 10 with 4. This is Belady's anomaly. LRU and Optimal are stack algorithms, which means a run with more frames always keeps every page a run with fewer frames would keep, so they cannot show it: on the same string LRU goes from 10 to 8 and Optimal from 7 to 6. Every simulator page has a "With one more frame" panel that checks this for whatever string you enter.

#### Common exam mistakes

- **Mixing up LRU and Optimal.** LRU looks back (used longest ago). Optimal looks forward (needed furthest ahead).

- **Not counting the first faults.** Loading into an empty frame is a fault too, unless your course says to count only replacements.

- **Updating FIFO on a hit.** FIFO ignores hits. Only LRU and Clock react to them.

- **Moving the Clock hand on a hit.** A hit sets a bit; the hand only moves when it looks for a victim.

#### Related

- [FIFO page replacement](/memory/page-replacement/fifo/)

- [LRU page replacement](/memory/page-replacement/lru/)

- [Optimal page replacement](/memory/page-replacement/optimal/)

- [Clock page replacement](/memory/page-replacement/clock/)

- [Compare all four algorithms](/memory/page-replacement/compare/)

- [CPU scheduling simulator](/operating-systems/cpu-scheduling/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string and frame count you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/fifo/

- Title: FIFO Page Replacement Simulator, Step by Step | Trace
- Description (143 characters): Enter a reference string, press play, and watch FIFO evict the page that came in first, with frames, faults and every eviction explained. Free.
- Written content: 945 words

### H1: FIFO page replacement

When memory is full, the page that has been there longest goes. Press play and watch every hit and fault.

[FIFO](/memory/page-replacement/fifo/) / [LRU](/memory/page-replacement/lru/) / [Optimal](/memory/page-replacement/optimal/) / [Clock](/memory/page-replacement/clock/)

[Interactive simulator: see "Interface copy" at the end]

#### How FIFO page replacement works

A program asks for pages one after another. If the page is already in a frame, that is a hit and nothing changes. If it is not, that is a page fault: the page has to be loaded, and when every frame is full, some page already in memory has to leave to make room. First In, First Out (FIFO) answers "which page leaves?" in the simplest way possible: the page that has been in memory longest.

Think of the frames as a queue. Each newly loaded page joins the back. On a fault with full memory, the page at the front leaves. A hit does not change the queue at all, because FIFO only cares about when a page arrived, not about how often or how recently it was used. That is the source of both its simplicity and its main weakness: a page that is used constantly still leaves once it is the oldest.

In the step table above, each column is one reference. A filled cell marks the page that was just loaded, a ringed cell marks a hit, and the Evicted row shows which page left. The side panel lists the pages in load order, oldest first, which is exactly the order FIFO will evict them in.

#### Worked example

The reference string 1, 3, 0, 3, 5, 6, 3 with 3 frames gives 6 faults and 1 hits in 7 references:

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| Page | 1 | 3 | 0 | 3 | 5 | 6 | 3 |
| Frame 0 | 1, loaded | 1 | 1 | 1 | 5, loaded | 5 | 5 |
| Frame 1 | | 3, loaded | 3 | 3, hit | 3 | 6, loaded | 6 |
| Frame 2 | | | 0, loaded | 0 | 0 | 0 | 3, loaded |
| Result | FFault | FFault | FFault | HHit | FFault | FFault | FFault |
| Evicted | | | | | 1 | 3 | 0 |

The first eviction happens at step 5. In Trace's words: "Page 5 is not in memory, so this is a page fault. All frames are full. FIFO evicts page 1, which was loaded first, at step 1. Page 5 goes into frame 0."

Look at page 3 in the example. It is used again and again, yet FIFO does not reward that: once page 3 is the oldest page in memory, it is the next one to go, even though it is about to be needed. The frame count and the string decide the result together, so try the same string with more frames in the simulator.

#### Belady's anomaly

You would expect more frames to mean fewer faults. With FIFO that is not guaranteed. On the string 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5, FIFO has 9 faults with 3 frames and 10 faults with 4 frames. Adding memory made things worse. This is called Belady's anomaly, and it can happen with FIFO because the set of pages it keeps with more frames is not always a superset of the set it keeps with fewer.

Press the "Belady's anomaly" preset to load that string. The "With one more frame" panel under the results runs the same string with one more frame and shows both fault counts side by side. For this string, FIFO with 1 to 8 frames gives 12, 12, 9, 10, 5, 5, 5, 5 faults.

#### Rules Trace uses

- Frames keep their position. The new page goes into the frame of the page it replaces, so each page stays in one row of the table while it is in memory.

- While there are free frames, a fault fills the lowest-numbered free frame.

- A hit changes nothing for FIFO. Only loading a page sets its place in the queue.

#### Formulas

- Fault rate `= page faults / references`

- Hit rate `= hits / references = 1 - fault rate`

In the example: 6 faults in 7 references is a fault rate of 6/7, or 85.7%. Every fault counts, including the first few that only fill empty frames. Some courses count only replacements; if yours does, subtract the number of frames that started empty.

#### Strengths and weaknesses

##### Strengths

- Very cheap: one queue, and nothing to update on a hit.

- Easy to trace by hand: the side panel order is the whole state.

- Every page eventually leaves, so stale pages do not stay forever.

##### Weaknesses

- Ignores how a page is used, so a busy page can be evicted just before it is needed again.

- Can show Belady's anomaly: more frames can mean more faults.

- Usually more faults than LRU on strings with locality, where recent pages are reused soon.

#### Common exam mistakes

- **Moving a page to the back on a hit.** That is LRU, not FIFO. In FIFO a hit leaves the queue exactly as it was.

- **Evicting from the wrong frame.** The victim is the oldest page, which is not always in frame 0. Track the load order, not the row.

- **Forgetting the first faults.** Loading a page into an empty frame is still a page fault.

- **Assuming more frames always help.** With FIFO they usually do, but Belady's anomaly shows they can hurt.

#### Related

- [LRU page replacement](/memory/page-replacement/lru/), which looks at recent use instead of arrival

- [Clock page replacement](/memory/page-replacement/clock/), FIFO with a second chance for used pages

- [Optimal page replacement](/memory/page-replacement/optimal/), the lower bound to compare against

- [Compare all four algorithms](/memory/page-replacement/compare/)

- [Page replacement overview](/memory/page-replacement/)

- [First Come First Served scheduling](/operating-systems/cpu-scheduling/fcfs/), the same first-in rule for the CPU

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string and frame count you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/lru/

- Title: LRU Page Replacement Simulator, Step by Step | Trace
- Description (144 characters): Enter a reference string, press play, and watch Least Recently Used evict the page unused for longest, with every fault and hit explained. Free.
- Written content: 804 words

### H1: LRU page replacement

When memory is full, the page that has gone unused the longest goes. Press play and watch every hit and fault.

[FIFO](/memory/page-replacement/fifo/) / [LRU](/memory/page-replacement/lru/) / [Optimal](/memory/page-replacement/optimal/) / [Clock](/memory/page-replacement/clock/)

[Interactive simulator: see "Interface copy" at the end]

#### How LRU page replacement works

Least Recently Used (LRU) evicts the page that has gone unused for the longest time. The idea is that the recent past is a good guide to the near future: a page used a moment ago is likely to be used again soon, and a page nobody has touched for a while probably is not needed right now. Programs that loop over the same data or code behave this way, which is called locality of reference.

Unlike FIFO, LRU cares about every reference, not only about loads. Each time a page is used, hit or fault, it becomes the most recently used page. On a fault with full memory, the page whose last use lies furthest in the past is evicted. The side panel in the simulator lists the pages from least to most recently used, so the first entry is always the next victim.

LRU is a stack algorithm: with one more frame it keeps every page it would have kept with fewer frames, and possibly more. Because of that it can never show Belady's anomaly, where adding frames causes more faults.

#### Worked example

The reference string 7, 0, 1, 2, 0, 3, 0, 4 with 3 frames gives 6 faults and 2 hits in 8 references:

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| Page | 7 | 0 | 1 | 2 | 0 | 3 | 0 | 4 |
| Frame 0 | 7, loaded | 7 | 7 | 2, loaded | 2 | 2 | 2 | 4, loaded |
| Frame 1 | | 0, loaded | 0 | 0 | 0, hit | 0 | 0, hit | 0 |
| Frame 2 | | | 1, loaded | 1 | 1 | 3, loaded | 3 | 3 |
| Result | FFault | FFault | FFault | FFault | HHit | FFault | HHit | FFault |
| Evicted | | | | 7 | | 1 | | 2 |

The first eviction happens at step 4. In Trace's words: "Page 2 is not in memory, so this is a page fault. All frames are full. LRU evicts page 7, last used at step 1, longer ago than any other page in memory. Page 2 goes into frame 0."

Watch page 0 in the example. It is used again and again, so it keeps being the most recently used page and LRU never picks it, even though it was loaded early. FIFO would treat it as old and evict it.

#### Rules Trace uses

- Loading a page counts as using it, so a page that has just arrived is the most recently used page.

- A hit makes the page the most recently used one. Nothing else changes.

- Frames keep their position: the new page goes into the frame of the evicted page. While there are free frames, a fault fills the lowest-numbered one.

- Two pages can never have the same last use, because only one page is referenced at each step, so LRU never needs a tie rule.

#### Formulas

- Fault rate `= page faults / references`

- Hit rate `= hits / references = 1 - fault rate`

In the example: 6 faults in 8 references is a fault rate of 3/4, or 75%. On the classic 20-page string with 3 frames, LRU has 12 faults, against 15 for FIFO and 9 for Optimal.

#### Strengths and weaknesses

##### Strengths

- Often close to Optimal on programs with locality, without needing to know the future.

- No Belady's anomaly: more frames never cause more faults.

- The choice is easy to explain: the page unused for longest goes.

##### Weaknesses

- Expensive to do exactly: every single reference has to update the recency order, which real hardware rarely supports directly.

- A loop slightly larger than memory defeats it: each page is evicted just before it comes round again. Try the "Loop" preset.

- Recency is only a guess about the future, so it can be wrong.

Because exact LRU is costly, many systems approximate it. The [Clock algorithm](/memory/page-replacement/clock/) is one such approximation that uses a single reference bit per page.

#### Common exam mistakes

- **Not updating on a hit.** A hit makes the page the most recently used one. Forgetting this turns LRU into FIFO.

- **Looking forward instead of back.** LRU looks at the past. Looking at when a page is needed next is Optimal.

- **Evicting the least frequently used page.** LRU is about how long ago a page was used, not how many times.

- **Losing track on long strings.** Keep a recency list beside your table, most recent at one end, like the side panel in the simulator.

#### Related

- [FIFO page replacement](/memory/page-replacement/fifo/), which ignores use completely

- [Optimal page replacement](/memory/page-replacement/optimal/), which looks forward instead of back

- [Clock page replacement](/memory/page-replacement/clock/), a cheap approximation of LRU

- [Compare all four algorithms](/memory/page-replacement/compare/)

- [Page replacement overview](/memory/page-replacement/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string and frame count you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/optimal/

- Title: Optimal Page Replacement Simulator, Step by Step | Trace
- Description (141 characters): Enter a reference string, press play, and watch Optimal (MIN) evict the page needed furthest in the future, with each choice explained. Free.
- Written content: 735 words

### H1: Optimal page replacement

When memory is full, the page needed furthest in the future goes. It needs to know the future, so it is a yardstick. Press play and watch.

[FIFO](/memory/page-replacement/fifo/) / [LRU](/memory/page-replacement/lru/) / [Optimal](/memory/page-replacement/optimal/) / [Clock](/memory/page-replacement/clock/)

[Interactive simulator: see "Interface copy" at the end]

#### How Optimal page replacement works

Optimal page replacement, also called MIN, evicts the page that will not be needed for the longest time. On a fault with full memory it looks ahead in the reference string, finds when each page in memory will be used next, and evicts the one whose next use is furthest away. A page that is never used again is the best possible victim.

No other algorithm can produce fewer page faults on the same reference string with the same number of frames, which is why it is called optimal. The catch is that it needs to know the future. A real operating system does not know which pages a program will ask for next, so Optimal cannot be built in practice. Its job is to be a yardstick: it shows the best result that is possible, so you can see how far FIFO, LRU or Clock are from it.

The side panel in the simulator lists the pages in memory with the step at which each is needed next, furthest first, so the first entry is the page Optimal would evict on the next fault.

#### Worked example

The reference string 7, 0, 1, 2, 0, 3, 0, 4, 2, 3 with 3 frames gives 6 faults and 4 hits in 10 references:

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| Page | 7 | 0 | 1 | 2 | 0 | 3 | 0 | 4 | 2 | 3 |
| Frame 0 | 7, loaded | 7 | 7 | 2, loaded | 2 | 2 | 2 | 2 | 2, hit | 2 |
| Frame 1 | | 0, loaded | 0 | 0 | 0, hit | 0 | 0, hit | 4, loaded | 4 | 4 |
| Frame 2 | | | 1, loaded | 1 | 1 | 3, loaded | 3 | 3 | 3 | 3, hit |
| Result | FFault | FFault | FFault | FFault | HHit | FFault | HHit | FFault | HHit | HHit |
| Evicted | | | | 7 | | 1 | | 0 | | |

The first eviction happens at step 4. In Trace's words: "Page 2 is not in memory, so this is a page fault. All frames are full. Optimal looks ahead: pages 7 and 1 are never used again. Of those, page 7 has been in memory longest, so it is evicted. Page 2 goes into frame 0."

On the classic 20-page string with 3 frames, Optimal has 9 faults. LRU has 12 and FIFO 15 on the same string, so the gap to the best possible result is easy to see.

#### Rules Trace uses

- **Tie rule.** If several pages in memory are never used again, Trace evicts the one that has been in memory longest. Sources differ here; any choice among never-used pages gives the same number of faults, but the frame contents can differ, so check which rule your course uses.

- Pages with a later use always have different next-use steps, so no other tie can happen.

- Frames keep their position: the new page goes into the frame of the evicted page. While there are free frames, a fault fills the lowest-numbered one.

#### Formulas

- Fault rate `= page faults / references`

- Hit rate `= hits / references = 1 - fault rate`

In the example: 6 faults in 10 references is a fault rate of 3/5, or 60%.

#### Strengths and weaknesses

##### Strengths

- The fewest faults of any algorithm on a given string and frame count.

- A fixed point of comparison for every other algorithm.

- No Belady's anomaly: more frames never cause more faults.

##### Weaknesses

- Needs the whole future reference string, which a running system does not have.

- So it cannot be used as a real page replacement policy, only to measure others.

#### Common exam mistakes

- **Looking back instead of forward.** "Used longest ago" is LRU. Optimal asks "needed furthest in the future".

- **Counting from the wrong place.** Look ahead from the step after the fault, not from the start of the string.

- **Missing pages that are never used again.** They are the first choice. If there are several, say which tie rule you used.

- **Calling Optimal a real algorithm.** It is a benchmark, because it needs future knowledge.

#### Related

- [LRU page replacement](/memory/page-replacement/lru/), which uses the past as a guess about the future

- [FIFO page replacement](/memory/page-replacement/fifo/)

- [Clock page replacement](/memory/page-replacement/clock/)

- [Compare all four algorithms](/memory/page-replacement/compare/)

- [Page replacement overview](/memory/page-replacement/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string and frame count you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/clock/

- Title: Clock Page Replacement Simulator (Second Chance) | Trace
- Description (143 characters): Enter a reference string, press play, and watch the Clock pointer sweep the frames, clear reference bits and pick a victim, step by step. Free.
- Written content: 931 words

### H1: Clock page replacement

A pointer sweeps the frames. A page with its reference bit set gets a second chance; the first page without one goes. Press play and watch.

[FIFO](/memory/page-replacement/fifo/) / [LRU](/memory/page-replacement/lru/) / [Optimal](/memory/page-replacement/optimal/) / [Clock](/memory/page-replacement/clock/)

[Interactive simulator: see "Interface copy" at the end]

#### How Clock page replacement works

Clock, also called second chance, keeps one reference bit for every frame and a pointer, the clock hand, that moves around the frames in a circle. When a page is used, its reference bit is set to 1. When a fault needs a victim, the hand looks at the frame it points to. If that page's bit is 1, the page has been used recently: the hand clears the bit to 0, giving the page a second chance, and moves on to the next frame. The first page it finds with bit 0 is evicted, the new page goes into that frame, and the hand moves one frame further.

The result sits between FIFO and LRU. Without any hits, Clock behaves like FIFO, because the hand simply goes round in load order. With hits, recently used pages survive a sweep, which approximates LRU at a fraction of the cost: a hit only sets one bit, and the hand does the rest when memory is full.

In the step table, the small number next to each page is its reference bit after that step, and the Pointer row shows where the hand points. The side panel lists the pages starting from the hand, which is the order it will check them.

#### Worked example

The reference string 1, 2, 3, 4, 1, 2, 5, 1 with 3 frames, new pages starting with bit 1, gives 7 faults and 1 hits in 8 references:

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| Page | 1 | 2 | 3 | 4 | 1 | 2 | 5 | 1 |
| Frame 0 | 1, bit 1, loaded | 1, bit 1 | 1, bit 1 | 4, bit 1, loaded | 4, bit 1 | 4, bit 1 | 5, bit 1, loaded | 5, bit 1 |
| Frame 1 | | 2, bit 1, loaded | 2, bit 1 | 2, bit 0 | 1, bit 1, loaded | 1, bit 1 | 1, bit 0 | 1, bit 1, hit |
| Frame 2 | | | 3, bit 1, loaded | 3, bit 0 | 3, bit 0 | 2, bit 1, loaded | 2, bit 0 | 2, bit 0 |
| Result | FFault | FFault | FFault | FFault | FFault | FFault | FFault | HHit |
| Evicted | | | | 1 | 2 | 3 | 4 | |
| Pointer | 1 | 2 | 0 | 1 | 2 | 0 | 1 | 1 |

The first second chance happens at step 4. In Trace's words: "Page 4 is not in memory, so this is a page fault. All frames are full. The pointer passes pages 1, 2 and 3, which have reference bit 1, and clears each one: a second chance. At frame 0, page 1 now has bit 0, so it is evicted. Page 4 goes into frame 0. The new page's bit is 1 and the pointer moves to frame 1."

Notice that a full sweep can clear every bit and come back to where it started. When every page has bit 1, the hand evicts the page it started on, exactly as FIFO would.

#### Rules Trace uses

- The hand starts at frame 0 and moves in frame order, wrapping from the last frame back to frame 0.

- While frames are free, a fault loads the page at the hand and moves the hand on. Frames fill in order 0, 1, 2 and so on.

- A hit sets the page's bit to 1 and does not move the hand.

- **The bit of a newly loaded page.** Sources differ. Trace sets it to 1 by default, so a new page starts with a second chance, and offers a switch to start it at 0. The choice can change the result: on the string 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 with 3 frames, Clock has 9 faults when new pages start at 1 and 10 when they start at 0.

#### Formulas

- Fault rate `= page faults / references`

- Hit rate `= hits / references = 1 - fault rate`

In the example: 7 faults in 8 references is a fault rate of 7/8, or 87.5%. On the classic 20-page string with 3 frames, Clock has 14 faults, between LRU with 12 and FIFO with 15.

#### Strengths and weaknesses

##### Strengths

- Cheap: a hit sets one bit, and only a fault moves the hand.

- Protects recently used pages, which plain FIFO does not.

- Simple hardware support: many processors set a reference bit when a page is accessed.

##### Weaknesses

- Only an approximation of LRU: one bit cannot tell "used a moment ago" from "used a while ago".

- When every bit is set, a fault has to sweep all the frames before it finds a victim.

- It can show Belady's anomaly. On the string above it has 9 faults with 3 frames and 10 with 4.

#### Common exam mistakes

- **Moving the hand on a hit.** A hit only sets the bit. The hand moves only while looking for a victim.

- **Forgetting to clear bits.** Every page the hand passes with bit 1 loses its bit, even if it is not evicted.

- **Leaving the hand on the new page.** After loading, the hand moves on to the next frame.

- **Mixing up the new-page bit.** State whether new pages start at 1 or 0. The two give different tables.

#### Related

- [FIFO page replacement](/memory/page-replacement/fifo/), which Clock becomes when no page is reused

- [LRU page replacement](/memory/page-replacement/lru/), which Clock approximates

- [Optimal page replacement](/memory/page-replacement/optimal/)

- [Compare all four algorithms](/memory/page-replacement/compare/)

- [Page replacement overview](/memory/page-replacement/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string, frame count and bit setting you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /memory/page-replacement/compare/

- Title: Compare Page Replacement Algorithms | Trace
- Description (142 characters): Run FIFO, LRU, Optimal and Clock on the same reference string and compare page faults, hit rates and how faults change with more frames. Free.
- Written content: 303 words

### H1: Compare page replacement algorithms

Run all four algorithms on the same pages and compare their faults side by side. Change the pages or frames on the left and every row updates at once.

#### Pages

Reference stringPage numbers from 0 to 99, separated by commas or spaces. Up to 40.

FramesHow many pages fit in memory, 1 to 8

New page reference bitA page gets bit 1 when it is loaded, so it starts with a second chance. Some courses start it at 0.
Starts at 1 / Starts at 0

Classic example
Belady's anomaly
Loop
Locality

Copy link

Copy this link

#### Faults for the same pages

| Algorithm | Faults | Hits | Fault rate |

| FIFO | 15 | 5 | 3/4 (75%) |
| LRU | 12 | 8 | 3/5 (60%) |
| Optimal | 9 fewest | 11 | 9/20 (45%) |
| Clock | 14 | 6 | 7/10 (70%) |

#### Fault or hit at each step

FIFOFFFFHFFFFFFHHFFHHFFFLRUFFFFHFHFFFFHHFHFHFHHOptimalFFFFHFHFHHFHHFHHHFHHClockFFFFHFHFFHFFHFFFHFHF

#### Faults with 1 to 8 frames

| Algorithm | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |

| FIFO | 20 | 15 | 15 | 10 | 9 | 6 | 6 | 6 |
| LRU | 20 | 17 | 12 | 8 | 7 | 6 | 6 | 6 |
| Optimal | 20 | 13 | 9 | 8 | 7 | 6 | 6 | 6 |
| Clock | 20 | 15 | 14 | 9 | 9 | 6 | 6 | 6 |

Optimal needs to know the future, so its 9 faults are the lowest any algorithm can reach on this string with 3 frames.

#### How to read this page

The first table runs FIFO, LRU, Optimal and Clock on the same reference string with the same number of frames and counts their faults. The fewest faults are marked. Each algorithm name opens its own simulator with the same pages, so you can step through how it got its number.

The strips show every reference as F for a fault or H for a hit, one row per algorithm, so you can see where the algorithms part ways. The last table runs every algorithm with 1 to 8 frames. A number marked with a triangle is higher than the one to its left: one more frame caused more faults. That is Belady's anomaly, and with the "Belady's anomaly" preset it shows up for FIFO.

#### What to look for

Optimal is a lower bound: no algorithm can have fewer faults on the same string and frame count, because Optimal uses knowledge of the future. The interesting question is how close the others get. On strings where recently used pages come back soon, LRU and Clock often stay close to Optimal. On a loop just larger than memory, like the "Loop" preset, FIFO and LRU fault on every reference while Optimal does much better.

The Clock row uses the bit setting from the panel on the left, so you can see whether starting new pages at 0 or 1 changes its count for your string.

#### Related

- [Page replacement overview](/memory/page-replacement/)

- [FIFO page replacement](/memory/page-replacement/fifo/)

- [LRU page replacement](/memory/page-replacement/lru/)

- [Optimal page replacement](/memory/page-replacement/optimal/)

- [Clock page replacement](/memory/page-replacement/clock/)

#### Spotted a mistake?

If a number or a sentence on this page looks wrong, please say so. Include the reference string and frame count you used, or paste the link from "Copy link".

Email: abdul at abmans dot com

---

## Page: /about/

- Title: About Trace and privacy
- Description (153 characters): What Trace is, how every simulator is checked for accuracy, what happens to the data you type (nothing leaves your browser), and how to report a mistake.
- Written content: 474 words

### H1: About Trace

#### What Trace is

Trace is a free website of step-by-step simulators that show how computers make decisions. You enter your own inputs, press play, and watch each decision happen with a plain-English reason attached to the exact moment it was made. Every simulator page also explains the idea in writing, with a worked example you can open in the simulator.

Trace has two sections so far. Operating systems covers CPU scheduling: First Come First Served, Shortest Job First, Shortest Remaining Time First, Priority and Round Robin, plus a page that compares them. Memory covers page replacement: FIFO, LRU, Optimal and Clock, also with a compare page.

#### Accuracy

Every algorithm is tested against textbook answers and an independent reference implementation; tie-break rules are stated on each page.

Three kinds of automated checks back this up. A set of hand-verified examples must match exactly, including the classic textbook cases and the tricky ones. Thousands of random inputs are run through both the simulator and a separate, deliberately different reference implementation, and the two must agree on every result. And general rules are checked on every run, such as never running a process before it arrives, never leaving the CPU idle while something is ready, and never letting Optimal page replacement fault more often than any other algorithm.

Where textbooks disagree, the page says which rule is in use and, where it changes the answer, lets you switch it. Two examples: who joins the Round Robin queue first when an arrival and the end of a slice happen together, and whether a page loaded by the Clock algorithm starts with its reference bit set.

#### Privacy

Trace has no accounts, no ads and no cookies. Everything you type stays in your browser: the simulations run on your device and nothing you enter is sent anywhere. A share link puts your inputs in the address itself, so anyone you send it to can see them; it contains nothing else.

To know which pages are useful, Trace counts page views with a privacy-friendly analytics service that sets no cookies and does not follow you across sites. The only thing Trace stores on your device is your light or dark theme choice, if you change it.

#### Report a mistake

If you find an answer or an explanation you believe is wrong, please write. A link from "Copy link" is the quickest way to show exactly what you saw, and a note on what you expected and where that comes from helps a lot. Corrections are welcome and will be fixed.

Email: abdul at abmans dot com

#### Disclaimer

Trace is an independent educational project. It is not affiliated with or endorsed by any school, company or publisher.

Trace is built by [Abdul Rehman](https://abmans.com). The [source code](https://github.com/Abdul-Rehman127/trace) is open under the MIT license.

---

## Page: /404.html

- Title: Page not found | Trace
- Description (34 characters): This page does not exist on Trace.

### H1: Page not found

There is nothing at this address. It may have moved, or the link may have a typo.

- [Trace home: Every simulator in one list](/)

- [CPU scheduling simulator: FCFS, SJF, SRTF, Priority and Round Robin](/operating-systems/cpu-scheduling/)

- [Page replacement simulator: FIFO, LRU, Optimal and Clock](/memory/page-replacement/)

---

## Interface copy (simulator pages)

## Processes

| Name | Arrival | Burst | Priority | Remove |

Add process

Time quantumLength of each slice

Ties at the same momentA process that arrives just as a slice ends joins the queue before the preempted process.
New arrival first / Preempted first

Classic example
Idle gap
Heavy load
Tie trap

Copy link

Copy this link

0.5x
1x
2x
4x

1x
time0of 0

0

Why this happened

**P1** is next in line, so it runs for up to 2 units.

**P1** used its 2-unit slice and goes to the back of the queue. **P3** arrives at the same moment. New arrivals join first, so it is ahead of **P1**. **P2** is next in line, so it runs for up to 2 units.

**P2** used its 2-unit slice and goes to the back of the queue. **P3** is next in line and needs only 1 unit, so it can finish within its 2-unit slice.

**P4** used its 2-unit slice and goes to the back of the queue. **P2** is next in line and needs only 1 unit, so it can finish within its 2-unit slice.

**P1** used its 2-unit slice and goes to the back of the queue. **P4** is next in line, so it runs for up to 2 units.

**P1** finishes at time 11. **P4** is next in line and needs only 2 units, so it can finish within its 2-unit slice.

**P2** finishes at time 10. **P1** is next in line and needs only 1 unit, so it can finish within its 2-unit slice.

Ready queue, next in line first

Decision log

Every moment something was decided. Choose a line to move the playhead there.

Keyboard shortcuts

SpacePlay or pause
Left RightStep back or forward one unit
Home EndJump to the start or the end
RReset
[ ]Slower or faster
TSwitch light or dark theme

Shortcuts are off while you type in a field.

## Results

| Process | Arrival | Burst | Finished | Turnaround | Waiting | Response |

| Average | | | | | | |

Turnaround is `finished - arrival`. Waiting is `turnaround - burst`. Response is `first run - arrival`. CPU utilization is `total burst / last finish`.

PreemptiveThe running process always finishes first.

Highest priority1 is the highest priority.
Lowest number / Highest number

### Messages produced by scripts

- Field errors: "Arrival for P2 must be a whole number from 0 to 99." / "Burst for P2 must be a whole number from 1 to 99." / "Priority for P2 must be a whole number from 1 to 99." / "Quantum must be a whole number from 1 to 99."
- Add process limit: "Trace supports up to 8 processes, one color each."
- Option hints: "A process that arrives just as a slice ends joins the queue before the preempted process." / "The preempted process rejoins the queue before a process that arrives at the same moment." / "A better priority arrival interrupts the running process." / "The running process always finishes first." / "1 is the highest priority." / "99 is the highest priority."
- Toasts: "Link copied", "Speed 2x", and share-link notices such as "The quantum in this link was ignored. Quantum must be a whole number from 1 to 99." and "P2 and P3 in this link could not be read, so they were left out."
- Narration: the full sentence list is in the Checkpoint B report; it is generated by src/js/engine/narrate.mjs.
- Compare note: "Round Robin uses a quantum of 3. Priority is non-preemptive, and a lower number means a higher priority. Ties follow the rules on each algorithm's page."

---

## Needs verification

Items 1 to 10 from Checkpoint C were reviewed by Chat and accepted, with four wording edits that are now applied (SJF "often estimate", SRTF tie sentence removed, SJF mistake 3 rewritten, Round Robin "One moment where sources differ"). What remains open:

1. **Analytics and cookies** (About, privacy): "a privacy-friendly analytics service that sets no cookies and does not follow you across sites". Cloudflare's documentation says (quotes at Checkpoint D) that Web Analytics uses no client-side state and does not fingerprint visitors. To confirm on the live site.
2. **"Nothing you enter is sent anywhere"** (About, privacy): the beacon sends `landingPath` ("The landing page URL") and `referrer` ("The referring page URL"). Cloudflare's page does not say whether query strings are kept. If they are, a visitor who opens a share link sends its process numbers to the analytics service. To check at Checkpoint D in the browser's network panel on the live site.
3. **Testing claim** (About, accuracy): "Three kinds of automated checks back this up." Now also true at deploy time: the Cloudflare build command runs the fast tests before building, so a failing test stops a deploy.
