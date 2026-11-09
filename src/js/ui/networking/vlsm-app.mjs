// VLSM planner: the plan updates as the visitor types.
import { parseCidr } from '../../engine/networking/ipv4.mjs';
import { planVlsm, parseNeeds } from '../../engine/networking/vlsm.mjs';
import { vlsmRowsTree, vlsmBarTree, vlsmSummary } from '../../engine/networking/views.mjs';
import { encodeVlsm, decodeVlsm } from '../../engine/networking/share.mjs';
import { fromTree, createToast, bindCopy, autoGrow, fieldError, replaceQuery } from '../dom.mjs';

const DEFAULTS = { net: '192.168.10.0/24', hosts: 'Sales 100, Office 50, Lab 25, Servers 10, Link 2' };

export function mountVlsm(root) {
  const netEl = root.querySelector('[data-vlsm-net]');
  const hostsEl = root.querySelector('[data-vlsm-hosts]');
  const netErr = root.querySelector('#vlsm-net-err');
  const hostsErr = root.querySelector('#vlsm-hosts-err');
  const rows = root.querySelector('[data-vlsm-rows]');
  const bar = root.querySelector('[data-vlsm-bar]');
  const summary = root.querySelector('[data-vlsm-summary]');
  const toast = createToast(root.querySelector('[data-toast]'));
  const decoded = decodeVlsm(window.location.search, DEFAULTS);
  const growNet = autoGrow(netEl);
  const growHosts = autoGrow(hostsEl);
  let current = { net: decoded.net, hosts: decoded.hosts };
  let plan = null;
  let urlTimer = 0;

  function render({ fromUser }) {
    const p = parseCidr(netEl.value);
    const n = parseNeeds(hostsEl.value);
    fieldError(netEl, netErr, p.error);
    fieldError(hostsEl, hostsErr, n.error);
    if (p.error || n.error) return;
    current = { net: netEl.value.trim(), hosts: hostsEl.value.trim() };
    plan = planVlsm({ address: p.address, prefix: p.prefix }, n.needs);
    rows.replaceChildren(...vlsmRowsTree(plan).map((x) => fromTree(x)));
    bar.replaceChildren(fromTree(vlsmBarTree(plan)));
    summary.textContent = vlsmSummary(plan);
    summary.classList.toggle('is-unfit', !!plan.unfit);
    if (fromUser) {
      clearTimeout(urlTimer);
      urlTimer = setTimeout(() => replaceQuery(encodeVlsm(current.net, current.hosts)), 400);
    }
  }

  netEl.addEventListener('input', () => render({ fromUser: true }));
  hostsEl.addEventListener('input', () => render({ fromUser: true }));
  for (const chip of root.querySelectorAll('[data-net][data-hosts]')) {
    chip.addEventListener('click', () => {
      netEl.value = chip.dataset.net;
      hostsEl.value = chip.dataset.hosts;
      growNet();
      growHosts();
      render({ fromUser: true });
    });
  }
  bindCopy(root, () => `${window.location.origin}${window.location.pathname}?${encodeVlsm(current.net, current.hosts)}`, toast);

  if (decoded.found) {
    netEl.value = decoded.net;
    hostsEl.value = decoded.hosts;
    growNet();
    growHosts();
  }
  render({ fromUser: false });
  if (decoded.notices.length) toast(decoded.notices.join(' '), 7000);
  return { get plan() {
    return plan;
  } };
}
