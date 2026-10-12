import React, { useEffect, useMemo, useState } from "react";

function reconstruct(grammar, path) {
  if (!path?.length) return [];
  let id = 0;
  const node = symbol => ({ id: id++, symbol, children: [] });
  const root = node(grammar.start);
  let frontier = [root];
  const frames = [{ tree: structuredClone(root), active: [root.id], label: `Start at ${grammar.start}`, form: path[0] }];
  for (let k = 1; k < path.length; k++) {
    const before = path[k - 1], after = path[k];
    let match = null;
    for (let i = 0; i < before.length && !match; i++) {
      for (const prod of grammar.rules[before[i]] || []) {
        if (before.slice(0, i) + (prod === "ε" ? "" : prod) + before.slice(i + 1) === after) {
          match = { i, prod, variable: before[i] }; break;
        }
      }
    }
    if (!match) return frames;
    const target = frontier[match.i];
    if (!target || target.symbol !== match.variable) return frames;
    const children = [...(match.prod === "ε" ? "ε" : match.prod)].map(node);
    target.children = children;
    frontier.splice(match.i, 1, ...(match.prod === "ε" ? [] : children));
    frames.push({ tree: structuredClone(root), active: [target.id, ...children.map(n => n.id)], label: `${match.variable} → ${match.prod}`, form: after });
  }
  return frames;
}

function Tree({ root, active }) {
  const layout = useMemo(() => {
    let leaf = 0, maxDepth = 0;
    const nodes = [], edges = [];
    function walk(n, depth) {
      maxDepth = Math.max(depth, maxDepth);
      const positions = n.children.map(child => { const x = walk(child, depth + 1); edges.push([n.id, child.id]); return x; });
      const x = positions.length ? (positions[0] + positions.at(-1)) / 2 : 65 + leaf++ * 90;
      nodes.push({ ...n, x, y: 60 + depth * 100 });
      return x;
    }
    walk(root, 0);
    return { nodes, edges, width: Math.max(420, 140 + leaf * 90), height: 140 + maxDepth * 100 };
  }, [root]);
  const byId = Object.fromEntries(layout.nodes.map(n => [n.id, n]));
  return <div style={{ overflowX: "auto", background: "#0e1830", borderRadius: 14, border: "1px solid #3b4b77" }}>
    <svg width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} style={{ display: "block", margin: "auto" }} role="img" aria-label="CFG derivation tree">
      {layout.edges.map(([a, b]) => <line key={`${a}-${b}`} x1={byId[a].x} y1={byId[a].y + 25} x2={byId[b].x} y2={byId[b].y - 25} stroke={active.includes(b) ? "#69e7b6" : "#7485b7"} strokeWidth="2.5" />)}
      {layout.nodes.map(n => <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
        {active.includes(n.id) && <circle r="34" fill="#a18bff" opacity="0.18"><animate attributeName="r" values="30;38;30" dur="1.2s" repeatCount="indefinite" /></circle>}
        <circle r="25" fill={active.includes(n.id) ? "#5142a0" : "#1d2b4d"} stroke={active.includes(n.id) ? "#69e7b6" : "#a18bff"} strokeWidth="2.5" />
        <text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="19" fontWeight="700">{n.symbol}</text>
      </g>)}
    </svg>
  </div>;
}

export default function CFGDerivationVisualizer({ grammar, result }) {
  const frames = useMemo(() => reconstruct(grammar, result?.accepted ? result.path : null), [grammar, result]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const last = Math.max(0, frames.length - 1);
  useEffect(() => { setStep(0); setPlaying(false); }, [grammar, result]);
  useEffect(() => {
    if (!playing) return;
    if (step >= last) { setPlaying(false); return; }
    const timer = setTimeout(() => setStep(s => Math.min(last, s + 1)), 1000 / speed);
    return () => clearTimeout(timer);
  }, [playing, step, last, speed]);
  if (!result?.accepted || !frames.length) return null;
  const current = frames[Math.min(step, last)];
  const button = { background: "#40378a", border: "1px solid #8575dc", borderRadius: 9, padding: "10px 14px", color: "white", cursor: "pointer" };
  return <section style={{ background: "#151e38", border: "1px solid #303b60", borderRadius: 14, padding: 20, marginBottom: 18 }}>
    <h3>🌳 Animated CFG Derivation Tree</h3>
    <p style={{ color: "#a9b6d5" }}>The tree is constructed from the successful derivation found by the CFG solver.</p>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}><strong>{current.label}</strong><span>Step {step + 1} / {frames.length}</span></div>
    <Tree root={current.tree} active={current.active} />
    <p>Current sentential form: <strong style={{ color: "#78eac1" }}>{current.form || "ε"}</strong></p>
    <div style={{ height: 8, background: "#283455", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}><div style={{ width: `${last ? step / last * 100 : 100}%`, height: "100%", background: "linear-gradient(90deg,#9076f5,#68dfb5)", transition: "width .25s" }} /></div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center" }}>
      <button style={button} onClick={() => { setPlaying(false); setStep(0); }}>↺ Reset</button>
      <button style={button} disabled={step === 0} onClick={() => { setPlaying(false); setStep(s => Math.max(0, s - 1)); }}>◀ Previous</button>
      <button style={button} onClick={() => { if (playing) setPlaying(false); else { if (step >= last) setStep(0); setPlaying(true); } }}>{playing ? "⏸ Pause" : "▶ Play"}</button>
      <button style={button} disabled={step >= last} onClick={() => { setPlaying(false); setStep(s => Math.min(last, s + 1)); }}>Next ▶</button>
      <label>Speed <select style={button} value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option><option value={3}>3×</option></select></label>
    </div>
    <h4>Derivation Timeline</h4>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{frames.map((frame, i) => <button key={i} style={{ ...button, background: i === step ? "#6c58c3" : "#253354" }} onClick={() => { setPlaying(false); setStep(i); }}>{i + 1}. {frame.form || "ε"}</button>)}</div>
  </section>;
}
