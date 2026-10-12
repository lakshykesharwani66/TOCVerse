import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import { VisualAutomatonEditor } from "./VisualAutomaton";
import { simulateDFA, validateDFA } from "./automata";

const SPEEDS = [
  { label: "Cinematic", value: 2200 },
  { label: "Normal", value: 1400 },
  { label: "Fast", value: 800 },
  { label: "Ultra", value: 450 }
];

export default function DFADebugger({ model, setModel }) {
  const [input, setInput] = useState("0101");
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(0);
  const [speed, setSpeed] = useState(1400);

  const [animation, setAnimation] = useState(null);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [breakpoints, setBreakpoints] = useState([]);
  const [message, setMessage] = useState("");

  const progressRef = useRef(0);
  const stepRef = useRef(0);
  const resultRef = useRef(null);
  const animationRef = useRef(null);
  const autoplayRef = useRef(false);
  const breakpointsRef = useRef([]);
  const speedRef = useRef(1400);
  const frameRef = useRef(null);
  const delayRef = useRef(null);
  const runIdRef = useRef(0);
  const advanceRef = useRef(null);

  const steps = result?.steps || [];
  const last = Math.max(0, steps.length - 1);
  const current = steps[step];
  const validationErrors = validateDFA(model);

  const finished =
    !!result &&
    !result.errors?.length &&
    step === last &&
    !animation;

  const cancelTimers = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (delayRef.current !== null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }, []);

  const cancelExecution = useCallback(() => {
    cancelTimers();
    runIdRef.current += 1;
    animationRef.current = null;
    autoplayRef.current = false;
    progressRef.current = 0;

    setAnimation(null);
    setProgress(0);
    setPaused(false);
    setAutoplay(false);
  }, [cancelTimers]);

  useEffect(() => {
    breakpointsRef.current = breakpoints;
  }, [breakpoints]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    return () => {
      cancelTimers();
      runIdRef.current += 1;
    };
  }, [cancelTimers]);

  useEffect(() => {
    cancelExecution();
    resultRef.current = null;
    stepRef.current = 0;
    setResult(null);
    setStep(0);
    setMessage("");

    setBreakpoints(previous =>
      previous.filter(state => model.states.includes(state))
    );
  }, [model, cancelExecution]);

  function setCurrentStep(index) {
    stepRef.current = index;
    setStep(index);
  }

  function setTrace(trace) {
    resultRef.current = trace;
    setResult(trace);
  }

  function advance(manual = false) {
    const trace = resultRef.current;

    if (!trace || trace.errors?.length) return;

    const fromIndex = stepRef.current;
    const toIndex = fromIndex + 1;

    if (toIndex >= trace.steps.length) {
      autoplayRef.current = false;
      setAutoplay(false);
      return;
    }

    cancelTimers();

    const from = trace.steps[fromIndex];
    const to = trace.steps[toIndex];

    const transition = {
      id: ++runIdRef.current,
      from: from.state,
      to: to.state,
      symbol: to.symbol,
      fromIndex,
      toIndex,
      duration: speedRef.current,
      manual
    };

    progressRef.current = 0;
    animationRef.current = transition;
    autoplayRef.current = !manual;

    setProgress(0);
    setPaused(false);
    setAutoplay(!manual);
    setAnimation(transition);
    setMessage("");
  }

  advanceRef.current = advance;

  function run() {
    cancelExecution();

    const trace = simulateDFA(model, input);

    setTrace(trace);
    setCurrentStep(0);
    setMessage("");

    if (trace.errors?.length || !trace.steps?.length) {
      return;
    }

    if (breakpointsRef.current.includes(trace.steps[0].state)) {
      setMessage(`Paused at start-state breakpoint: ${trace.steps[0].state}`);
      return;
    }

    if (trace.steps.length > 1) {
      autoplayRef.current = true;
      // Wait until state updates settle before starting.
      delayRef.current = setTimeout(() => {
        advanceRef.current?.(false);
      }, 180);
    }
  }

  function pause() {
    cancelTimers();
    autoplayRef.current = false;
    setAutoplay(false);
    setPaused(true);
    setMessage("Animation paused");
  }

  function play() {
    if (animationRef.current && !paused) {
      pause();
      return;
    }

    if (animationRef.current && paused) {
      autoplayRef.current = true;
      setAutoplay(true);
      setPaused(false);
      setMessage("");
      return;
    }

    if (!resultRef.current) {
      run();
      return;
    }

    if (resultRef.current.errors?.length) return;

    if (stepRef.current >= resultRef.current.steps.length - 1) {
      setCurrentStep(0);
    }

    autoplayRef.current = true;
    advanceRef.current?.(false);
  }

  function next() {
    if (!resultRef.current || animationRef.current) return;
    advanceRef.current?.(true);
  }

  function previous() {
    cancelExecution();
    setCurrentStep(Math.max(0, stepRef.current - 1));
    setMessage("Moved to previous execution state");
  }

  function reset() {
    cancelExecution();
    setCurrentStep(0);
    setMessage("");
  }

  function seek(index) {
    cancelExecution();
    setCurrentStep(index);
    setMessage(`Jumped to step ${index}`);
  }

  function changeInput(value) {
    cancelExecution();
    setInput(value);
    setTrace(null);
    setCurrentStep(0);
    setMessage("");
  }

  function toggleBreakpoint(state) {
    setBreakpoints(previous => {
      const next = previous.includes(state)
        ? previous.filter(item => item !== state)
        : [...previous, state];

      breakpointsRef.current = next;
      return next;
    });
  }

  /*
   * Pauseable animation clock.
   *
   * progressRef keeps the exact fraction completed.
   * Pausing stops requestAnimationFrame without resetting it.
   * Resuming starts from that fraction.
   */
  useEffect(() => {
    if (!animation || paused) return;

    const id = animation.id;
    const startingProgress = progressRef.current;
    const startedAt = performance.now();
    const remainingDuration =
      animation.duration * (1 - startingProgress);

    let localFrame = null;

    function tick(now) {
      if (animationRef.current?.id !== id) return;

      const elapsed = now - startedAt;

      const fraction = remainingDuration > 0
        ? Math.min(1, elapsed / remainingDuration)
        : 1;

      const nextProgress =
        startingProgress +
        (1 - startingProgress) * fraction;

      progressRef.current = nextProgress;
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        frameRef.current = null;
        animationRef.current = null;
        setAnimation(null);
        setCurrentStep(animation.toIndex);

        const trace = resultRef.current;
        const reachedBreakpoint =
          breakpointsRef.current.includes(animation.to);

        if (reachedBreakpoint) {
          autoplayRef.current = false;
          setAutoplay(false);
          setMessage(`Breakpoint reached: ${animation.to}`);
          return;
        }

        if (
          animation.toIndex >=
          (trace?.steps?.length || 0) - 1
        ) {
          autoplayRef.current = false;
          setAutoplay(false);
          return;
        }

        if (autoplayRef.current && !animation.manual) {
          delayRef.current = setTimeout(() => {
            advanceRef.current?.(false);
          }, 230);
        } else {
          autoplayRef.current = false;
          setAutoplay(false);
        }

        return;
      }

      localFrame = requestAnimationFrame(tick);
      frameRef.current = localFrame;
    }

    localFrame = requestAnimationFrame(tick);
    frameRef.current = localFrame;

    return () => {
      if (localFrame !== null) {
        cancelAnimationFrame(localFrame);
      }
    };
  }, [animation, paused]);

  const activeStates = animation
    ? progress < 0.85
      ? [animation.from]
      : [animation.to]
    : current
      ? [current.state]
      : [];

  const activeTransition = animation
    ? {
        from: animation.from,
        to: animation.to,
        symbol: animation.symbol,
        id: animation.id,
        duration: animation.duration,
        progress,
        paused
      }
    : null;

  const explanation = animation
    ? `${animation.from} → ${animation.to}: transmitting symbol "${animation.symbol}" (${Math.round(progress * 100)}%).`
    : current
      ? step === 0
        ? `Machine initialized in state ${current.state}.`
        : `Current state: ${current.state}. ${step} symbol(s) consumed.`
      : "Run the DFA to start the execution.";

  return (
    <div className="toc-debugger futuristic-debugger">
      <div className="toc-debugger-main">
        <VisualAutomatonEditor
          value={model}
          onChange={setModel}
          title="Visual Debugger 3.0"
          active={activeStates}
          activeTransition={activeTransition}
          breakpoints={breakpoints}
          animationId={animation?.id || 0}
          animationDuration={animation?.duration || speed}
        />

        <section className="toc-debug-panel">
          <div className="toc-debug-section-title">
            <div>
              <span className="toc-debug-overline">
                EXECUTION ENGINE 3.0
              </span>
              <h3>Futuristic Execution Control</h3>
            </div>

            <span className={`toc-live-badge ${autoplay ? "running" : ""}`}>
              {paused
                ? "⏸ PAUSED"
                : animation
                  ? "● TRANSMITTING"
                  : autoplay
                    ? "● RUNNING"
                    : "● STANDBY"}
            </span>
          </div>

          <label htmlFor="toc-dfa-input">
            Input String
          </label>

          <input
            id="toc-dfa-input"
            className="toc-debug-input"
            value={input}
            onChange={event => changeInput(event.target.value)}
            placeholder="Example: 0101"
          />

          <div className="toc-debug-controls">
            <button
              className="toc-debug-btn primary"
              onClick={run}
            >
              ▶ Run
            </button>

            <button
              className="toc-debug-btn"
              onClick={play}
              disabled={!!result?.errors?.length}
            >
              {animation && !paused ? "⏸ Pause" : "▶ Play"}
            </button>

            <button
              className="toc-debug-btn"
              onClick={previous}
              disabled={!result || step === 0}
            >
              ◀ Previous
            </button>

            <button
              className="toc-debug-btn"
              onClick={next}
              disabled={!result || !!animation || step >= last}
            >
              Next ▶
            </button>

            <button
              className="toc-debug-btn"
              onClick={reset}
            >
              ↺ Reset
            </button>

            <label className="toc-speed-label">
              Animation Speed
              <select
                className="toc-debug-input"
                value={speed}
                onChange={event => {
                  const value = Number(event.target.value);

                  if (animationRef.current && !paused) {
                    pause();
                  }

                  speedRef.current = value;
                  setSpeed(value);
                }}
              >
                {SPEEDS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="toc-debug-meter">
            <div
              style={{
                width: `${
                  last
                    ? ((step + (animation ? progress : 0)) / last) * 100
                    : finished ? 100 : 0
                }%`
              }}
            />
          </div>

          <div className="toc-debug-execution-status">
            <span>STEP {step} / {last}</span>
            <span>STATE {current?.state || "—"}</span>
            <span>
              {animation
                ? `${Math.round(progress * 100)}% TRANSMITTED`
                : "STABLE"}
            </span>
          </div>

          {validationErrors.map((error, index) => (
            <div className="toc-debug-result no" key={index}>
              {error}
            </div>
          ))}

          {result?.errors?.map((error, index) => (
            <div className="toc-debug-result no" key={index}>
              {error}
            </div>
          ))}

          {message && (
            <div className="toc-debug-result">
              {message}
            </div>
          )}

          {finished && (
            <div
              className={`toc-debug-result ${
                result.accepted ? "ok" : "no"
              } toc-final-result`}
            >
              {result.accepted
                ? "✦ ACCEPTED — Execution completed"
                : "✕ REJECTED — Input not accepted"}
            </div>
          )}
        </section>

        <section className="toc-debug-panel">
          <span className="toc-debug-overline">
            SYNCHRONIZED DATA STREAM
          </span>
          <h3>Holographic Input Tape</h3>

          <div className="toc-debug-tape">
            {input.length === 0 ? (
              <span className="toc-empty-symbol">ε</span>
            ) : (
              [...input].map((symbol, index) => {
                const transmitting =
                  !!animation &&
                  index === animation.fromIndex;

                return (
                  <div
                    key={index}
                    className={[
                      "toc-debug-cell",
                      index < step ? "consumed" : "",
                      index === step && result ? "next" : "",
                      transmitting ? "transmitting" : ""
                    ].filter(Boolean).join(" ")}
                    style={{
                      "--travel-duration": `${speed}ms`,
                      "--tape-progress": `${progress * 100}%`
                    }}
                  >
                    <span className="toc-tape-symbol">
                      {symbol}
                    </span>
                    <small>{index}</small>
                  </div>
                );
              })
            )}
          </div>

          <p>
            {step} / {input.length} symbols consumed
          </p>
        </section>
      </div>

      <aside className="toc-debugger-side">
        <section className="toc-debug-panel">
          <span className="toc-debug-overline">
            LIVE TELEMETRY
          </span>
          <h3>State Inspector</h3>

          <div className="toc-inspector-state">
            {current?.state || "—"}
          </div>

          <p>
            <strong>Input position:</strong> {result ? step : "—"}
          </p>

          <p>
            <strong>Accepting:</strong>{" "}
            {current
              ? model.finals.includes(current.state)
                ? "Yes"
                : "No"
              : "—"}
          </p>

          <p>
            <strong>Transition:</strong>{" "}
            {animation
              ? `${animation.from} —${animation.symbol}→ ${animation.to}`
              : "—"}
          </p>

          <p className="toc-explanation">
            {explanation}
          </p>
        </section>

        <section className="toc-debug-panel">
          <span className="toc-debug-overline">
            EXECUTION CONTROL
          </span>
          <h3>State Breakpoints</h3>

          <p>
            Pause automatically when execution reaches a selected state.
          </p>

          <div className="toc-debug-breakpoints">
            {model.states.map(state => (
              <button
                key={state}
                className={`toc-debug-breakpoint ${
                  breakpoints.includes(state) ? "enabled" : ""
                }`}
                onClick={() => toggleBreakpoint(state)}
                aria-pressed={breakpoints.includes(state)}
              >
                {breakpoints.includes(state) ? "●" : "○"} {state}
              </button>
            ))}
          </div>
        </section>

        <section className="toc-debug-panel">
          <span className="toc-debug-overline">
            EXECUTION MEMORY
          </span>
          <h3>Interactive Timeline</h3>

          {!result || result.errors?.length ? (
            <p>Run the DFA to generate its execution history.</p>
          ) : (
            <div className="toc-debug-timeline">
              {steps.map((item, index) => (
                <button
                  key={index}
                  onClick={() => seek(index)}
                  className={[
                    "toc-debug-step",
                    index === step ? "current" : "",
                    breakpoints.includes(item.state) ? "breakpoint" : ""
                  ].filter(Boolean).join(" ")}
                >
                  <strong>
                    STEP {String(index).padStart(2, "0")}
                  </strong>

                  <span>
                    {index === 0
                      ? `Initialize → ${item.state}`
                      : `${steps[index - 1].state} —${item.symbol}→ ${item.state}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}