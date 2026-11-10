// Narration for the circuit: what happens at each level of gates after an input changes.
// Pure, no DOM. Sentences are arrays of strings and { pid } parts (bold), as elsewhere.

const B = (v) => (v ? '1' : '0');
const name = (layout, id) => {
  const n = layout.nodes[id];
  return n.kind === 'gate' ? n.name : n.kind === 'input' ? n.name : B(n.v);
};

/**
 * @param layout     from layoutCircuit
 * @param before     node values before the change
 * @param after      node values after the change
 * @param k          level 0 (the inputs) to layout.depth
 * @param changed    the input variable that was switched, or null on first load
 */
export function narrateLevel(layout, before, after, k, changed) {
  if (k === 0) {
    if (!changed) return [['Switch an input to send a change through the circuit.']];
    const id = layout.nodes.find((n) => n.kind === 'input' && n.name === changed)?.id;
    const now = id === undefined ? null : after[id];
    return [['Input ', { pid: changed }, ` changes from ${B(!now)} to ${B(now)}. Each gate it feeds will see the new value one level at a time.`]];
  }
  const gates = layout.nodes.filter((n) => n.kind === 'gate' && n.level === k);
  const moved = gates.filter((g) => before[g.id] !== after[g.id]);
  const out = [];
  for (const g of moved) {
    const ins = g.inputs.map((i) => `${name(layout, i)} = ${B(after[i])}`).join(' and ');
    out.push([{ pid: g.name }, ` (${g.op}) now gets ${ins}, so its output changes from ${B(before[g.id])} to ${B(after[g.id])}.`]);
  }
  if (!moved.length) out.push([`No gate at level ${k} changes its output, so the change stops before this level.`]);
  if (k === layout.depth) out.push([`The output Q is ${B(after[layout.root])}${before[layout.root] !== after[layout.root] ? `, changed from ${B(before[layout.root])}` : ', unchanged'}.`]);
  return out;
}

/** The table of every gate's inputs and output for the current input values. */
export function gateRows(layout, vals) {
  return layout.nodes
    .filter((n) => n.kind === 'gate')
    .map((g) => ({ name: g.name, op: g.op, ins: g.inputs.map((i) => `${name(layout, i)} = ${B(vals[i])}`).join(', '), out: B(vals[g.id]) }));
}
