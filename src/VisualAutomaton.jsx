import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  useNodesState,
  useNodesInitialized,
  useReactFlow
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./visual-automaton.css";

const EPS = "ε";
const EMPTY = [];
const NODE_SIZE = 74;

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));

function normalizeStates(model) {
  return Array.isArray(model?.states)
    ? model.states.map(String)
    : [];
}

function normalizeDestinations(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [String(value)];
}

/* =========================================================
   GRAPH 4.0 — STYLING
========================================================= */

const graphStyles = `
  .toc-canvas {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 500px;
  }

  .toc-canvas .react-flow {
    width: 100%;
    height: 100%;
  }

  .toc-canvas .react-flow__node {
    visibility: visible;
    opacity: 1;
  }

  .toc-canvas .react-flow__edge-path {
    transition: stroke .2s, stroke-width .2s;
  }

  .toc-canvas .react-flow__edge:hover .react-flow__edge-path {
    stroke: #ddd6fe;
    stroke-width: 3;
  }

  .toc-canvas .toc-state {
    position: relative;
    width: 74px;
    height: 74px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 3px solid #a99aff;
    background: radial-gradient(
      circle at 30% 25%,
      #6655ae,
      #30245f 75%
    );
    color: white;
    box-shadow:
      0 0 0 5px rgba(134,116,255,.06),
      0 0 22px rgba(134,116,255,.35);
    transition:
      background .25s,
      border-color .25s,
      box-shadow .25s;
  }

  .toc-canvas .toc-state.toc-accepting {
    box-shadow:
      inset 0 0 0 5px #30245f,
      inset 0 0 0 7px #c4b5fd,
      0 0 20px rgba(134,116,255,.4);
  }

  .toc-canvas .toc-state.toc-active {
    border-color: #6ee7b7;
    box-shadow:
      0 0 0 6px rgba(52,211,153,.13),
      0 0 30px rgba(52,211,153,.5);
  }

  .toc-canvas .toc-state.toc-arriving {
    border-color: #6ee7b7;
  }

  .toc-canvas .toc-state-name {
    position: relative;
    z-index: 3;
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    pointer-events: none;
  }

  .toc-canvas .toc-start-arrow {
    position: absolute;
    left: -34px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 25px;
    color: #c4b5fd;
    pointer-events: none;
  }

  .toc-canvas .toc-handle {
    width: 10px;
    height: 10px;
    border: 2px solid #d8b4fe;
    background: #6753c5;
    z-index: 5;
  }

  .toc-canvas .toc-handle-top {
    top: -5px;
  }

  .toc-canvas .toc-handle-bottom {
    bottom: -5px;
  }

  .toc-canvas .toc-handle-left {
    left: -5px;
  }

  .toc-canvas .toc-handle-right {
    right: -5px;
  }

  .toc-canvas .toc-breakpoint-dot {
    position: absolute;
    right: -10px;
    top: -13px;
    color: #fb7185;
    font-size: 15px;
    z-index: 8;
  }

  .toc-canvas .toc-energy-ring {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    border: 2px solid rgba(110,231,183,.55);
    pointer-events: none;
    animation: toc-graph-pulse 1.8s ease-out infinite;
  }

  .toc-canvas .toc-energy-ring.ring-two {
    animation-delay: .45s;
  }

  .toc-canvas .toc-energy-ring.ring-three {
    animation-delay: .9s;
  }

  .toc-canvas .toc-arrival-burst {
    position: absolute;
    inset: -15px;
    border-radius: 50%;
    border: 3px solid #6ee7b7;
    animation: toc-graph-pulse .6s ease-out;
    pointer-events: none;
  }

  @keyframes toc-graph-pulse {
    from {
      transform: scale(.85);
      opacity: .9;
    }

    to {
      transform: scale(1.6);
      opacity: 0;
    }
  }

  .toc-graph-edge-label {
    position: absolute;
    transform: translate(-50%, -50%);
    padding: 5px 10px;
    border: 1px solid #7568bd;
    border-radius: 8px;
    background: rgba(22,27,56,.96);
    color: #e9e4ff;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,0,0,.25);
    pointer-events: none;
    z-index: 10;
  }

  .toc-graph-edge-label.active {
    color: #6ee7b7;
    border-color: #34d399;
    box-shadow: 0 0 15px rgba(52,211,153,.25);
  }

  .toc-graph-energy {
    animation: toc-graph-flow 1s linear infinite;
  }

  @keyframes toc-graph-flow {
    to {
      stroke-dashoffset: -44;
    }
  }
`;

