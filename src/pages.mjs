// Page metadata. The build generates one static HTML page per entry.
// Each section adds its entries here; `section` groups them for the build.

export const SITE = {
  name: 'Trace',
  origin: 'https://trace.abmans.com',
  author: { name: 'Abdul Rehman', url: 'https://abmans.com', id: 'https://abmans.com/#person' },
};

const CPU = '/operating-systems/cpu-scheduling/';
const PR = '/memory/page-replacement/';
const NET = '/networking/';
const LG = '/logic/';
const AI = '/ai/';

/** Breadcrumb trail for a CPU scheduling page (home is implied). */
const cpuCrumbs = (last) => {
  const trail = [
    { name: 'Operating systems', path: '/#operating-systems' },
    { name: 'CPU scheduling', path: CPU },
  ];
  if (last) trail.push(last);
  return trail;
};

/** Breadcrumb trail for a page replacement page. */
const prCrumbs = (last) => {
  const trail = [
    { name: 'Memory', path: '/#memory' },
    { name: 'Page replacement', path: PR },
  ];
  if (last) trail.push(last);
  return trail;
};

/** Breadcrumb trail for a networking page. */
const netCrumbs = (last) => [{ name: 'Networking', path: '/#networking' }, last];

/** Breadcrumb trail for a logic page. */
const lgCrumbs = (last) => [{ name: 'Logic', path: '/#logic' }, last];

/** Breadcrumb trail for an AI page. */
const aiCrumbs = (last) => [{ name: 'AI', path: '/#ai' }, last];

