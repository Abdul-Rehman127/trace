---

## Needs verification

Claims in the copy that I am not 100 percent sure of, or that depend on how a source is read. Everything else is either a definition, a number computed by the engine at build time, or a rule of Trace itself.

### Facts about scheduling

1. **SJF optimality** (SJF page, "How it works" and "Strengths"): "When all the processes are ready at the same moment, running them shortest first gives the lowest possible average waiting time of any order." I am confident this is the standard result for non-preemptive scheduling of jobs available at time 0, but please confirm the wording does not overreach.
2. **SRTF optimality** (SRTF page; overview table; compare page "usually has the lowest"): "With known burst lengths and free switching, SRTF gives the lowest average waiting time of any schedule for the same processes." This is the shortest-remaining-processing-time result for one processor. Please confirm it may be stated for waiting time (it follows from turnaround, since the bursts are fixed).
3. **Burst prediction** (SJF page): "Textbook treatments usually predict the next burst of a process from the lengths of its previous bursts, for example with an exponential average." Standard in the textbooks I know of; "usually" may be too strong.
4. **SRTF tie rule in textbooks** (SRTF page): "Ties need a rule, and textbooks do not all state one." I believe many sources are silent on equal remaining time; I could not check this across sources.
5. **SJF tie wording** (SJF page, mistake 3): "Some textbooks use FCFS order for ties, which is the same thing." Equal bursts broken by FCFS order means earlier arrival first, which is Trace's rule; please confirm the phrasing is fair.
6. **Priority conventions** (Priority page): "What counts as best is a convention, and it differs between textbooks and systems" and "Many exercises use 1 as the highest priority, but not all of them do." Both are my understanding, not checked against a survey of sources.
7. **SJF as a special case of Priority** (Priority page): "If you use the burst length as the priority, non-preemptive Priority becomes Shortest Job First." With Trace's tie rules (earlier arrival, then lower number) the two produce identical schedules; this is the standard textbook remark.
8. **Round Robin tie disagreement** (Round Robin page): "The one moment textbooks disagree on is a new arrival at the exact instant a slice ends." Taken from the brief; "the one moment" may be too absolute.
9. **Round Robin response time** (Round Robin page and compare page): "every process gets the CPU within a bounded time after arriving" (at most (n - 1) x quantum after it reaches the queue) and "Round Robin often has the best response time". "Often" is deliberate; it is not always the lowest.
10. **Context switch cost** (several pages): statements that each switch "costs time in a real system" are general and safe. I made no claims about specific real operating systems.

### Privacy and accuracy statements (About page)

11. **Analytics** (About, privacy): "a privacy-friendly analytics service that sets no cookies and does not follow you across sites". This describes Cloudflare Web Analytics as I understand it. Please verify against Cloudflare's current documentation before launch. The service is deliberately not named, per the brief's rule on naming companies.
12. **"Nothing you enter is sent anywhere"** (About, privacy): true for the simulator itself. Open question: if the analytics beacon records the full page URL including the query string, then opening a share link would send its process numbers to the analytics service. I do not know whether it records query strings. If it does, the options are to reword this sentence or to keep inputs out of the query (for example in the hash), which would change a locked decision. To settle at Checkpoint D.
13. **Testing claim** (About, accuracy): "Thousands of random inputs are run through both the simulator and a separate, deliberately different reference scheduler". True (22,500 per run of `npm test`), but the tests are not run automatically by the Cloudflare build. The sentence says "automated checks back this up", not that they gate each deploy.
