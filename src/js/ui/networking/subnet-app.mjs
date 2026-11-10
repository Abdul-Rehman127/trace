// Subnet calculator: results update as the visitor types.
import { parseCidr, subnetInfo } from '../../engine/networking/ipv4.mjs';
import { subnetRowsTree, subnetNotesTree, binaryTree } from '../../engine/networking/views.mjs';
import { encodeSubnet, decodeSubnet } from '../../engine/networking/share.mjs';
import { fromTree, createToast, bindCopy, autoGrow, fieldError, replaceQuery } from '../dom.mjs';

const DEFAULT = '192.168.1.130/26';

export function mountSubnet(root) {
  const field = root.querySelector('[data-net-cidr]');
  const err = root.querySelector('#net-cidr-err');
  const rows = root.querySelector('[data-net-rows]');
  const bits = root.querySelector('[data-net-bits]');
  const notes = root.querySelector('[data-net-notes]');
  const toast = createToast(root.querySelector('[data-toast]'));
  const decoded = decodeSubnet(window.location.search, DEFAULT);
  const grow = autoGrow(field);
  let current = decoded.cidr;
  let urlTimer = 0;

  function render(text, { fromUser }) {
    const p = parseCidr(text);
    fieldError(field, err, p.error);
    if (p.error) return;
    current = text.trim();
    const info = subnetInfo(p.address, p.prefix);
    rows.replaceChildren(...subnetRowsTree(info).map((n) => fromTree(n)));
    bits.replaceChildren(fromTree(binaryTree(info)));
    notes.replaceChildren(...subnetNotesTree(info).map((n) => fromTree(n)));
    if (fromUser) {
      clearTimeout(urlTimer);
      urlTimer = setTimeout(() => replaceQuery(encodeSubnet(current)), 400);
    }
  }

  field.addEventListener('input', () => render(field.value, { fromUser: true }));
  for (const chip of root.querySelectorAll('[data-example]')) {
    chip.addEventListener('click', () => {
      field.value = chip.dataset.example;
      grow();
      render(field.value, { fromUser: true });
    });
  }
  bindCopy(root, () => `${window.location.origin}${window.location.pathname}?${encodeSubnet(current)}`, toast);

  if (decoded.found) {
    field.value = decoded.cidr;
    grow();
  }
  render(field.value, { fromUser: false });
  if (decoded.notices.length) toast(decoded.notices.join(' '), 7000);
  return { get current() {
    return current;
  } };
}