export const PAGES = [
  {
    slug: '/',
    template: 'hub',
    title: 'Trace: step-by-step simulators for how computers decide',
    description:
      'Step-by-step simulators that show how computers decide: which process runs, which page leaves memory. Press play and read why. Free, no signup.',
    h1: 'Watch computers decide',
    key: 'home',
    lede: '',
    breadcrumb: [],
  },
  {
    slug: CPU,
    template: 'tool',
    title: 'CPU Scheduling Simulator with Gantt Chart | Trace',
    description:
      'Enter your processes, pick FCFS, SJF, SRTF, Priority or Round Robin, press play, and see why each process runs when it does. Free, no signup.',
    h1: 'CPU scheduling simulator',
    key: 'overview',
    lede: 'Pick an algorithm, enter your processes and press play. Every scheduling decision comes with the reason for it.',
    breadcrumb: cpuCrumbs(null),
    algorithm: 'fcfs',
    selectable: true,
  },
  {
    slug: `${CPU}fcfs/`,
    template: 'tool',
    title: 'FCFS Scheduling Simulator with Gantt Chart | Trace',
    description:
      'Enter your processes, press play, and watch First Come First Served run them in arrival order, with waiting and turnaround times. Free, no signup.',
    h1: 'First Come First Served scheduling',
    key: 'fcfs',
    lede: 'The CPU runs processes in the order they arrive, each one to the end. Press play and watch every decision.',
    breadcrumb: cpuCrumbs({ name: 'FCFS', path: `${CPU}fcfs/` }),
    algorithm: 'fcfs',
  },
  {
    slug: `${CPU}sjf/`,
    template: 'tool',
    title: 'SJF Scheduling Simulator with Gantt Chart | Trace',
    description:
      'Enter your processes, press play, and see Shortest Job First pick the smallest burst each time the CPU frees up, with every step explained. Free.',
    h1: 'Shortest Job First scheduling',
    key: 'sjf',
    lede: 'Whenever the CPU frees up, the shortest waiting job goes next and runs to the end. Press play and watch every decision.',
    breadcrumb: cpuCrumbs({ name: 'SJF', path: `${CPU}sjf/` }),
    algorithm: 'sjf',
  },
  {
    slug: `${CPU}srtf/`,
    template: 'tool',
    title: 'SRTF Scheduling Simulator with Gantt Chart | Trace',
    description:
      'Enter your processes, press play, and see Shortest Remaining Time First preempt when a shorter job arrives, with each decision explained. Free.',
    h1: 'Shortest Remaining Time First scheduling',
    key: 'srtf',
    lede: 'At every moment the process with the least time left runs, even if that means interrupting another. Press play and watch every decision.',
    breadcrumb: cpuCrumbs({ name: 'SRTF', path: `${CPU}srtf/` }),
    algorithm: 'srtf',
  },
  {
    slug: `${CPU}priority/`,
    template: 'tool',
    title: 'Priority Scheduling Simulator with Gantt Chart | Trace',
    description:
      'Enter processes with priorities, choose preemptive or not, press play, and see why each one gets the CPU when it does. Free, no signup needed.',
    h1: 'Priority scheduling',
    key: 'priority',
    lede: 'The most important ready process runs first. You choose whether a new arrival can interrupt. Press play and watch every decision.',
    breadcrumb: cpuCrumbs({ name: 'Priority', path: `${CPU}priority/` }),
    algorithm: 'priority',
  },
  {
    slug: `${CPU}round-robin/`,
    template: 'tool',
    title: 'Round Robin Scheduling Simulator with Gantt Chart | Trace',
    description:
      'Set a time quantum, enter your processes, press play, and watch Round Robin rotate the ready queue, with every slice explained. Free, no signup.',
    h1: 'Round Robin scheduling',
    key: 'rr',
    lede: 'Each process gets the CPU for a fixed slice, then goes to the back of the line. Press play and watch every decision.',
    breadcrumb: cpuCrumbs({ name: 'Round Robin', path: `${CPU}round-robin/` }),
    algorithm: 'rr',
  },
  {
    slug: `${CPU}compare/`,
    template: 'compare',
    title: 'Compare CPU Scheduling Algorithms | Trace',
    description:
      'Run FCFS, SJF, SRTF, Priority and Round Robin on the same processes and compare average waiting, turnaround and response times. Free, no signup.',
    h1: 'Compare scheduling algorithms',
    key: 'compare',
    lede: 'Run all five algorithms on the same processes and compare their averages side by side.',
    breadcrumb: cpuCrumbs({ name: 'Compare', path: `${CPU}compare/` }),
    algorithm: 'compare',
  },
  {
    slug: PR,
    template: 'paging',
    section: 'memory',
    title: 'Page Replacement Simulator: FIFO, LRU, Optimal, Clock | Trace',
    description:
      'Enter a reference string and a frame count, pick FIFO, LRU, Optimal or Clock, press play, and see every page fault and why it happened. Free.',
    h1: 'Page replacement simulator',
    key: 'memory/overview',
    lede: 'Pick an algorithm, enter the pages a program asks for, and press play. Every hit, fault and eviction comes with the reason for it.',
    breadcrumb: prCrumbs(null),
    algorithm: 'fifo',
    selectable: true,
  },
  {
    slug: `${PR}fifo/`,
    template: 'paging',
    section: 'memory',
    title: 'FIFO Page Replacement Simulator, Step by Step | Trace',
    description:
      'Enter a reference string, press play, and watch FIFO evict the page that came in first, with frames, faults and every eviction explained. Free.',
    h1: 'FIFO page replacement',
    key: 'memory/fifo',
    lede: 'When memory is full, the page that has been there longest goes. Press play and watch every hit and fault.',
    breadcrumb: prCrumbs({ name: 'FIFO', path: `${PR}fifo/` }),
    algorithm: 'fifo',
  },
  {
    slug: `${PR}lru/`,
    template: 'paging',
    section: 'memory',
    title: 'LRU Page Replacement Simulator, Step by Step | Trace',
    description:
      'Enter a reference string, press play, and watch Least Recently Used evict the page unused for longest, with every fault and hit explained. Free.',
    h1: 'LRU page replacement',
    key: 'memory/lru',
    lede: 'When memory is full, the page that has gone unused the longest goes. Press play and watch every hit and fault.',
    breadcrumb: prCrumbs({ name: 'LRU', path: `${PR}lru/` }),
    algorithm: 'lru',
  },
  {
    slug: `${PR}optimal/`,
    template: 'paging',
    section: 'memory',
    title: 'Optimal Page Replacement Simulator, Step by Step | Trace',
    description:
      'Enter a reference string, press play, and watch Optimal (MIN) evict the page needed furthest in the future, with each choice explained. Free.',
    h1: 'Optimal page replacement',
    key: 'memory/opt',
    lede: 'When memory is full, the page needed furthest in the future goes. It needs to know the future, so it is a yardstick. Press play and watch.',
    breadcrumb: prCrumbs({ name: 'Optimal', path: `${PR}optimal/` }),
    algorithm: 'opt',
  },
  {
    slug: `${PR}clock/`,
    template: 'paging',
    section: 'memory',
    title: 'Clock Page Replacement Simulator (Second Chance) | Trace',
    description:
      'Enter a reference string, press play, and watch the Clock pointer sweep the frames, clear reference bits and pick a victim, step by step. Free.',
    h1: 'Clock page replacement',
    key: 'memory/clock',
    lede: 'A pointer sweeps the frames. A page with its reference bit set gets a second chance; the first page without one goes. Press play and watch.',
    breadcrumb: prCrumbs({ name: 'Clock', path: `${PR}clock/` }),
    algorithm: 'clock',
  },
  {
    slug: `${PR}compare/`,
    template: 'paging-compare',
    section: 'memory',
    title: 'Compare Page Replacement Algorithms | Trace',
    description:
      'Run FIFO, LRU, Optimal and Clock on the same reference string and compare page faults, hit rates and how faults change with more frames. Free.',
    h1: 'Compare page replacement algorithms',
    key: 'memory/compare',
    lede: 'Run all four algorithms on the same pages and compare their faults side by side.',
    breadcrumb: prCrumbs({ name: 'Compare', path: `${PR}compare/` }),
    algorithm: 'compare',
  },
  {
    slug: `${NET}subnet-calculator/`,
    template: 'net-subnet',
    section: 'networking',
    tool: 'subnet',
    title: 'IPv4 Subnet Calculator with Binary View | Trace',
    description:
      'Enter an IPv4 address with a prefix or mask and see the network, broadcast, usable host range and mask, with every bit labelled in binary. Free.',
    h1: 'IPv4 subnet calculator',
    key: 'networking/subnet',
    lede: 'Enter an address with a prefix or a mask. Every value updates as you type, and the binary view shows which bits are network and which are host.',
    breadcrumb: netCrumbs({ name: 'Subnet calculator', path: `${NET}subnet-calculator/` }),
  },
  {
    slug: `${NET}subnetting-practice/`,
    template: 'net-practice',
    section: 'networking',
    tool: 'practice',
    title: 'Subnetting Practice Questions with Solutions | Trace',
    description:
      'Generated subnetting questions at three levels: network, broadcast, host range, masks and more. Check your answer and see the steps. Free, no signup.',
    h1: 'Subnetting practice',
    key: 'networking/practice',
    lede: 'Answer a generated question, check it, and read the worked steps. Every question has its own link, so you can share the exact one.',
    breadcrumb: netCrumbs({ name: 'Practice', path: `${NET}subnetting-practice/` }),
  },
  {
    slug: `${NET}vlsm-calculator/`,
    template: 'net-vlsm',
    section: 'networking',
    tool: 'vlsm',
    title: 'VLSM Calculator and Subnet Planner | Trace',
    description:
      'Enter a network and the hosts each subnet needs. The planner allocates largest first, shows every range and spare space, and says when it will not fit.',
    h1: 'VLSM subnet planner',
    key: 'networking/vlsm',
    lede: 'Enter a network and how many hosts each subnet needs. The plan gives each one the smallest block that fits, largest first.',
    breadcrumb: netCrumbs({ name: 'VLSM', path: `${NET}vlsm-calculator/` }),
  },
  {
    slug: `${NET}tcp-handshake/`,
    template: 'net-tcp',
    section: 'networking',
    tool: 'tcp',
    title: 'TCP Three-Way Handshake and Teardown Simulator | Trace',
    description:
      'Watch a TCP connection open and close step by step: SYN, SYN-ACK, ACK, FIN, every state, and the sequence and acknowledgement numbers. Free.',
    h1: 'TCP handshake and teardown',
    key: 'networking/tcp',
    lede: 'Press play and watch a connection open, carry data and close, with the state of each side and every sequence number explained.',
    breadcrumb: netCrumbs({ name: 'TCP handshake', path: `${NET}tcp-handshake/` }),
  },
  {
    slug: `${LG}truth-table/`,
    template: 'lg-table',
    section: 'logic',
    tool: 'table',
    title: 'Truth Table Generator for Boolean Expressions | Trace',
    description:
      'Type a Boolean expression with AND, OR, NOT, XOR, NAND, NOR or XNOR and get its full truth table, every subexpression, and its canonical forms. Free.',
    h1: 'Truth table generator',
    key: 'logic/table',
    lede: 'Type an expression and get its truth table as you type, with a column for every part of the expression.',
    breadcrumb: lgCrumbs({ name: 'Truth table', path: `${LG}truth-table/` }),
  },
  {
    slug: `${LG}circuit/`,
    template: 'lg-circuit',
    section: 'logic',
    tool: 'circuit',
    title: 'Logic Circuit Simulator from a Boolean Expression | Trace',
    description:
      'Type a Boolean expression and get its logic gate circuit. Switch the inputs and watch each change travel gate by gate, with every step explained. Free.',
    h1: 'Logic circuit simulator',
    key: 'logic/circuit',
    lede: 'Type an expression to draw its circuit, then switch an input and watch the change travel through the gates one level at a time.',
    breadcrumb: lgCrumbs({ name: 'Circuit', path: `${LG}circuit/` }),
  },
  {
    slug: `${LG}simplifier/`,
    template: 'lg-table',
    section: 'logic',
    tool: 'simplify',
    title: 'Boolean Simplifier with K-Map and Quine-McCluskey | Trace',
    description:
      'Simplify a Boolean expression or a list of minterms. See every minimal sum of products, the Karnaugh map groups and the Quine-McCluskey steps. Free.',
    h1: 'Boolean expression simplifier',
    key: 'logic/simplify',
    lede: 'Enter an expression or minterms and get every shortest sum of products, the product of sums, the Karnaugh map and the steps.',
    breadcrumb: lgCrumbs({ name: 'Simplifier', path: `${LG}simplifier/` }),
  },
  {
    slug: `${LG}equivalence/`,
    template: 'lg-table',
    section: 'logic',
    tool: 'equiv',
    title: 'Boolean Expression Equivalence Checker | Trace',
    description:
      'Check whether two Boolean expressions are equivalent. If they are not, see the first input row where they give different outputs. Free, no signup.',
    h1: 'Boolean equivalence checker',
    key: 'logic/equiv',
    lede: 'Type two expressions. Trace compares them on every row and shows the first row where they differ.',
    breadcrumb: lgCrumbs({ name: 'Equivalence', path: `${LG}equivalence/` }),
  },
  {
    slug: `${AI}game-tree/`,
    template: 'ai-tree',
    section: 'ai',
    tool: 'tree',
    title: 'Minimax and Alpha-Beta Game Tree Explorer | Trace',
    description:
      'Step through minimax and alpha-beta on Tic-tac-toe: the position being searched, every value, the branches cut and a live count of positions examined. Free.',
    h1: 'Game tree explorer',
    key: 'ai/tree',
    lede: 'Pick a Tic-tac-toe position and step through minimax or alpha-beta: every position examined, every value, every branch cut.',
    breadcrumb: aiCrumbs({ name: 'Game tree', path: `${AI}game-tree/` }),
  },
  {
    slug: `${AI}connect-four/`,
    template: 'ai-arena',
    section: 'ai',
    tool: 'arena',
    title: 'Connect Four AI Arena: Minimax, Alpha-Beta, MCTS | Trace',
    description:
      'Watch random, greedy, minimax, alpha-beta and Monte Carlo tree search agents play Connect Four, with every move explained. Play one yourself. Free.',
    h1: 'Connect Four AI arena',
    key: 'ai/arena',
    lede: 'Choose two agents and a seed and watch them play, with the reason for every move. Or play against one yourself.',
    breadcrumb: aiCrumbs({ name: 'Connect Four', path: `${AI}connect-four/` }),
  },
  {
    slug: `${AI}compare/`,
    template: 'ai-compare',
    section: 'ai',
    tool: 'compare',
    title: 'Compare Game AI Agents on One Position | Trace',
    description:
      'Give one Connect Four position to random, greedy, minimax, alpha-beta and MCTS agents and compare their moves, times and how much work each one did. Free.',
    h1: 'Compare game AI agents',
    key: 'ai/compare',
    lede: 'Give one position to every agent and see what each one chooses, how long it takes and how much it looks at.',
    breadcrumb: aiCrumbs({ name: 'Compare agents', path: `${AI}compare/` }),
  },
  {
    slug: '/about/',
    template: 'about',
    title: 'About Trace and privacy',
    description:
      'What Trace is, how every simulator is checked for accuracy, what happens to the data you type (nothing leaves your browser), and how to report a mistake.',
    h1: 'About Trace',
    key: 'about',
    lede: '',
    breadcrumb: [{ name: 'About', path: '/about/' }],
  },
  {
    slug: '/404.html',
    template: 'notfound',
    title: 'Page not found | Trace',
    description: 'This page does not exist on Trace.',
    h1: 'Page not found',
    key: 'notfound',
    lede: 'This page does not exist. The simulators are listed on the home page.',
    breadcrumb: [],
    noindex: true,
  },
];
