
import React, { useEffect, useState } from "react";
import "./futuristic-dashboard.css";

const modules = [
  {
    name: "DFA Simulator",
    icon: "◎",
    category: "Automata",
    description: "Build, execute and debug deterministic automata.",
    accent: "violet",
  },
  {
    name: "NFA & Conversion",
    icon: "◇",
    category: "Automata",
    description: "Explore nondeterminism and subset construction.",
    accent: "blue",
  },
  {
    name: "Regex Lab",
    icon: "✳",
    category: "Automata",
    description: "Convert regular expressions into finite automata.",
    accent: "pink",
  },
  {
    name: "CFG & Derivation",
    icon: "≡",
    category: "Languages",
    description: "Construct grammars and explore derivations.",
    accent: "orange",
  },
  {
    name: "PDA Simulator",
    icon: "▤",
    category: "Languages",
    description: "Study stack operations and context-free languages.",
    accent: "teal",
  },
  {
    name: "Turing Machine",
    icon: "▦",
    category: "Machines",
    description: "Execute tape-based computational models.",
    accent: "blue",
  },
  {
    name: "DFA Minimizer",
    icon: "↘",
    category: "Automata",
    description: "Reduce states while preserving language behavior.",
    accent: "violet",
  },
  {
    name: "Equivalence Checker",
    icon: "⇄",
    category: "Verification",
    description: "Compare two DFAs and find counterexamples.",
    accent: "teal",
  },
  {
    name: "AutoFix VerifyX",
    icon: "✦",
    category: "Verification",
    description: "Discover and formally verify transition repairs.",
    accent: "pink",
  },
  {
    name: "Smart Test Generator",
    icon: "☷",
    category: "Testing",
    description: "Generate test strings and inspect outcomes.",
    accent: "orange",
  },
  {
    name: "AI Tutor (Local)",
    icon: "✧",
    category: "Learning",
    description: "Understand DFA execution through local explanations.",
    accent: "violet",
  },
  {
    name: "Challenge Mode",
    icon: "★",
    category: "Learning",
    description: "Test your Theory of Computation knowledge.",
    accent: "orange",
  },
  {
    name: "Protocol Verification",
    icon: "⬡",
    category: "Verification",
    description: "Model and validate protocol state machines.",
    accent: "blue",
  },
  {
    name: "Experiments",
    icon: "▣",
    category: "Testing",
    description: "Explore automata experiments and saved results.",
    accent: "teal",
  },
];

const demoTransitions = {
  q0: { "0": "q1", "1": "q0" },
  q1: { "0": "q1", "1": "q2" },
  q2: { "0": "q1", "1": "q0" },
};

const demoPositions = {
  q0: { x: 105, y: 145 },
  q1: { x: 305, y: 145 },
  q2: { x: 505, y: 145 },
};