/* =========================================================
   STATE NODE
========================================================= */

const StateNode = React.memo(function StateNode({
  data,
  selected
}) {
  const active = !!data.active;
  const arriving = !!data.arriving;

  return (
    <div
      className={[
        "toc-state",
        data.accepting ? "toc-accepting" : "",
        active ? "toc-active" : "",
        arriving ? "toc-arriving" : "",
        selected ? "toc-selected" : ""
      ].filter(Boolean).join(" ")}
    >
      <Handle
        id="target-left"
        type="target"
        position={Position.Left}
        className="toc-handle toc-handle-left"
      />

      <Handle
        id="target-right"
        type="target"
        position={Position.Right}
        className="toc-handle toc-handle-right"
      />

      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        className="toc-handle toc-handle-top"
      />

      <Handle
        id="target-bottom"
        type="target"
        position={Position.Bottom}
        className="toc-handle toc-handle-bottom"
      />

      {data.start && (
        <span className="toc-start-arrow">→</span>
      )}

      {active && (
        <>
          <span className="toc-energy-ring ring-one" />
          <span className="toc-energy-ring ring-two" />
          <span className="toc-energy-ring ring-three" />
        </>
      )}

      {arriving && (
        <span className="toc-arrival-burst" />
      )}

      {data.breakpoint && (
        <span className="toc-breakpoint-dot">●</span>
      )}

      <span className="toc-state-name">
        {data.label}
      </span>

      <Handle
        id="source-left"
        type="source"
        position={Position.Left}
        className="toc-handle toc-handle-left"
      />

      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        className="toc-handle toc-handle-right"
      />

      <Handle
        id="source-top"
        type="source"
        position={Position.Top}
        className="toc-handle toc-handle-top"
      />

      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        className="toc-handle toc-handle-bottom"
      />
    </div>
  );
});

const nodeTypes = {
  automatonState: StateNode
};

/* =========================================================
   SMART LEFT-TO-RIGHT LAYOUT
========================================================= */

function calculatePosition(index, count) {
  if (count === 1) {
    return { x: 280, y: 230 };
  }

  const columns = Math.min(count, 4);
  const row = Math.floor(index / columns);
  const column = index % columns;

  return {
    x: 120 + column * 260,
    y: 220 + row * 260
  };
}

function createNodes(model, positions = {}) {
  const states = normalizeStates(model);

  return states.map((state, index) => ({
    id: state,
    type: "automatonState",
    position:
      positions[state] ||
      calculatePosition(index, states.length),
    data: {
      label: state,
      start: model.start === state,
      accepting: (model.finals || []).includes(state),
      active: false,
      arriving: false,
      breakpoint: false
    }
  }));
}

/* =========================================================
   SMART EDGE ROUTING
========================================================= */

function chooseHandles(source, target, positions) {
  if (source === target) {
    return {
      sourceHandle: "source-top",
      targetHandle: "target-top",
      route: "loop"
    };
  }

  const from = positions[source];
  const to = positions[target];

  if (!from || !to) {
    return {
      sourceHandle: "source-right",
      targetHandle: "target-left",
      route: "forward"
    };
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? {
          sourceHandle: "source-right",
          targetHandle: "target-left",
          route: "forward"
        }
      : {
          sourceHandle: "source-left",
          targetHandle: "target-right",
          route: "backward"
        };
  }

  return dy >= 0
    ? {
        sourceHandle: "source-bottom",
        targetHandle: "target-top",
        route: "down"
      }
    : {
        sourceHandle: "source-top",
        targetHandle: "target-bottom",
        route: "up"
      };
}

