
import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Play,
  Pause,
  RotateCcw,
  StepBack,
  StepForward,
  Gauge,
  CheckCircle2,
  XCircle
} from "lucide-react";

import { simulateDFA } from "./automata";
import { VisualAutomatonView } from "./VisualAutomaton";

import "./dfa-execution.css";

export default function DFAExecution({ model }) {
  const [input, setInput] = useState("0101");
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [error, setError] = useState("");

  const steps = result?.steps || [];
  const lastStep = Math.max(0, steps.length - 1);
  const current = steps[step];

  // Stop playback whenever the DFA changes.
  useEffect(() => {
    setPlaying(false);
    setResult(null);
    setStep(0);
    setError("");
  }, [model]);

  // Automatic playback.
  useEffect(() => {
    if (!playing || !result || step >= lastStep) {
      return;
    }

    const timer = setTimeout(() => {
      setStep(previous => Math.min(previous + 1, lastStep));
    }, speed);

    return () => clearTimeout(timer);
  }, [playing, result, step, lastStep, speed]);

  // Stop automatically at the final step.
  useEffect(() => {
    if (playing && step >= lastStep) {
      setPlaying(false);
    }
  }, [playing, step, lastStep]);

  function run() {
    try {
      setError("");
      const next = simulateDFA(model, input);

      if (next.errors?.length) {
        setError(next.errors.join("; "));
        setResult(null);
        setPlaying(false);
        return;
      }

      if (!Array.isArray(next.steps) || !next.steps.length) {
        setError("The simulator did not return execution steps.");
        setResult(null);
        return;
      }

      setResult(next);
      setStep(0);
      setPlaying(true);
    } catch (err) {
      setError(err.message || "Simulation failed.");
      setResult(null);
      setPlaying(false);
    }
  }

  function reset() {
    setPlaying(false);
    setStep(0);
  }

  function previous() {
    setPlaying(false);
    setStep(i => Math.max(0, i - 1));
  }

  function next() {
    setPlaying(false);
    setStep(i => Math.min(lastStep, i + 1));
  }

  function togglePlay() {
    if (!result) {
      run();
      return;
    }

    if (step >= lastStep) {
      setStep(0);
      setPlaying(true);
      return;
    }

    setPlaying(value => !value);
  }

  const activeTransition = useMemo(() => {
    if (!result || step === 0) return null;

    const previousState = steps[step - 1]?.state;
    const nextState = current?.state;

    if (!previousState || !nextState) return null;

    // Transition at index i consumes input[i - 1].
    const symbol = input[step - 1];

    if (symbol === undefined) return null;

    return {
      from: previousState,
      to: nextState,
      symbol
    };
  }, [result, steps, step, current, input]);

  const active = current?.state ? [current.state] : [];

  const finished = Boolean(result) && step === lastStep;

  const explanation = useMemo(() => {
    if (!result || !current) {
      return "Enter an input string and press Run Simulation.";
    }

    if (step === 0) {
      return `The DFA begins at its initial state ${current.state}. No input symbol has been consumed yet.`;
    }

    const transition = activeTransition;

    if (!transition) {
      return "The automaton is processing the execution trace.";
    }

    let message =
      `The DFA reads symbol "${transition.symbol}" ` +
      `in state ${transition.from} and follows ` +
      `δ(${transition.from}, ${transition.symbol}) = ${transition.to}.`;

    if (finished) {
      message += result.accepted
        ? ` The input is fully consumed and ${transition.to} is an accepting state.`
        : ` The input is fully consumed and ${transition.to} is not an accepting state.`;
    }

    return message;
  }, [result, current, step, activeTransition, finished]);

  return (
    <section className="exec-studio">
      <div className="exec-header">
        <div>
          <div className="exec-eyebrow">
            INTERACTIVE EXECUTION ENGINE
          </div>

          <h2>DFA Execution Studio</h2>

          <p>
            Visualize each transition and understand how
            the automaton processes an input string.
          </p>
        </div>

        <span className="exec-mode">
          DFA SIMULATION
        </span>
      </div>

      <div className="exec-setup">
        <div className="exec-input-group">
          <label htmlFor="dfa-execution-input">
            Input string
          </label>

          <input
            id="dfa-execution-input"
            value={input}
            onChange={event => {
              setInput(event.target.value);
              setPlaying(false);
              setResult(null);
              setStep(0);
              setError("");
            }}
            placeholder="Enter input string"
          />
        </div>

        <div className="exec-input-group">
          <label htmlFor="dfa-execution-speed">
            <Gauge size={14} />
            Playback speed
          </label>

          <select
            id="dfa-execution-speed"
            value={speed}
            onChange={event =>
              setSpeed(Number(event.target.value))
            }
          >
            <option value={1500}>Slow</option>
            <option value={800}>Normal</option>
            <option value={400}>Fast</option>
            <option value={200}>Very fast</option>
          </select>
        </div>

        <button
          type="button"
          className="exec-primary"
          onClick={run}
        >
          <Play size={16} />
          Run Simulation
        </button>
      </div>

      {error && (
        <div className="exec-error" role="alert">
          {error}
        </div>
      )}

      <div className="exec-layout">
        <div className="exec-left">
          <div className="exec-card">
            <div className="exec-card-heading">
              <h3>Live Automaton</h3>

              <span className="exec-live">
                {playing ? "● PLAYING" : "● READY"}
              </span>
            </div>

            <VisualAutomatonView
              model={model}
              active={active}
              activeTransition={activeTransition}
            />

            <div className="exec-controls">
              <button
                type="button"
                onClick={reset}
                disabled={!result}
                title="Reset"
              >
                <RotateCcw size={17} />
              </button>

              <button
                type="button"
                onClick={previous}
                disabled={!result || step === 0}
                title="Previous step"
              >
                <StepBack size={18} />
              </button>

              <button
                type="button"
                className="exec-play-button"
                onClick={togglePlay}
              >
                {playing ? (
                  <Pause size={20} />
                ) : (
                  <Play size={20} />
                )}
                {playing ? "Pause" : "Play"}
              </button>

              <button
                type="button"
                onClick={next}
                disabled={!result || step === lastStep}
                title="Next step"
              >
                <StepForward size={18} />
              </button>

              <div className="exec-step-counter">
                {result
                  ? `Step ${step} / ${lastStep}`
                  : "Not started"}
              </div>
            </div>
          </div>

          <div className="exec-card">
            <div className="exec-card-heading">
              <h3>Input Tape</h3>
              <span>READING LEFT TO RIGHT</span>
            </div>

            <div className="exec-tape">
              {input.length ? (
                [...input].map((symbol, index) => {
                  const consumed = Boolean(result) && index < step;
                  const nextSymbol = Boolean(result) && index === step;

                  return (
                    <div
                      key={index}
                      className={[
                        "exec-tape-cell",
                        consumed ? "consumed" : "",
                        nextSymbol && !finished ? "current" : ""
                      ].join(" ")}
                    >
                      <strong>{symbol}</strong>
                      <small>{index}</small>
                    </div>
                  );
                })
              ) : (
                <div className="exec-empty-tape">
                  ε — Empty input
                </div>
              )}
            </div>

            <div className="exec-progress-track">
              <div
                className="exec-progress-fill"
                style={{
                  width: result
                    ? `${(step / Math.max(1, lastStep)) * 100}%`
                    : "0%"
                }}
              />
            </div>

            <div className="exec-progress-caption">
              <span>
                {result ? Math.min(step, input.length) : 0}{" "}
                symbols processed
              </span>
              <span>{input.length} total</span>
            </div>
          </div>

          <div className="exec-card">
            <div className="exec-card-heading">
              <h3>Step Explanation</h3>
            </div>

            <div className="exec-explanation">
              <span className="exec-explanation-icon">✦</span>
              <p>{explanation}</p>
            </div>
          </div>
        </div>

        <div className="exec-right">
          <div className="exec-card">
            <div className="exec-card-heading">
              <h3>Execution Status</h3>
            </div>

            <div className="exec-status-grid">
              <div>
                <small>Current state</small>
                <strong>{current?.state || "—"}</strong>
              </div>

              <div>
                <small>Input length</small>
                <strong>{input.length}</strong>
              </div>

              <div>
                <small>Step</small>
                <strong>{result ? step : "—"}</strong>
              </div>

              <div>
                <small>Progress</small>
                <strong>
                  {result
                    ? `${Math.round(
                        (step / Math.max(1, lastStep)) * 100
                      )}%`
                    : "0%"}
                </strong>
              </div>
            </div>

            {finished && (
              <div
                className={
                  result.accepted
                    ? "exec-result accepted"
                    : "exec-result rejected"
                }
              >
                {result.accepted ? (
                  <CheckCircle2 size={21} />
                ) : (
                  <XCircle size={21} />
                )}

                <div>
                  <strong>
                    {result.accepted
                      ? "String Accepted"
                      : "String Rejected"}
                  </strong>

                  <p>
                    Execution finished at state{" "}
                    {current?.state || "—"}.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="exec-card">
            <div className="exec-card-heading">
              <h3>Execution Timeline</h3>
              <span>{steps.length} STATES</span>
            </div>

            {!result ? (
              <div className="exec-placeholder">
                Run a simulation to generate the execution
                timeline.
              </div>
            ) : (
              <div className="exec-timeline">
                {steps.map((item, index) => {
                  const selected = index === step;
                  const visited = index < step;

                  return (
                    <button
                      type="button"
                      key={index}
                      className={[
                        "exec-timeline-item",
                        selected ? "selected" : "",
                        visited ? "visited" : ""
                      ].join(" ")}
                      onClick={() => {
                        setPlaying(false);
                        setStep(index);
                      }}
                    >
                      <span className="exec-timeline-number">
                        {index}
                      </span>

                      <span className="exec-timeline-content">
                        <strong>
                          {index === 0
                            ? "Initial State"
                            : `Read "${input[index - 1] ?? "ε"}"`}
                        </strong>

                        <small>
                          {index === 0
                            ? `Start at ${item.state}`
                            : `${steps[index - 1]?.state} → ${item.state}`}
                        </small>
                      </span>

                      <span className="exec-timeline-state">
                        {item.state}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
