
import React, { useEffect, useMemo, useState } from "react";
import { VisualAutomatonView } from "./VisualAutomaton";
import { buildAlgorithmStudio } from "./algorithmStudio";

const STAGES = [
  { id: "regex", label: "Regular Expression" },
  { id: "nfa", label: "Thompson ε-NFA" },
  { id: "dfa", label: "Subset Construction" },
  { id: "minimize", label: "DFA Minimization" }
];

const styles = {
  root: {
    color: "#e8ecff",
    display: "grid",
    gap: 18
  },
  card: {
    background: "#151e38",
    border: "1px solid #303b60",
    borderRadius: 16,
    padding: 20,
    minWidth: 0
  },
  heading: {
    margin: "0 0 8px",
    fontSize: 22
  },
  muted: {
    color: "#a9b6d5",
    fontSize: 13
  },
  input: {
    background: "#0f172d",
    color: "#edf0ff",
    border: "1px solid #3c4970",
    borderRadius: 9,
    padding: "11px 13px",
    width: "100%",
    boxSizing: "border-box"
  },
  button: {
    background: "#292f54",
    color: "#f0eeff",
    border: "1px solid #555b94",
    borderRadius: 9,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 650
  },
  primary: {
    background: "linear-gradient(135deg,#6655e9,#8b5cf6)",
    border: "1px solid #998bff",
    color: "white"
  },
  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center"
  }
};

function StudioButton({
  children,
  onClick,
  disabled = false,
  primary = false
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.button,
        ...(primary ? styles.primary : {}),
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer"
      }}
    >
      {children}
    </button>
  );
}

function StageTabs({ stage, onSelect, availableStages }) {
  return (
    <div style={{ ...styles.row, marginTop: 16 }}>
      {STAGES.map(item => (
        <StudioButton
          key={item.id}
          primary={stage === item.id}
          disabled={!availableStages.includes(item.id)}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </StudioButton>
      ))}
    </div>
  );
}