function transitionGeometry(props) {
  const {
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data
  } = props;

  const route = data?.route || "forward";

  if (source === target) {
    // Both handles are at the top of the state.
    // The loop rises above the node.
    const x = sourceX;
    const y = sourceY;

    return {
      path: `
        M ${x - 5} ${y}
        C ${x - 95} ${y - 145},
          ${x + 95} ${y - 145},
          ${x + 5} ${y}
      `,
      labelX: x,
      labelY: y - 91
    };
  }

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const distance = Math.hypot(dx, dy) || 1;

  const normalX = -dy / distance;
  const normalY = dx / distance;

  let bend = 0;

  if (route === "forward") {
    bend = -45;
  } else if (route === "backward") {
    bend = 65;
  } else if (route === "down") {
    bend = -35;
  } else {
    bend = 35;
  }

  const controlX = midX + normalX * bend;
  const controlY = midY + normalY * bend;

  return {
    path: `
      M ${sourceX} ${sourceY}
      Q ${controlX} ${controlY}
        ${targetX} ${targetY}
    `,
    labelX: midX + normalX * bend * 0.5,
    labelY: midY + normalY * bend * 0.5 +
      (route === "forward" ? -17 : 17)
  };
}

/* =========================================================
   ANIMATED TRANSITION EDGE
========================================================= */