function AutomatonPreview() {
  const [input, setInput] = useState("0101");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const validInput = /^[01]*$/.test(input);

  const states = ["q0"];
  const transitions = [];

  if (validInput) {
    let current = "q0";

    for (const symbol of input) {
      const next = demoTransitions[current][symbol];

      transitions.push({
        from: current,
        to: next,
        symbol,
      });

      states.push(next);
      current = next;
    }
  }

  const currentState = states[Math.min(step, states.length - 1)];
  const complete = step === input.length;
  const accepted = complete && currentState === "q2";

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [input]);

  useEffect(() => {
    if (!playing || !validInput) return;

    if (step >= input.length) {
      setPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setStep(previous => previous + 1);
    }, 850);

    return () => clearTimeout(timer);
  }, [playing, step, input, validInput]);

  const currentTransition =
    step > 0 ? transitions[step - 1] : null;

  function run() {
    if (!validInput) return;
    setStep(0);
    setPlaying(true);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  return (
    <div className="fv-automaton">
      <div className="fv-preview-heading">
        <div className="fv-preview-heading-left">
          <span className="fv-live-dot" />
          <span>LIVE AUTOMATA ENGINE</span>
        </div>

        <span className="fv-preview-badge">DFA DEMO</span>
      </div>

      <div className="fv-preview-stage">
        <div className="fv-stage-grid" />

        <svg
          viewBox="0 0 610 290"
          className="fv-machine-svg"
          role="img"
          aria-label="Interactive DFA with states q0, q1 and q2"
        >
          <defs>
            <marker
              id="fv-arrow"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path
                d="M0 0 L9 4.5 L0 9"
                fill="none"
                stroke="#9d91ff"
                strokeWidth="1.8"
              />
            </marker>

            <marker
              id="fv-arrow-active"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path
                d="M0 0 L9 4.5 L0 9"
                fill="none"
                stroke="#64f5c2"
                strokeWidth="1.8"
              />
            </marker>

            <filter id="fv-glow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g
            fill="none"
            stroke="#9d91ff"
            strokeWidth="2.3"
            markerEnd="url(#fv-arrow)"
          >
            <path d="M25 145 H63" />
            <path d="M147 145 H263" />
            <path d="M347 145 H463" />
            <path d="M95 103 C45 10 165 10 115 103" />
            <path d="M295 103 C245 10 365 10 315 103" />
            <path d="M500 187 C500 255 310 255 310 187" />
          </g>

          <g
            fill="#c9c2ff"
            fontSize="15"
            fontWeight="700"
            textAnchor="middle"
          >
            <text x="205" y="130">0</text>
            <text x="405" y="130">1</text>
            <text x="105" y="32">1</text>
            <text x="305" y="32">0</text>
            <text x="405" y="259">0, 1</text>
          </g>

          {Object.entries(demoPositions).map(([name, pos]) => {
            const active = currentState === name;
            const accepting = name === "q2";

            return (
              <g
                key={name}
                className={`fv-machine-node ${
                  active ? "is-active" : ""
                }`}
              >
                {active && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="57"
                      className="fv-node-pulse"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="48"
                      fill="none"
                      stroke="#64f5c2"
                      strokeOpacity=".35"
                    />
                  </>
                )}

                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="42"
                  fill={active ? "#304e63" : "#30265e"}
                  stroke={active ? "#64f5c2" : "#b4a7ff"}
                  strokeWidth="3"
                  filter={active ? "url(#fv-glow)" : undefined}
                />

                {accepting && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="34"
                    fill="none"
                    stroke={active ? "#64f5c2" : "#c6baff"}
                    strokeWidth="2"
                  />
                )}

                <text
                  x={pos.x}
                  y={pos.y + 6}
                  textAnchor="middle"
                  fontSize="19"
                  fontWeight="800"
                  fill="#ffffff"
                >
                  {name}
                </text>
              </g>
            );
          })}

          {currentTransition && (
            <text
              x="305"
              y="284"
              fill="#64f5c2"
              textAnchor="middle"
              fontSize="12"
            >
              {currentTransition.from} —{" "}
              {currentTransition.symbol} →{" "}
              {currentTransition.to}
            </text>
          )}
        </svg>
      </div>

      <div className="fv-simulator-controls">
        <div className="fv-input-group">
          <label htmlFor="fv-demo-input">INPUT STRING</label>
          <input
            id="fv-demo-input"
            value={input}
            maxLength={20}
            onChange={event => setInput(event.target.value)}
            placeholder="0101"
            aria-invalid={!validInput}
          />
        </div>

        <button
          type="button"
          className="fv-run-btn"
          onClick={run}
          disabled={!validInput}
        >
          ▶ Run
        </button>

        <button
          type="button"
          className="fv-reset-btn"
          onClick={reset}
        >
          ↺
        </button>
      </div>

      {!validInput && (
        <p className="fv-input-error">
          This demonstration accepts only 0 and 1.
        </p>
      )}

      <div className="fv-tape">
        {input.length ? (
          input.split("").map((symbol, index) => (
            <span
              key={index}
              className={
                index < step
                  ? "fv-tape-cell consumed"
                  : index === step
                  ? "fv-tape-cell current"
                  : "fv-tape-cell"
              }
            >
              {symbol}
            </span>
          ))
        ) : (
          <span className="fv-tape-empty">ε — Empty string</span>
        )}
      </div>

      <div className="fv-preview-footer">
        <span>
          CURRENT STATE: <strong>{currentState}</strong>
        </span>

        <span
          className={
            complete
              ? accepted
                ? "fv-result accepted"
                : "fv-result rejected"
              : "fv-result"
          }
        >
          {!complete
            ? `STEP ${step}/${input.length}`
            : accepted
            ? "✓ ACCEPTED"
            : "✕ REJECTED"}
        </span>
      </div>
    </div>
  );
}

