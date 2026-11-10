// Circuit from an expression tree: one gate per operator, one input terminal per variable
// occurrence, columns by depth from the inputs, rows by leaf order, orthogonal wires.
// Also the propagation levels for the animation. Pure, no DOM.
import { evaluate, OPS } from './expr.mjs';

export const COL_W = 110;
export const ROW_H = 46;
export const PAD = 24;
export const GATE_W = 56;
export const GATE_H = 36;

/**
 * Lay out a circuit. Returns { nodes, wires, width, height, depth } where nodes are inputs
 * ({ kind: 'input', name }), constants ({ kind: 'const', v }) and gates ({ kind: 'gate', op })
 * each with { id, x, y, level, inputs: [ids] }, and the root is the last node.
 */
export function layoutCircuit(ast) {
  const nodes = [];
  let leaf = 0;
  let gateNo = 0;
  function build(n) {
    if (n.t === 'var' || n.t === 'const') {
      const node = n.t === 'var' ? { kind: 'input', name: n.name } : { kind: 'const', v: n.v };
      Object.assign(node, { id: nodes.length, level: 0, row: leaf++, inputs: [] });
      nodes.push(node);
      return node;
    }
    const kids = n.t === 'not' ? [build(n.a)] : [build(n.a), build(n.b)];
    const node = {
      kind: 'gate',
      op: n.t === 'not' ? 'NOT' : n.op,
      id: nodes.length,
      name: `G${++gateNo}`,
      level: Math.max(...kids.map((k) => k.level)) + 1,
      row: kids.reduce((s, k) => s + k.row, 0) / kids.length,
      inputs: kids.map((k) => k.id),
    };
    nodes.push(node);
    return node;
  }
  const root = build(ast);
  const depth = root.level;
  for (const node of nodes) {
    node.x = PAD + node.level * COL_W;
    node.y = PAD + node.row * ROW_H + GATE_H / 2;
  }
  const outX = PAD + depth * COL_W + GATE_W + 40;
  const wires = [];
  for (const node of nodes) {
    node.inputs.forEach((from, pin) => {
      const src = nodes[from];
      const pins = node.inputs.length;
      const toY = pins === 1 ? node.y : node.y - GATE_H / 4 + (pin * GATE_H) / 2;
      const fromX = src.kind === 'gate' ? src.x + GATE_W : src.x + 28;
      const toX = node.x;
      const midX = Math.round((fromX + toX) / 2);
      wires.push({ from, to: node.id, pin, d: `M${fromX} ${src.y}H${midX}V${toY}H${toX}` });
    });
  }
  wires.push({ from: root.id, to: null, pin: 0, d: `M${root.kind === 'gate' ? root.x + GATE_W : root.x + 28} ${root.y}H${outX - 8}` });
  return { nodes, wires, root: root.id, depth, width: outX + 40, height: PAD * 2 + leaf * ROW_H, outX };
}

/** Every node's value for an assignment. */
export function circuitValues(layout, env) {
  const vals = [];
  for (const node of layout.nodes) {
    if (node.kind === 'input') vals.push(!!env[node.name]);
    else if (node.kind === 'const') vals.push(node.v);
    else if (node.op === 'NOT') vals.push(!vals[node.inputs[0]]);
    else vals.push(OPS[node.op](vals[node.inputs[0]], vals[node.inputs[1]]));
  }
  return vals;
}

/** The gates at each level (1..depth), for stepping a change through the circuit. */
export function levels(layout) {
  const out = Array.from({ length: layout.depth + 1 }, () => []);
  for (const node of layout.nodes) if (node.kind === 'gate') out[node.level].push(node.id);
  return out;
}

/** The gate list as text: "G3 = G1 OR C". */
export function gateList(layout) {
  const label = (id) => {
    const n = layout.nodes[id];
    return n.kind === 'gate' ? n.name : n.kind === 'input' ? n.name : n.v ? '1' : '0';
  };
  return layout.nodes
    .filter((n) => n.kind === 'gate')
    .map((n) => (n.op === 'NOT' ? `${n.name} = NOT ${label(n.inputs[0])}` : `${n.name} = ${label(n.inputs[0])} ${n.op} ${label(n.inputs[1])}`));
}

/** Same result as evaluating the expression directly (used by the tests). */
export const circuitOutput = (layout, env) => circuitValues(layout, env)[layout.root];
export { evaluate };