function Statistics({ statistics }) {
  if (!statistics) return null;

  const items = [
    ["NFA States", statistics.nfaStates],
    ["DFA States", statistics.dfaStates],
    ["Minimized States", statistics.minimizedStates],
    ["States Removed", statistics.removedStates]
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
        gap: 12
      }}
    >
      {items.map(([label, value]) => (
        <div key={label} style={styles.card}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {value}
          </div>
          <div style={styles.muted}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function SubsetTable({ subsets }) {
  if (!subsets?.length) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 10 }}>
              DFA State
            </th>
            <th style={{ textAlign: "left", padding: 10 }}>
              NFA Subset
            </th>
          </tr>
        </thead>
        <tbody>
          {subsets.map(item => (
            <tr key={item.name}>
              <td style={{ padding: 10, borderTop: "1px solid #303b60" }}>
                {item.name}
              </td>
              <td style={{ padding: 10, borderTop: "1px solid #303b60" }}>
                {"{" + (item.states.join(", ") || "∅") + "}"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PartitionPanel({ partitions }) {
  if (!partitions?.length) return null;

  return (
    <div style={{ ...styles.row, marginTop: 12 }}>
      {partitions.map((group, index) => (
        <span
          key={index}
          style={{
            padding: "9px 13px",
            borderRadius: 10,
            background: "#252e50",
            border: "1px solid #565b92",
            fontSize: 13
          }}
        >
          P{index} = {"{" + group.join(", ") + "}"}
        </span>
      ))}
    </div>
  );
}

export default function VisualAlgorithmStudio() {
  const [pattern, setPattern] = useState("(0|1)*01");
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showTimeline, setShowTimeline] = useState(true);

  const steps = result?.steps || [];
  const maxStep = Math.max(0, steps.length - 1);
  const current = steps[stepIndex] || null;

  const currentStage = current?.stage || "regex";

  const availableStages = useMemo(
    () => [...new Set(steps.map(step => step.stage))],
    [steps]
  );

  function generate() {
    setPlaying(false);

    try {
      const next = buildAlgorithmStudio(pattern);
      setResult(next);
      setStepIndex(0);
    } catch (error) {
      setResult({
        errors: [error.message || "Unexpected algorithm error"],
        steps: [],
        stages: {}
      });
      setStepIndex(0);
    }
  }

  useEffect(() => {
    if (!playing || !steps.length) return;

    if (stepIndex >= maxStep) {
      setPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setStepIndex(index => Math.min(index + 1, maxStep));
    }, 950 / speed);

    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, maxStep, speed, steps.length]);

  useEffect(() => {
    generate();
    // Generate the default example when the studio opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function jumpTo(index) {
    setPlaying(false);
    setStepIndex(Math.max(0, Math.min(index, maxStep)));
  }

  function jumpToStage(stage) {
    const index = steps.findIndex(step => step.stage === stage);

    if (index !== -1) jumpTo(index);
  }

  function togglePlay() {
    if (!steps.length) return;

    if (playing) {
      setPlaying(false);
      return;
    }

    if (stepIndex >= maxStep) {
      setStepIndex(0);
    }

    setPlaying(true);
  }

  const progress = maxStep
    ? (stepIndex / maxStep) * 100
    : 0;

  return (
    <div style={styles.root}>
      <style>{`
        @keyframes studioAppear {
          from { opacity: 0; transform: translateY(9px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .visual-algorithm-graph {
          height: 510px;
          min-height: 510px;
          overflow: hidden;
          border: 1px solid #36436e;
          border-radius: 14px;
          background: #10172d;
        }

        .visual-algorithm-graph .toc-viewer {
          height: 100%;
        }

        .visual-algorithm-graph .toc-canvas {
          min-height: 0;
          height: 100%;
        }

        .visual-algorithm-timeline {
          max-height: 300px;
          overflow-y: auto;
          display: grid;
          gap: 8px;
        }

        .visual-algorithm-timeline button {
          text-align: left;
          padding: 12px;
          background: #111a32;
          color: #e9eaff;
          border: 1px solid #303b60;
          border-radius: 10px;
          cursor: pointer;
        }

        .visual-algorithm-timeline button.selected {
          background: #2b2859;
          border-color: #9d8dff;
        }

        .visual-algorithm-progress {
          height: 9px;
          overflow: hidden;
          background: #10172d;
          border-radius: 999px;
          border: 1px solid #3c4970;
        }

        .visual-algorithm-progress > div {
          height: 100%;
          background: linear-gradient(90deg,#6c65ee,#36d4a3);
          transition: width 0.3s ease;
        }
      `}</style>

      <section style={styles.card}>
        <div style={styles.muted}>
          TOCVERSE / INTERACTIVE ALGORITHM STUDIO
        </div>

        <h2 style={styles.heading}>
          Visual Algorithm Studio
        </h2>

        <p style={styles.muted}>
          Visualize the complete transformation from a regular
          expression to a minimized DFA.
        </p>

        <label
          htmlFor="studio-regex"
          style={{ display: "block", marginBottom: 8 }}
        >
          Regular Expression
        </label>

        <div style={styles.row}>
          <div style={{ flex: "1 1 250px" }}>
            <input
              id="studio-regex"
              style={styles.input}
              value={pattern}
              onChange={event => setPattern(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") generate();
              }}
              placeholder="Example: (0|1)*01"
            />
          </div>

          <StudioButton primary onClick={generate}>
            ▶ Generate & Visualize
          </StudioButton>
        </div>

        <StageTabs
          stage={currentStage}
          availableStages={availableStages}
          onSelect={jumpToStage}
        />
      </section>

      {result?.errors?.length > 0 && (
        <section style={styles.card}>
          <strong style={{ color: "#ff929e" }}>
            Unable to generate automata
          </strong>

          {result.errors.map((error, index) => (
            <p key={index} style={{ color: "#ffb4bd" }}>
              {error}
            </p>
          ))}
        </section>
      )}

      {current && (
        <>
          <Statistics statistics={result.statistics} />

          <section style={styles.card}>
            <div style={styles.row}>
              <span style={styles.muted}>
                {currentStage.toUpperCase()}
              </span>

              <span style={{ marginLeft: "auto", ...styles.muted }}>
                Step {stepIndex + 1} / {steps.length}
              </span>
            </div>

            <h3 style={{ marginBottom: 8 }}>
              {current.title}
            </h3>

            <p style={styles.muted}>
              {current.description}
            </p>

            {current.model?.states?.length ? (
              <div
                className="visual-algorithm-graph"
                key={currentStage}
              >
                <VisualAutomatonView
                  model={current.model}
                  active={current.active || []}
                  activeTransition={current.activeTransition || null}
                />
              </div>
            ) : (
              <div
                style={{
                  ...styles.card,
                  textAlign: "center",
                  padding: 45
                }}
              >
                Enter a regular expression to begin construction.
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              <div className="visual-algorithm-progress">
                <div style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div
              style={{
                ...styles.row,
                justifyContent: "center",
                marginTop: 18
              }}
            >
              <StudioButton onClick={() => jumpTo(0)}>
                ⏮ Reset
              </StudioButton>

              <StudioButton
                disabled={stepIndex === 0}
                onClick={() => jumpTo(stepIndex - 1)}
              >
                ◀ Previous
              </StudioButton>

              <StudioButton primary onClick={togglePlay}>
                {playing ? "⏸ Pause" : "▶ Play"}
              </StudioButton>

              <StudioButton
                disabled={stepIndex >= maxStep}
                onClick={() => jumpTo(stepIndex + 1)}
              >
                Next ▶
              </StudioButton>

              <select
                style={{
                  ...styles.input,
                  width: "auto"
                }}
                value={speed}
                onChange={event =>
                  setSpeed(Number(event.target.value))
                }
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={1.5}>1.5×</option>
                <option value={2}>2×</option>
                <option value={3}>3×</option>
              </select>
            </div>
          </section>

          {current.subsets?.length > 0 && (
            <section style={styles.card}>
              <h3>Discovered DFA Subsets</h3>
              <SubsetTable subsets={current.subsets} />
            </section>
          )}

          {current.partitions?.length > 0 && (
            <section style={styles.card}>
              <h3>Partition Refinement</h3>
              <p style={styles.muted}>
                States in the same partition are currently
                considered equivalent.
              </p>

              <PartitionPanel partitions={current.partitions} />
            </section>
          )}

          <section style={styles.card}>
            <div
              style={{
                ...styles.row,
                justifyContent: "space-between"
              }}
            >
              <h3 style={{ margin: 0 }}>
                Algorithm Execution Timeline
              </h3>

              <StudioButton
                onClick={() => setShowTimeline(value => !value)}
              >
                {showTimeline ? "Hide" : "Show"}
              </StudioButton>
            </div>

            {showTimeline && (
              <div
                className="visual-algorithm-timeline"
                style={{ marginTop: 15 }}
              >
                {steps.map((step, index) => (
                  <button
                    type="button"
                    key={index}
                    className={
                      index === stepIndex ? "selected" : ""
                    }
                    onClick={() => jumpTo(index)}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#a9b6d5",
                        marginBottom: 4
                      }}
                    >
                      Step {index + 1} · {step.stage}
                    </div>

                    <strong>{step.title}</strong>

                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 5,
                        color: "#a9b6d5"
                      }}
                    >
                      {step.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