const FuturisticEdge = React.memo(function FuturisticEdge(props) {
  const {
    id,
    label,
    markerEnd,
    data
  } = props;

  const { path, labelX, labelY } =
    transitionGeometry(props);

  const active = !!data?.active;
  const progress = clamp(data?.progress);
  const paused = !!data?.paused;

  const pathRef = useRef(null);

  const particles = useMemo(() => {
    if (!active || !pathRef.current) {
      return [];
    }

    try {
      const element = pathRef.current;
      const length = element.getTotalLength();

      return [0, 0.06, 0.12].map((offset, index) => {
        const fraction = Math.max(
          0,
          progress - offset
        );

        const point = element.getPointAtLength(
          length * fraction
        );

        return {
          index,
          x: point.x,
          y: point.y
        };
      });
    } catch {
      return [];
    }
  }, [active, progress, path]);

  return (
    <>
      <path
        ref={pathRef}
        d={path}
        fill="none"
        stroke="none"
        pointerEvents="none"
      />

      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: active ? "#34d399" : "#a99aff",
          strokeWidth: active ? 3.5 : 2.2,
          filter: active
            ? "drop-shadow(0 0 8px rgba(52,211,153,.7))"
            : undefined
        }}
      />

      {active && (
        <g pointerEvents="none">
          <path
            d={path}
            fill="none"
            stroke="#34d399"
            strokeWidth="10"
            strokeOpacity="0.12"
          />

          <path
            d={path}
            fill="none"
            stroke="#a7f3d0"
            strokeWidth="2"
            strokeDasharray="8 14"
            className="toc-graph-energy"
            style={{
              animationPlayState:
                paused ? "paused" : "running"
            }}
          />

          {particles.map(particle => (
            <g
              key={particle.index}
              transform={
                `translate(${particle.x},${particle.y})`
              }
            >
              <circle
                r={particle.index === 0 ? 12 : 7}
                fill="#34d399"
                opacity=".25"
              />

              <circle
                r={particle.index === 0 ? 5 : 3}
                fill={
                  particle.index === 0
                    ? "#ffffff"
                    : "#6ee7b7"
                }
              />
            </g>
          ))}
        </g>
      )}

      <EdgeLabelRenderer>
        <div
          className={
            `toc-graph-edge-label ${active ? "active" : ""}`
          }
          style={{
            left: labelX,
            top: labelY
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

const edgeTypes = {
  futuristic: FuturisticEdge
};

/* =========================================================
   BUILD EDGES
========================================================= */

function createEdges(model, positions = {}) {
  const states = normalizeStates(model);
  const groups = new Map();

  for (const from of states) {
    const outgoing =
      model.transitions?.[from] || {};

    for (const [symbol, raw] of Object.entries(outgoing)) {
      for (const to of normalizeDestinations(raw)) {
        if (!states.includes(to)) continue;

        const key = JSON.stringify([from, to]);

        if (!groups.has(key)) {
          groups.set(key, {
            from,
            to,
            symbols: []
          });
        }

        const group = groups.get(key);

        if (!group.symbols.includes(symbol)) {
          group.symbols.push(symbol);
        }
      }
    }
  }

  return [...groups.values()].map(group => {
    const routing = chooseHandles(
      group.from,
      group.to,
      positions
    );

    return {
      id: `edge-${group.from}-${group.to}`,
      source: group.from,
      target: group.to,
      sourceHandle: routing.sourceHandle,
      targetHandle: routing.targetHandle,
      type: "futuristic",
      label: group.symbols.join(", "),
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#a99aff",
        width: 18,
        height: 18
      },
      data: {
        symbols: group.symbols,
        route: routing.route,
        active: false,
        progress: 0,
        paused: false
      }
    };
  });
}

/* =========================================================
   VIEWPORT
========================================================= */

function GraphViewport({
  resetKey,
  stateSignature
}) {
  const initialized = useNodesInitialized();
  const { fitView } = useReactFlow();
  const lastFit = useRef(null);

  useEffect(() => {
    if (!initialized) return;

    const key = `${resetKey}:${stateSignature}`;

    if (lastFit.current === key) return;

    const timer = setTimeout(() => {
      fitView({
        padding: 0.45,
        maxZoom: 1,
        duration: 350
      });

      lastFit.current = key;
    }, 150);

    return () => clearTimeout(timer);
  }, [
    initialized,
    resetKey,
    stateSignature,
    fitView
  ]);

  return null;
}

/* =========================================================
   AUTOMATON CANVAS
========================================================= */

function AutomatonCanvas({
  model,
  onChange,
  editable = false,
  nfa = false,
  active = EMPTY,
  activeTransition = null,
  breakpoints = EMPTY,
  selectedSymbol = "",
  onSelectState,
  onConnectError,
  resetKey = 0
}) {
  const states = normalizeStates(model);
  const stateSignature = states.join("\u0000");

  const [nodes, setNodes, onNodesChange] =
    useNodesState(() => createNodes(model));

  const [edges, setEdges] = useState(() => {
    const initialNodes = createNodes(model);

    return createEdges(
      model,
      Object.fromEntries(
        initialNodes.map(node => [
          node.id,
          node.position
        ])
      )
    );
  });

  const modelRef = useRef(model);
  const onChangeRef = useRef(onChange);

  modelRef.current = model;
  onChangeRef.current = onChange;

  // Rebuild graph only when the automaton model changes.
  useEffect(() => {
    setNodes(previous => {
      const oldPositions = Object.fromEntries(
        previous.map(node => [
          node.id,
          node.position
        ])
      );

      return createNodes(model, oldPositions);
    });
  }, [model, setNodes]);

  // Update node highlights without changing their positions.
  useEffect(() => {
    setNodes(previous =>
      previous.map(node => ({
        ...node,
        data: {
          ...node.data,
          active: active.includes(node.id),
          arriving:
            activeTransition?.to === node.id &&
            (activeTransition?.progress ?? 0) >= 0.85,
          breakpoint: breakpoints.includes(node.id)
        }
      }))
    );
  }, [
    active,
    activeTransition,
    breakpoints,
    setNodes
  ]);

  // Derive routing from current node positions.
  const positionSignature = nodes
    .map(node =>
      `${node.id}:${node.position.x}:${node.position.y}`
    )
    .join("|");

  useEffect(() => {
    const positions = Object.fromEntries(
      nodes.map(node => [
        node.id,
        node.position
      ])
    );

    setEdges(previous => {
      const previousById = new Map(
        previous.map(edge => [edge.id, edge])
      );

      return createEdges(model, positions).map(edge => {
        const old = previousById.get(edge.id);

        return {
          ...edge,
          data: {
            ...edge.data,
            active: old?.data?.active || false,
            progress: old?.data?.progress || 0,
            paused: old?.data?.paused || false
          }
        };
      });
    });
  }, [
    model,
    positionSignature,
    setEdges
  ]);

  // Animate the selected transition.
  useEffect(() => {
    setEdges(previous =>
      previous.map(edge => {
        const symbols = edge.data?.symbols || [];

        const isActive =
          activeTransition?.from === edge.source &&
          activeTransition?.to === edge.target &&
          symbols.includes(activeTransition?.symbol);

        return {
          ...edge,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isActive ? "#34d399" : "#a99aff",
            width: 18,
            height: 18
          },
          data: {
            ...edge.data,
            active: isActive,
            progress: isActive
              ? activeTransition?.progress ?? 0
              : 0,
            paused: isActive
              ? !!activeTransition?.paused
              : false
          }
        };
      })
    );
  }, [activeTransition, setEdges]);

  // Reset Layout.
  const previousReset = useRef(resetKey);

  useEffect(() => {
    if (previousReset.current === resetKey) return;

    previousReset.current = resetKey;

    setNodes(previous =>
      previous.map((node, index) => ({
        ...node,
        position: calculatePosition(
          index,
          previous.length
        )
      }))
    );
  }, [resetKey, setNodes]);

  const connect = useCallback(
    ({ source, target }) => {
      if (!editable || !source || !target) return;

      if (!selectedSymbol) {
        onConnectError?.(
          "Select a symbol before connecting states."
        );
        return;
      }

      const next = clone(modelRef.current);

      next.transitions ||= {};
      next.transitions[source] ||= {};

      if (nfa) {
        const previous = normalizeDestinations(
          next.transitions[source][selectedSymbol]
        );

        next.transitions[source][selectedSymbol] = [
          ...new Set([...previous, target])
        ];
      } else {
        next.transitions[source][selectedSymbol] = target;
      }

      onChangeRef.current?.(next);
    },
    [editable, selectedSymbol, nfa, onConnectError]
  );

  return (
    <div className="toc-canvas">
      <style>{graphStyles}</style>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onConnect={connect}
        onNodeClick={(_, node) =>
          onSelectState?.(node.id)
        }
        onPaneClick={() =>
          onSelectState?.(null)
        }
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        fitView
        fitViewOptions={{
          padding: 0.45,
          maxZoom: 1
        }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{
          hideAttribution: true
        }}
      >
        <Background
          color="#34436d"
          gap={22}
          size={1}
        />

        <Controls
          showInteractive={false}
          position="bottom-left"
        />

        <GraphViewport
          resetKey={resetKey}
          stateSignature={stateSignature}
        />
      </ReactFlow>

      {editable && (
        <div className="toc-canvas-help">
          Drag states to reposition ·
          Connect handles to create transitions
        </div>
      )}
    </div>
  );
}

/* =========================================================
   READ-ONLY GRAPH
========================================================= */

export function VisualAutomatonView({
  model,
  active = EMPTY,
  activeTransition = null,
  breakpoints = EMPTY
}) {
  if (!model?.states?.length) {
    return (
      <div className="toc-empty">
        No states available.
      </div>
    );
  }

  return (
    <div className="toc-viewer">
      <ReactFlowProvider>
        <AutomatonCanvas
          model={model}
          active={active}
          activeTransition={activeTransition}
          breakpoints={breakpoints}
        />
      </ReactFlowProvider>

      <div className="toc-legend">
        ◎ Accepting · → Start ·
        Green energy: active transition ·
        Red indicator: breakpoint
      </div>
    </div>
  );
}

/* =========================================================
   FULL VISUAL EDITOR
========================================================= */

export function VisualAutomatonEditor({
  value,
  onChange,
  title = "Visual Automata Studio",
  nfa = false,
  active = EMPTY,
  activeTransition = null,
  breakpoints = []
}) {
  const [stateName, setStateName] = useState("");
  const [symbolName, setSymbolName] = useState("");
  const [selectedState, setSelectedState] = useState(null);

  const [selectedSymbol, setSelectedSymbol] = useState(
    value.alphabet?.[0] || ""
  );

  const [view, setView] = useState("canvas");
  const [message, setMessage] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const states = normalizeStates(value);
  const alphabet = value.alphabet || [];
  const finals = value.finals || [];

  const symbols = [
    ...alphabet,
    ...(nfa ? [EPS] : [])
  ];

  useEffect(() => {
    if (!symbols.includes(selectedSymbol)) {
      setSelectedSymbol(symbols[0] || "");
    }
  }, [selectedSymbol, alphabet, nfa]);

  useEffect(() => {
    if (
      selectedState &&
      !states.includes(selectedState)
    ) {
      setSelectedState(null);
    }
  }, [selectedState, states]);

  function update(next) {
    setMessage("");
    onChange?.(next);
  }

  function addState() {
    const name = stateName.trim();

    if (!name || states.includes(name)) {
      setMessage("Enter a unique state name.");
      return;
    }

    update({
      ...value,
      states: [...states, name],
      start: value.start || name,
      transitions: {
        ...value.transitions,
        [name]: {}
      }
    });

    setStateName("");
    setSelectedState(name);
  }

  function deleteState(name) {
    if (states.length <= 1) {
      setMessage("At least one state must remain.");
      return;
    }

    const next = clone(value);

    next.transitions ||= {};

    next.states = next.states.filter(
      state => state !== name
    );

    next.finals = next.finals.filter(
      state => state !== name
    );

    if (next.start === name) {
      next.start = next.states[0];
    }

    delete next.transitions[name];

    for (const state of next.states) {
      const outgoing =
        next.transitions?.[state] || {};

      for (const [symbol, raw] of Object.entries(outgoing)) {
        if (Array.isArray(raw)) {
          next.transitions[state][symbol] =
            raw.filter(to => to !== name);
        } else if (raw === name) {
          delete next.transitions[state][symbol];
        }
      }
    }

    setSelectedState(null);
    update(next);
  }

  function renameState(oldName, newName) {
    const name = newName.trim();

    if (!name || name === oldName) return;

    if (states.includes(name)) {
      setMessage("That state already exists.");
      return;
    }

    const next = clone(value);

    next.transitions ||= {};

    next.states = next.states.map(state =>
      state === oldName ? name : state
    );

    next.finals = next.finals.map(state =>
      state === oldName ? name : state
    );

    if (next.start === oldName) {
      next.start = name;
    }

    next.transitions[name] =
      next.transitions[oldName] || {};

    delete next.transitions[oldName];

    for (const state of next.states) {
      for (const [symbol, raw] of Object.entries(
        next.transitions?.[state] || {}
      )) {
        next.transitions[state][symbol] =
          Array.isArray(raw)
            ? raw.map(to =>
                to === oldName ? name : to
              )
            : raw === oldName
              ? name
              : raw;
      }
    }

    setSelectedState(name);
    update(next);
  }

  function addSymbol() {
    const symbol = symbolName.trim();

    if (
      [...symbol].length !== 1 ||
      symbol === EPS ||
      alphabet.includes(symbol)
    ) {
      setMessage(
        "Enter one unique symbol other than ε."
      );
      return;
    }

    update({
      ...value,
      alphabet: [...alphabet, symbol]
    });

    setSelectedSymbol(symbol);
    setSymbolName("");
  }

  function deleteSymbol(symbol) {
    const next = clone(value);

    next.alphabet = next.alphabet.filter(
      item => item !== symbol
    );

    for (const state of states) {
      if (next.transitions?.[state]) {
        delete next.transitions[state][symbol];
      }
    }

    update(next);
  }

  function setTransition(from, symbol, to) {
    const next = clone(value);

    next.transitions ||= {};
    next.transitions[from] ||= {};

    if (nfa) {
      const old = normalizeDestinations(
        next.transitions[from][symbol]
      );

      next.transitions[from][symbol] =
        old.includes(to)
          ? old.filter(state => state !== to)
          : [...old, to];
    } else if (to) {
      next.transitions[from][symbol] = to;
    } else {
      delete next.transitions[from][symbol];
    }

    update(next);
  }

  function removeTransition(from, symbol, to) {
    const next = clone(value);

    if (nfa) {
      next.transitions[from][symbol] =
        normalizeDestinations(
          next.transitions[from][symbol]
        ).filter(state => state !== to);
    } else {
      delete next.transitions[from][symbol];
    }

    update(next);
  }

  const transitionCount = states.reduce(
    (total, state) =>
      total +
      Object.values(
        value.transitions?.[state] || {}
      ).reduce(
        (sum, destination) =>
          sum + normalizeDestinations(destination).length,
        0
      ),
    0
  );

  return (
    <section className="toc-studio">
      <div className="toc-studio-header">
        <div>
          <div className="toc-overline">
            NEXT-GEN AUTOMATA VISUALIZATION
          </div>

          <h2>{title}</h2>

          <p>
            Interactive state machines with
            real-time energy visualization.
          </p>
        </div>

        <div className="toc-mode-badge">
          {nfa ? "NFA MODE" : "DFA MODE"}
        </div>
      </div>

      <div className="toc-stats">
        {[
          ["States", states.length],
          ["Symbols", alphabet.length],
          ["Transitions", transitionCount],
          ["Accepting", finals.length]
        ].map(([label, count]) => (
          <div key={label}>
            <strong>{count}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="toc-studio-toolbar">
        <div className="toc-toolbar-group">
          <button
            type="button"
            className={`toc-tool ${
              view === "canvas" ? "active" : ""
            }`}
            onClick={() => setView("canvas")}
          >
            Canvas
          </button>

          <button
            type="button"
            className={`toc-tool ${
              view === "table" ? "active" : ""
            }`}
            onClick={() => setView("table")}
          >
            Transition Table
          </button>
        </div>

        <button
          type="button"
          className="toc-tool"
          onClick={() =>
            setResetKey(key => key + 1)
          }
        >
          Reset Layout
        </button>
      </div>

      <div className="toc-editor-layout">
        <aside className="toc-tool-panel">
          <div className="toc-panel-heading">
            Builder Tools
          </div>

          <label className="toc-label">
            Add State
          </label>

          <div className="toc-input-row">
            <input
              value={stateName}
              placeholder="q3"
              onChange={event =>
                setStateName(event.target.value)
              }
              onKeyDown={event => {
                if (event.key === "Enter") {
                  addState();
                }
              }}
            />

            <button
              type="button"
              onClick={addState}
            >
              +
            </button>
          </div>

          <label className="toc-label">
            Add Symbol
          </label>

          <div className="toc-input-row">
            <input
              value={symbolName}
              placeholder="a"
              onChange={event =>
                setSymbolName(event.target.value)
              }
              onKeyDown={event => {
                if (event.key === "Enter") {
                  addSymbol();
                }
              }}
            />

            <button
              type="button"
              onClick={addSymbol}
            >
              +
            </button>
          </div>

          <label className="toc-label">
            Connection Symbol
          </label>

          <select
            value={selectedSymbol}
            onChange={event =>
              setSelectedSymbol(event.target.value)
            }
          >
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>

          <div className="toc-symbol-list">
            {alphabet.map(symbol => (
              <div key={symbol}>
                <span>{symbol}</span>

                <button
                  type="button"
                  onClick={() =>
                    deleteSymbol(symbol)
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="toc-tip">
            Select a symbol, then connect
            the handles of two states.
            Drag states to customize the graph.
          </div>
        </aside>

        <div className="toc-editor-center">
          {view === "canvas" ? (
            <ReactFlowProvider>
              <AutomatonCanvas
                model={value}
                onChange={update}
                editable
                nfa={nfa}
                active={active}
                activeTransition={activeTransition}
                breakpoints={breakpoints}
                selectedSymbol={selectedSymbol}
                onSelectState={setSelectedState}
                onConnectError={setMessage}
                resetKey={resetKey}
              />
            </ReactFlowProvider>
          ) : (
            <div className="toc-transition-table">
              <table>
                <thead>
                  <tr>
                    <th>State</th>

                    {symbols.map(symbol => (
                      <th key={symbol}>
                        {symbol}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {states.map(state => (
                    <tr key={state}>
                      <td>
                        {value.start === state
                          ? "→ "
                          : ""}
                        {state}
                        {finals.includes(state)
                          ? " ★"
                          : ""}
                      </td>

                      {symbols.map(symbol => (
                        <td key={symbol}>
                          {nfa ? (
                            <div className="toc-multi">
                              {states.map(to => (
                                <label key={to}>
                                  <input
                                    type="checkbox"
                                    checked={normalizeDestinations(
                                      value.transitions?.[state]?.[symbol]
                                    ).includes(to)}
                                    onChange={() =>
                                      setTransition(
                                        state,
                                        symbol,
                                        to
                                      )
                                    }
                                  />
                                  {to}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <select
                              value={
                                value.transitions?.[state]?.[symbol] || ""
                              }
                              onChange={event =>
                                setTransition(
                                  state,
                                  symbol,
                                  event.target.value
                                )
                              }
                            >
                              <option value="">
                                Select
                              </option>

                              {states.map(to => (
                                <option
                                  key={to}
                                  value={to}
                                >
                                  {to}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="toc-properties">
          <div className="toc-panel-heading">
            State Properties
          </div>

          {selectedState ? (
            <>
              <div className="toc-selected-title">
                Selected State
              </div>

              <input
                key={selectedState}
                defaultValue={selectedState}
                onBlur={event =>
                  renameState(
                    selectedState,
                    event.target.value
                  )
                }
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
              />

              <label className="toc-check">
                <input
                  type="radio"
                  checked={
                    value.start === selectedState
                  }
                  onChange={() =>
                    update({
                      ...value,
                      start: selectedState
                    })
                  }
                />
                Start State
              </label>

              <label className="toc-check">
                <input
                  type="checkbox"
                  checked={finals.includes(
                    selectedState
                  )}
                  onChange={() =>
                    update({
                      ...value,
                      finals: finals.includes(
                        selectedState
                      )
                        ? finals.filter(
                            state =>
                              state !== selectedState
                          )
                        : [
                            ...finals,
                            selectedState
                          ]
                    })
                  }
                />
                Accepting State
              </label>

              <div className="toc-property-divider" />

              <div className="toc-selected-title">
                Outgoing Transitions
              </div>

              {Object.entries(
                value.transitions?.[selectedState] || {}
              ).flatMap(([symbol, raw]) =>
                normalizeDestinations(raw).map(to => (
                  <div
                    className="toc-transition-item"
                    key={`${symbol}-${to}`}
                  >
                    <span>
                      {symbol} → {to}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeTransition(
                          selectedState,
                          symbol,
                          to
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))
              )}

              <button
                type="button"
                className="toc-danger"
                onClick={() =>
                  deleteState(selectedState)
                }
              >
                Delete State
              </button>
            </>
          ) : (
            <div className="toc-no-selection">
              Select a state to edit its
              name, start status,
              accepting status and
              outgoing transitions.
            </div>
          )}
        </aside>
      </div>

      {message && (
        <div className="toc-warning">
          {message}
        </div>
      )}

      <div className="toc-studio-footer">
        <span>
          ● Live model synchronization
        </span>

        <span>
          {nfa
            ? "ε-transitions supported"
            : "Deterministic transition mode"}
        </span>
      </div>
    </section>
  );
}