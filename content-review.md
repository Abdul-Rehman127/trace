# Trace: content review

The full text of every page, extracted from the built HTML. Interactive parts of the simulator pages are replaced by a note; their interface copy is listed once at the end. Word counts cover the written content only (the article under the tool).

---

## Page: /

- Title: Trace: step-by-step simulators for how computers decide
- Description (147 characters): Step-by-step simulators that show how computers decide what runs next. Press play, watch every decision, and read why it happened. Free, no signup.

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

Next: page replacement, AI search, networking.

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

## Page: /about/

- Title: About Trace and privacy
- Description (153 characters): What Trace is, how every simulator is checked for accuracy, what happens to the data you type (nothing leaves your browser), and how to report a mistake.
- Written content: 437 words

### H1: About Trace

#### What Trace is

Trace is a free website of step-by-step simulators that show how computers make decisions. You enter your own inputs, press play, and watch each decision happen with a plain-English reason attached to the exact moment it was made. Every simulator page also explains the idea in writing, with a worked example you can open in the simulator.

The first section covers CPU scheduling in operating systems: First Come First Served, Shortest Job First, Shortest Remaining Time First, Priority and Round Robin, plus a page that compares them. More sections are planned: page replacement, AI search and networking.

#### Accuracy

Every algorithm is tested against textbook answers and an independent reference implementation; tie-break rules are stated on each page.

Three kinds of automated checks back this up. A set of hand-verified examples must match exactly, including the classic textbook cases and the tricky ones. Thousands of random inputs are run through both the simulator and a separate, deliberately different reference scheduler, and the two must agree on every schedule. And general rules are checked on every schedule, such as never running a process before it arrives and never leaving the CPU idle while something is ready.

Where textbooks disagree, for example on who joins the Round Robin queue first when an arrival and the end of a slice happen together, the page says which rule is in use and lets you switch it.

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