export default function FuturisticDashboard({ goTo }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const categories = [
    "All",
    "Automata",
    "Languages",
    "Machines",
    "Verification",
    "Testing",
    "Learning",
  ];

  const filteredModules = modules.filter(module => {
    const categoryMatches =
      filter === "All" || module.category === filter;

    const searchMatches =
      `${module.name} ${module.description}`
        .toLowerCase()
        .includes(search.toLowerCase());

    return categoryMatches && searchMatches;
  });

  return (
    <div className="fv-dashboard">
      <section className="fv-hero">
        <div className="fv-hero-orb fv-orb-one" />
        <div className="fv-hero-orb fv-orb-two" />

        <div className="fv-hero-copy">
          <div className="fv-kicker">
            <span className="fv-kicker-line" />
            THE FUTURE OF COMPUTATION LEARNING
          </div>

          <div className="fv-hero-tag">
            ✦ INTERACTIVE THEORY OF COMPUTATION LAB
          </div>

          <h2>
            Think in States.
            <br />
            <span>Build the Future.</span>
          </h2>

          <p>
            An advanced visual laboratory for automata,
            formal languages, computation and verification.
            Build machines, trace execution and explore
            computational theory interactively.
          </p>

          <div className="fv-hero-actions">
            <button
              type="button"
              className="fv-primary-action"
              onClick={() => goTo("DFA Simulator")}
            >
              ▶ Launch Visual Studio
              <span>↗</span>
            </button>

            <button
              type="button"
              className="fv-secondary-action"
              onClick={() => goTo("AutoFix VerifyX")}
            >
              ✦ Explore VerifyX
            </button>
          </div>

          <div className="fv-hero-metrics">
            <div>
              <strong>15</strong>
              <span>LAB MODULES</span>
            </div>

            <div>
              <strong>4</strong>
              <span>COMPUTATION MODELS</span>
            </div>

            <div>
              <strong>∞</strong>
              <span>EXPLORATION</span>
            </div>
          </div>
        </div>

        <div className="fv-hero-visual">
          <AutomatonPreview />
        </div>
      </section>

      <section className="fv-quick-launch">
        <div className="fv-section-heading">
          <div>
            <div className="fv-section-kicker">
              START EXPLORING
            </div>
            <h3>Quick Launch</h3>
            <p>Your most powerful tools, one click away.</p>
          </div>
        </div>

        <div className="fv-quick-grid">
          {[
            {
              name: "DFA Simulator",
              icon: "◎",
              subtitle: "Visual Debugger",
              accent: "violet",
            },
            {
              name: "NFA & Conversion",
              icon: "◇",
              subtitle: "Subset Construction",
              accent: "blue",
            },
            {
              name: "AutoFix VerifyX",
              icon: "✦",
              subtitle: "Formal Repair Engine",
              accent: "pink",
            },
            {
              name: "Turing Machine",
              icon: "▦",
              subtitle: "Tape Execution",
              accent: "teal",
            },
          ].map(item => (
            <button
              key={item.name}
              type="button"
              className={`fv-quick-card fv-${item.accent}`}
              onClick={() => goTo(item.name)}
            >
              <div className="fv-quick-icon">{item.icon}</div>

              <div className="fv-quick-info">
                <strong>{item.name}</strong>
                <span>{item.subtitle}</span>
              </div>

              <span className="fv-quick-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <section className="fv-featured">
        <div className="fv-featured-content">
          <span className="fv-featured-tag">
            ✦ FEATURED TECHNOLOGY
          </span>

          <h3>AutoFix VerifyX</h3>

          <p>
            Go beyond simulation. Compare automata, identify
            incorrect transitions, search for repairs and
            verify whether the repaired DFA matches the
            reference language.
          </p>

          <div className="fv-featured-steps">
            <span>01 · Detect</span>
            <span>02 · Repair</span>
            <span>03 · Verify</span>
          </div>

          <button
            type="button"
            onClick={() => goTo("AutoFix VerifyX")}
          >
            Explore Verification Engine →
          </button>
        </div>

        <div className="fv-featured-visual" aria-hidden="true">
          <div className="fv-verify-ring outer" />
          <div className="fv-verify-ring middle" />
          <div className="fv-verify-ring inner" />

          <div className="fv-verify-core">
            <span>✦</span>
            <strong>VERIFYX</strong>
            <small>FORMAL ENGINE</small>
          </div>

          <span className="fv-floating-label label-one">
            ◈ DFA
          </span>
          <span className="fv-floating-label label-two">
            ✓ VERIFIED
          </span>
          <span className="fv-floating-label label-three">
            ⇄ EQUIVALENCE
          </span>
        </div>
      </section>

      <section className="fv-explorer">
        <div className="fv-section-heading">
          <div>
            <div className="fv-section-kicker">
              YOUR COMPUTATION WORKSPACE
            </div>
            <h3>Explore the Laboratory</h3>
            <p>
              All TOCVerse modules, organized in one place.
            </p>
          </div>

          <span className="fv-module-count">
            {filteredModules.length} MODULES
          </span>
        </div>

        <div className="fv-explorer-toolbar">
          <div className="fv-filters">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                className={
                  filter === category ? "active" : ""
                }
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <input
            className="fv-search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="⌕ Search modules..."
            aria-label="Search modules"
          />
        </div>

        <div className="fv-module-grid">
          {filteredModules.map((module, index) => (
            <button
              type="button"
              key={module.name}
              className={`fv-module-card fv-${module.accent}`}
              onClick={() => goTo(module.name)}
              style={{ "--fv-index": index }}
            >
              <div className="fv-module-top">
                <span className="fv-module-icon">
                  {module.icon}
                </span>
                <span className="fv-module-arrow">↗</span>
              </div>

              <span className="fv-module-category">
                {module.category}
              </span>

              <strong>{module.name}</strong>

              <p>{module.description}</p>

              <span className="fv-module-open">
                OPEN LAB <span>→</span>
              </span>
            </button>
          ))}
        </div>

        {filteredModules.length === 0 && (
          <div className="fv-no-results">
            No modules match your search.
          </div>
        )}
      </section>

      <footer className="fv-footer">
        <span>◈ TOCVerse · VerifyX Lab</span>
        <span>Explore · Simulate · Verify</span>
        <span>Local Interactive Workspace</span>
      </footer>
    </div>
  );
}
