// Page metadata. The build generates one static HTML page per entry.
// Each section adds its entries here; `section` groups them for the build.

export const SITE = {
  name: 'Trace',
  origin: 'https://trace.abmans.com',
  author: { name: 'Abdul Rehman', url: 'https://abmans.com' },
};

const CPU = '/operating-systems/cpu-scheduling/';
const PR = '/memory/page-replacement/';

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
