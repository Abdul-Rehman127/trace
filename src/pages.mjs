// Page metadata. The build generates one static HTML page per entry.
// Later sections (page replacement, disk scheduling, ...) add entries here.

export const SITE = {
  name: 'Trace',
  origin: 'https://trace.abmans.com',
  author: { name: 'Abdul Rehman', url: 'https://abmans.com' },
};

const CPU = '/operating-systems/cpu-scheduling/';

/** Breadcrumb trail for a CPU scheduling page (home is implied). */
const cpuCrumbs = (last) => {
  const trail = [
    { name: 'Operating systems', path: '/#operating-systems' },
    { name: 'CPU scheduling', path: CPU },
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
      'Step-by-step simulators that show how computers decide what runs next. Press play, watch every decision, and read why it happened. Free, no signup.',
    h1: 'Watch computers decide',
    breadcrumb: [],
  },
  {
    slug: CPU,
    template: 'tool',
    title: 'CPU Scheduling Simulator with Gantt Chart | Trace',
    description:
      'Enter your processes, pick FCFS, SJF, SRTF, Priority or Round Robin, press play, and see why each process runs when it does. Free, no signup.',
    h1: 'CPU scheduling simulator',
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
    breadcrumb: cpuCrumbs({ name: 'Round Robin', path: `${CPU}round-robin/` }),
    algorithm: 'rr',
  },
  {
    slug: `${CPU}compare/`,
    template: 'tool',
    title: 'Compare CPU Scheduling Algorithms | Trace',
    description:
      'Run FCFS, SJF, SRTF, Priority and Round Robin on the same processes and compare average waiting, turnaround and response times. Free, no signup.',
    h1: 'Compare scheduling algorithms',
    breadcrumb: cpuCrumbs({ name: 'Compare', path: `${CPU}compare/` }),
    algorithm: 'compare',
  },
  {
    slug: '/about/',
    template: 'about',
    title: 'About Trace and privacy',
    description:
      'What Trace is, how every simulator is checked for accuracy, what happens to the data you type (nothing leaves your browser), and how to report a mistake.',
    h1: 'About Trace',
    breadcrumb: [{ name: 'About', path: '/about/' }],
  },
  {
    slug: '/404.html',
    template: 'notfound',
    title: 'Page not found | Trace',
    description: 'This page does not exist on Trace.',
    h1: 'Page not found',
    breadcrumb: [],
    noindex: true,
  },
];
