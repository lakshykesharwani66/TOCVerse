import React, { useState } from "react";

import { createRoot } from "react-dom/client";
import CFGDerivationVisualizer from "./CFGDerivationVisualizer";



import {

  defaultDFA,

  wrongDFA,

  validateDFA,

  simulateDFA,

  equivalentDFA,

  repairDFA,

  simulateNFA,

  minimizeDFA

} from "./automata";



import {

  sampleNFA,

  sampleCFG,

  samplePDA,

  sampleTM,

  nfaToDFA,

  regexToNFA,

  deriveCFG,

  simulatePDA,

  simulateTM,

  testDFA,

  createCertificate,

  verifyCertificate,

  explainDFA

} from "./advanced";



import {

  VisualAutomatonEditor,

  VisualAutomatonView

} from "./VisualAutomaton";



import DFADebugger from "./DFADebugger";
import VisualAlgorithmStudio from "./VisualAlgorithmStudio";



import "./style.css";



const clone = value =>

  JSON.parse(JSON.stringify(value));



const pages = [

  ["Dashboard", "◈"],

  ["DFA Simulator", "◎"],

  ["NFA & Conversion", "◇"],

  ["Regex Lab", "✳"],
  ["Visual Algorithm Studio", "⚡"],

  ["CFG & Derivation", "≡"],

  ["PDA Simulator", "▤"],

  ["Turing Machine", "▦"],

  ["DFA Minimizer", "↘"],

  ["Equivalence Checker", "⇄"],

  ["AutoFix VerifyX", "✦"],

  ["Smart Test Generator", "☷"],

  ["AI Tutor (Local)", "✧"],

  ["Challenge Mode", "★"],

  ["Protocol Verification", "⬡"],

  ["Experiments", "▣"]

];



/* ==========================================================

   SHARED STYLES

========================================================== */



const panel = {

  background: "#151e38",

  border: "1px solid #303b60",

  borderRadius: 14,

  padding: 20,

  marginBottom: 18

};



const row = {

  display: "flex",

  gap: 10,

  flexWrap: "wrap",

  alignItems: "center",

  margin: "12px 0"

};



const inputStyle = {

  background: "#0f172d",

  color: "#edf0ff",

  border: "1px solid #3c4970",

  borderRadius: 8,

  padding: "10px 12px",

  maxWidth: "100%"

};



const muted = {

  color: "#a9b6d5",

  fontSize: 13

};



/* ==========================================================

   REUSABLE COMPONENTS

========================================================== */



function Button({

  children,

  onClick,

  disabled = false

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      disabled={disabled}

    >

      {children}

    </button>

  );

}



function Panel({ title, children }) {

  return (

    <section style={panel}>

      <h3>{title}</h3>

      {children}

    </section>

  );

}



function Field({

  label,

  value,

  onChange,

  type = "text"

}) {

  return (

    <label

      style={{

        display: "flex",

        flexDirection: "column",

        gap: 6,

        flex: 1,

        minWidth: 150

      }}

    >

      <span style={muted}>

        {label}

      </span>



      <input

        style={inputStyle}

        type={type}

        value={value}

        onChange={event =>

          onChange(event.target.value)

        }

      />

    </label>

  );

}



function Select({

  label,

  value,

  options,

  onChange

}) {

  return (

    <label

      style={{

        display: "flex",

        flexDirection: "column",

        gap: 6,

        flex: 1,

        minWidth: 120

      }}

    >

      <span style={muted}>

        {label}

      </span>



      <select

        style={inputStyle}

        value={value}

        onChange={event =>

          onChange(event.target.value)

        }

      >

        {options.map(option => (

          <option

            key={option}

            value={option}

          >

            {option || "Select"}

          </option>

        ))}

      </select>

    </label>

  );

}



function Status({

  good,

  children

}) {

  return (

    <div

      style={{

        padding: 13,

        margin: "12px 0",

        borderRadius: 9,

        background: good

          ? "#143b30"

          : "#442434",

        color: good

          ? "#a5f4d3"

          : "#ffc7d6"

      }}

    >

      {good ? "✓ " : "✕ "}

      {children}

    </div>

  );

}



function Errors({ errors }) {

  return (errors || []).map(

    (error, index) => (

      <Status

        key={index}

        good={false}

      >

        {error}

      </Status>

    )

  );

}



function Preview({

  model,

  active = [],

  activeTransition = null,

  title = "Automaton Diagram"

}) {

  if (!model?.states?.length) {

    return null;

  }



  return (

    <Panel title={title}>

      <div style={{ height: 360 }}>

        <VisualAutomatonView

          model={model}

          active={active}

          activeTransition={

            activeTransition

          }

        />

      </div>

    </Panel>

  );

}



function Workspace({

  model,

  setModel,

  title,

  nfa = false

}) {

  return (

    <VisualAutomatonEditor

      value={model}

      onChange={setModel}

      title={title}

      nfa={nfa}

    />

  );

}



function Trace({

  steps = [],

  nfa = false

}) {

  return (

    <div style={{ overflowX: "auto" }}>

      <table className="data-table">

        <thead>

          <tr>

            <th>Step</th>

            <th>Symbol</th>

            <th>State(s)</th>

          </tr>

        </thead>



        <tbody>

          {steps.map((step, index) => (

            <tr key={index}>

              <td>{index}</td>



              <td>

                {step.symbol || "ε"}

              </td>



              <td>

                {nfa

                  ? (

                      step.states || []

                    ).join(", ") || "∅"

                  : step.state}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}



function exportJSON(

  filename,

  data

) {

  const blob = new Blob(

    [

      JSON.stringify(

        data,

        null,

        2

      )

    ],

    {

      type: "application/json"

    }

  );



  const url =

    URL.createObjectURL(blob);



  const anchor =

    document.createElement("a");



  anchor.href = url;

  anchor.download = filename;

  anchor.click();



  URL.revokeObjectURL(url);

}



/* ==========================================================

   1. DFA SIMULATOR — VISUAL DEBUGGER 2.0

========================================================== */



function DFASection({

  model,

  setModel

}) {

  return (

    <DFADebugger

      model={model}

      setModel={setModel}

    />

  );

}



/* ==========================================================

   2. NFA & CONVERSION

========================================================== */



function NFASection({

  model,

  setModel

}) {

  const [input, setInput] =

    useState("01");



  const [result, setResult] =

    useState(null);



  const [converted, setConverted] =

    useState(null);



  const [step, setStep] =

    useState(0);



  const active =

    result?.steps?.[step]?.states ||

    [];



  return (

    <>

      <Workspace

        model={model}

        setModel={next => {

          setModel(next);

          setResult(null);

          setConverted(null);

          setStep(0);

        }}

        title="NFA Visual Studio"

        nfa

      />



      <Panel title="NFA Simulator">

        <Field

          label="Input string"

          value={input}

          onChange={value => {

            setInput(value);

            setResult(null);

            setStep(0);

          }}

        />



        <div style={row}>

          <Button

            onClick={() => {

              setResult(

                simulateNFA(

                  model,

                  input

                )

              );

              setStep(0);

            }}

          >

            Simulate NFA

          </Button>



          <Button

            onClick={() =>

              setConverted(

                nfaToDFA(model)

              )

            }

          >

            Convert to DFA

          </Button>

        </div>



        <Errors

          errors={result?.errors}

        />



        {result &&

          !result.errors?.length && (

            <>

              <Status

                good={result.accepted}

              >

                String{" "}

                {result.accepted

                  ? "accepted"

                  : "rejected"}

              </Status>



              <div style={row}>

                <Button

                  disabled={step === 0}

                  onClick={() =>

                    setStep(

                      index =>

                        index - 1

                    )

                  }

                >

                  Previous

                </Button>



                <span>

                  Step {step} /{" "}

                  {result.steps.length -

                    1}

                </span>



                <Button

                  disabled={

                    step >=

                    result.steps.length -

                      1

                  }

                  onClick={() =>

                    setStep(

                      index =>

                        index + 1

                    )

                  }

                >

                  Next

                </Button>

              </div>



              <Trace

                steps={result.steps}

                nfa

              />

            </>

          )}

      </Panel>



      <Preview

        model={model}

        active={active}

        title="NFA Active States"

      />



      {converted && (

        <>

          <Errors

            errors={

              converted.errors

            }

          />



          {converted.automaton && (

            <>

              <Preview

                model={

                  converted.automaton

                }

                title="Converted DFA"

              />



              <Panel title="Subset Construction">

                {converted.subsets?.map(

                  subset => (

                    <div

                      key={

                        subset.name

                      }

                      style={row}

                    >

                      <strong>

                        {subset.name}

                      </strong>



                      {" = {"}

                      {subset.states.join(

                        ", "

                      ) || "∅"}

                      {"}"}

                    </div>

                  )

                )}

              </Panel>

            </>

          )}

        </>

      )}

    </>

  );

}



/* ==========================================================

   3. REGEX LAB

========================================================== */



function RegexSection() {
  const [pattern, setPattern] = useState("(0|1)*01");
  const [result, setResult] = useState(null);
  const [input, setInput] = useState("1101");
  const [test, setTest] = useState(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showTimeline, setShowTimeline] = useState(true);

  const steps = test?.steps || [];
  const maxStep = Math.max(0, steps.length - 1);
  const activeStates = steps[step]?.states || [];
  const finished = Boolean(test && step >= maxStep);
  const consumedCount = steps.slice(1, step + 1).reduce((count, item) => {
    const symbol = item?.symbol;
    return count + (symbol && symbol !== "ε" && symbol !== "λ" ? String(symbol).length : 0);
  }, 0);

  React.useEffect(() => {
    if (!playing || !test) return;
    if (step >= maxStep) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setStep(current => Math.min(current + 1, maxStep));
    }, Math.round(1000 / speed));
    return () => window.clearTimeout(timer);
  }, [playing, test, step, maxStep, speed]);

  function generate() {
    setPlaying(false);
    setTest(null);
    setStep(0);
    setResult(regexToNFA(pattern));
  }

  function prepare() {
    if (!result?.nfa) return null;
    const next = simulateNFA(result.nfa, input);
    setTest(next);
    setStep(0);
    return next;
  }

  function play() {
    const simulation = test || prepare();
    if (!simulation || simulation.errors?.length) return;
    if (step >= Math.max(0, (simulation.steps?.length || 1) - 1)) setStep(0);
    setPlaying(true);
  }

  const btn = (primary = false) => ({
    background: primary ? "linear-gradient(120deg,#6c59d9,#9d78ee)" : "#202b4d",
    border: `1px solid ${primary ? "#ac9aff" : "#46567e"}`,
    color: "#fff", borderRadius: 10, padding: "11px 16px",
    fontWeight: 750, cursor: "pointer"
  });

  return (
    <div className="toc-regex-lab">
      <style>{`
        .toc-regex-lab .regex-card{background:linear-gradient(135deg,#1b2546,#111a32);border:1px solid #3b4b77;border-radius:18px;padding:23px;margin-bottom:19px}
        .toc-regex-lab .regex-eyebrow{color:#b5a6ff;font-size:11px;font-weight:800;letter-spacing:2px}
        .toc-regex-lab .regex-card h2{color:#fff;font-size:27px;margin:12px 0}
        .toc-regex-lab .regex-graph{height:510px;position:relative;overflow:hidden;background:radial-gradient(ellipse at center,#222d522b,#0c1529);border:1px solid #394a75;border-radius:13px}
        .toc-regex-lab .regex-graph.running{border-color:#8f7af2;box-shadow:0 0 22px #7157e12a}
        .toc-regex-lab .regex-controls{background:#101a33;border:1px solid #34436b;border-radius:14px;padding:19px;margin-top:18px}
        .toc-regex-lab .regex-actions{display:flex;flex-wrap:wrap;gap:9px;margin:16px 0}
        .toc-regex-lab .regex-actions button:disabled{opacity:.4;cursor:not-allowed}
        .toc-regex-lab .regex-progress{height:8px;background:#2b3859;border-radius:10px;overflow:hidden;margin:19px 0 10px}
        .toc-regex-lab .regex-progress div{height:100%;background:linear-gradient(90deg,#6c59dd,#a08cff,#5de4b8);transition:width .35s ease;box-shadow:0 0 13px #9786ff}
        .toc-regex-lab .regex-tape{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 20px}
        .toc-regex-lab .regex-cell{width:45px;height:48px;display:grid;place-items:center;border:1px solid #455680;background:#1b2747;border-radius:9px;font-size:18px;font-weight:800;transition:all .25s}
        .toc-regex-lab .regex-cell.past{background:#174637;border-color:#4ad8a7;color:#b0ffe3}
        .toc-regex-lab .regex-cell.current{background:#5643a2;border-color:#b9a6ff;animation:regex-tape-pulse 1s ease-in-out infinite alternate}
        .toc-regex-lab .regex-state{display:inline-block;padding:8px 12px;margin:4px;background:#332b60;border:1px solid #9784f4;border-radius:9px;color:#f2edff;font-weight:700;animation:regex-state-pulse 1.2s ease-in-out infinite alternate}
        .toc-regex-lab .regex-result{padding:18px;border-radius:12px;text-align:center;font-size:19px;font-weight:900;margin-top:18px;animation:regex-result-in .4s ease-out}
        .toc-regex-lab .regex-result.accept{background:#163d33;color:#a2f8d5;border:1px solid #44c596}
        .toc-regex-lab .regex-result.reject{background:#442639;color:#ffc4d4;border:1px solid #bf6b88}
        .toc-regex-lab .regex-timeline{display:flex;overflow-x:auto;gap:9px;padding:12px 0}
        .toc-regex-lab .regex-timeline button{min-width:125px;text-align:left;background:#192542;border:1px solid #415077;border-radius:10px;padding:12px;color:#d7def5;cursor:pointer}
        .toc-regex-lab .regex-timeline button.selected{background:#45377b;border-color:#aa98ff}
        .toc-regex-lab .regex-timeline small{display:block;font-size:11px;margin-top:7px}
        @keyframes regex-tape-pulse{to{transform:scale(1.08);box-shadow:0 0 20px #977aff80}}
        @keyframes regex-state-pulse{to{box-shadow:0 0 15px #9075ee}}
        @keyframes regex-result-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:650px){.toc-regex-lab .regex-graph{height:350px}.toc-regex-lab .regex-card{padding:15px}}
        @media(prefers-reduced-motion:reduce){.toc-regex-lab *{animation:none!important;transition:none!important}}
      `}</style>

      <section className="regex-card">
        <div className="regex-eyebrow">TOCVERSE / FORMAL LANGUAGES</div>
        <h2>Regular Expression Laboratory</h2>
        <p style={muted}>Generate a Thompson ε-NFA and animate its execution step by step.</p>
        <Field label="Regular expression" value={pattern} onChange={value => {
          setPattern(value); setResult(null); setTest(null); setPlaying(false); setStep(0);
        }} />
        <p style={muted}>Supports union (|), concatenation, Kleene star (*), parentheses and ε.</p>
        <button type="button" style={btn(true)} onClick={generate}>✦ Generate NFA</button>
      </section>
      <Errors errors={result?.errors} />

      {result?.nfa && <>
        <section className="regex-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:15}}>
            <h3 style={{margin:0}}>Thompson Construction — Live NFA</h3>
            <span style={{color:playing?"#8cf5c9":"#b2c0e4",fontSize:12}}>
              ● {playing ? "SIMULATION RUNNING" : "READY"}
            </span>
          </div>
          <div className={`regex-graph ${playing ? "running" : ""}`}>
            <VisualAutomatonView model={result.nfa} active={activeStates} />
          </div>

          <div className="regex-controls">
            <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",alignItems:"center"}}>
              <strong>▶ NFA Execution Debugger</strong>
              <label style={muted}>Speed{" "}
                <select style={inputStyle} value={speed} onChange={event => setSpeed(Number(event.target.value))}>
                  <option value={0.5}>0.5×</option>
                  <option value={1}>1×</option>
                  <option value={1.5}>1.5×</option>
                  <option value={2}>2×</option>
                  <option value={3}>3×</option>
                </select>
              </label>
            </div>
            <div style={{marginTop:14}}>
              <Field label="Input string" value={input} onChange={value => {
                setInput(value); setTest(null); setPlaying(false); setStep(0);
              }} />
            </div>
            <div className="regex-actions">
              <button type="button" style={btn(true)} onClick={playing ? () => setPlaying(false) : play}>
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>
              <button type="button" style={btn()} disabled={!test || step === 0} onClick={() => {
                setPlaying(false); setStep(current => Math.max(0,current - 1));
              }}>⏮ Previous</button>
              <button type="button" style={btn()} disabled={Boolean(test && step >= maxStep)} onClick={() => {
                setPlaying(false);
                if (!test) prepare();
                else setStep(current => Math.min(maxStep,current + 1));
              }}>Next ⏭</button>
              <button type="button" style={btn()} onClick={() => {setPlaying(false);setStep(0);}}>↺ Reset</button>
              <button type="button" style={btn()} onClick={() => {setPlaying(false);prepare();}}>⚡ Test String</button>
            </div>
            <div className="regex-progress"><div style={{width:`${test && maxStep ? step / maxStep * 100 : 0}%`}} /></div>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",...muted}}>
              <span>Step {step} / {maxStep}</span>
              <span>Consumed {Math.min(consumedCount,input.length)} / {input.length} symbols</span>
            </div>
            <h4 style={{marginBottom:8}}>Input Tape</h4>
            <div className="regex-tape">
              {input.length === 0 ? <span style={muted}>ε — Empty input</span> :
                [...input].map((symbol,index) => <div key={index} className={`regex-cell ${test && index < consumedCount ? "past" : ""} ${test && !finished && index === consumedCount ? "current" : ""}`}>{symbol}</div>)}
            </div>
            <h4 style={{marginBottom:6}}>Active NFA States</h4>
            <p style={muted}>Multiple states can be active simultaneously because of nondeterminism and ε-closure.</p>
            {test ? (activeStates.length ? activeStates.map(state => <span className="regex-state" key={state}>● {state}</span>) : <span style={muted}>∅ — No active states</span>) : <span style={muted}>Press Play to start the animation.</span>}
            <Errors errors={test?.errors} />
            {finished && !test?.errors?.length && <div className={`regex-result ${test.accepted ? "accept" : "reject"}`}>
              {test.accepted ? "✓ STRING ACCEPTED" : "✕ STRING REJECTED"}
            </div>}
          </div>
        </section>

        {test && !test.errors?.length && <section className="regex-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <h3>Execution Timeline</h3>
            <button type="button" style={btn()} onClick={() => setShowTimeline(value => !value)}>{showTimeline ? "Hide Timeline" : "Show Timeline"}</button>
          </div>
          {showTimeline && <>
            <div className="regex-timeline">
              {steps.map((entry,index) => <button type="button" key={index} className={index === step ? "selected" : ""} onClick={() => {setPlaying(false);setStep(index);}}>
                <strong>Step {index}</strong>
                <small>{index === 0 ? "Initial ε-closure" : `Read: ${entry.symbol || "ε"}`}</small>
                <small>{(entry.states || []).join(", ") || "∅"}</small>
              </button>)}
            </div>
            <Trace steps={steps} nfa />
          </>}
        </section>}
      </>}
    </div>
  );
}


/* ==========================================================

   4. CFG & DERIVATION

========================================================== */



function CFGSection() {
  const [grammar, setGrammar] = useState(clone(sampleCFG));
  const [variable, setVariable] = useState("S");
  const [production, setProduction] = useState("");
  const [target, setTarget] = useState("aabb");
  const [result, setResult] = useState(null);
  const actionStyle = { background: "#5142a0", color: "#fff", border: "1px solid #8b7be4", borderRadius: 9, padding: "9px 14px", cursor: "pointer" };
  const changeGrammar = next => { setGrammar(next); setResult(null); };
  const add = () => {
    const v = variable.trim(), p = production.trim();
    if (!v || !p) return;
    changeGrammar({ ...grammar, rules: { ...grammar.rules, [v]: [...new Set([...(grammar.rules[v] || []), p])] } });
    setProduction("");
  };
  return <>
    <Panel title="CFG Builder">
      <p style={muted}>Build your grammar. Use ε for the empty production. Variables and symbols are single characters.</p>
      <Field label="Start variable" value={grammar.start} onChange={start => changeGrammar({ ...grammar, start })} />
      <div style={row}>
        <Field label="Variable" value={variable} onChange={setVariable} />
        <Field label="Production" value={production} onChange={setProduction} />
        <button type="button" style={actionStyle} onClick={add}>+ Add Production</button>
      </div>
      {Object.entries(grammar.rules).flatMap(([name, productions]) => productions.map(rule =>
        <div key={`${name}-${rule}`} style={{...row, padding: 10, background: "#111a32", borderRadius: 10}}>
          <strong style={{minWidth: 110}}>{name} → {rule}</strong>
          <button type="button" style={actionStyle} onClick={() => changeGrammar({ ...grammar, rules: { ...grammar.rules, [name]: grammar.rules[name].filter(item => item !== rule) } })}>Remove</button>
        </div>
      ))}
    </Panel>
    <Panel title="Grammar Derivation">
      <Field label="Target string" value={target} onChange={value => { setTarget(value); setResult(null); }} />
      <div style={row}>
        <button type="button" style={actionStyle} onClick={() => setResult(deriveCFG(grammar, target))}>▶ Find Derivation & Generate Tree</button>
      </div>
      {result && <>
        <Status good={result.accepted}>{result.accepted ? "Derivation found" : "No derivation found within bounds"}</Status>
        <p style={muted}>Configurations checked: {result.checked}</p>
        {result.path?.map((form, index) => <div key={index} style={{padding: "6px 0"}}>{index ? "⇒ " : ""}{form || "ε"}</div>)}
        {result.message && <p style={muted}>{result.message}</p>}
      </>}
    </Panel>
    <CFGDerivationVisualizer grammar={grammar} result={result} />
  </>;
}


/* ==========================================================

   5. PDA SIMULATOR

========================================================== */



function PDASection() {

  const [model, setModel] =

    useState(

      clone(samplePDA)

    );



  const [input, setInput] =

    useState("aabb");



  const [result, setResult] =

    useState(null);



  const [draft, setDraft] =

    useState({

      from: "q0",

      read: "a",

      pop: "ε",

      push: "A",

      to: "q0"

    });



  return (

    <>

      <Panel title="PDA Transition Editor">

        <p style={muted}>

          Use ε for an empty

          input, pop or push

          operation.

        </p>



        <div style={row}>

          {Object.keys(

            draft

          ).map(key => (

            <Field

              key={key}

              label={

                key.toUpperCase()

              }

              value={

                draft[key]

              }

              onChange={value =>

                setDraft(

                  current => ({

                    ...current,

                    [key]: value

                  })

                )

              }

            />

          ))}

        </div>



        <Button

          onClick={() => {

            setModel(

              current => ({

                ...current,

                transitions: [

                  ...current.transitions,

                  {

                    ...draft

                  }

                ]

              })

            );



            setResult(null);

          }}

        >

          Add Transition

        </Button>



        <div

          style={{

            overflowX: "auto"

          }}

        >

          <table className="data-table">

            <thead>

              <tr>

                <th>From</th>

                <th>Read</th>

                <th>Pop</th>

                <th>Push</th>

                <th>To</th>

                <th>Action</th>

              </tr>

            </thead>



            <tbody>

              {model.transitions.map(

                (

                  transition,

                  index

                ) => (

                  <tr

                    key={index}

                  >

                    {[

                      "from",

                      "read",

                      "pop",

                      "push",

                      "to"

                    ].map(

                      key => (

                        <td

                          key={

                            key

                          }

                        >

                          {

                            transition[

                              key

                            ]

                          }

                        </td>

                      )

                    )}



                    <td>

                      <Button

                        onClick={() => {

                          setModel(

                            current => ({

                              ...current,

                              transitions:

                                current.transitions.filter(

                                  (

                                    _,

                                    position

                                  ) =>

                                    position !==

                                    index

                                )

                            })

                          );

                          setResult(null);

                        }}

                      >

                        Delete

                      </Button>

                    </td>

                  </tr>

                )

              )}

            </tbody>

          </table>

        </div>

      </Panel>



      <Panel title="PDA Execution">

        <Field

          label="Input string"

          value={input}

          onChange={value => {

            setInput(value);

            setResult(null);

          }}

        />



        <div style={row}>

          <Button

            onClick={() =>

              setResult(

                simulatePDA(

                  model,

                  input

                )

              )

            }

          >

            Run PDA

          </Button>

        </div>



        {result && (

          <>

            <Status

              good={

                result.accepted

              }

            >

              {result.accepted

                ? "Accepted"

                : "Not accepted"}

            </Status>



            <p style={muted}>

              Explored:{" "}

              {result.explored}

            </p>



            {result.message && (

              <p>

                {result.message}

              </p>

            )}



            {result.steps?.map(

              (

                current,

                index

              ) => (

                <div

                  key={index}

                  style={row}

                >

                  Step{" "}

                  {index + 1}:{" "}

                  {current.state},

                  input index{" "}

                  {current.index},

                  stack{" "}

                  {(

                    current.stack ||

                    []

                  ).join("") ||

                    "ε"}

                </div>

              )

            )}

          </>

        )}

      </Panel>

    </>

  );

}



/* ==========================================================

   6. TURING MACHINE

========================================================== */



function TMSection() {

  const [model, setModel] =

    useState(

      clone(sampleTM)

    );



  const [input, setInput] =

    useState("10101");



  const [limit, setLimit] =

    useState("250");



  const [result, setResult] =

    useState(null);



  const [draft, setDraft] =

    useState({

      state: "q0",

      read: "0",

      next: "q0",

      write: "0",

      direction: "R"

    });



  return (

    <>

      <Panel title="Turing Machine Rule Editor">

        <div style={row}>

          {[

            "state",

            "read",

            "next",

            "write"

          ].map(key => (

            <Field

              key={key}

              label={

                key.toUpperCase()

              }

              value={

                draft[key]

              }

              onChange={value =>

                setDraft(

                  current => ({

                    ...current,

                    [key]: value

                  })

                )

              }

            />

          ))}



          <Select

            label="Direction"

            value={

              draft.direction

            }

            options={[

              "L",

              "R",

              "S"

            ]}

            onChange={value =>

              setDraft(

                current => ({

                  ...current,

                  direction:

                    value

                })

              )

            }

          />

        </div>



        <Button

          onClick={() => {

            setModel(

              current => ({

                ...current,

                transitions: {

                  ...current.transitions,

                  [`${draft.state}|${draft.read}`]:

                    [

                      draft.next,

                      draft.write,

                      draft.direction

                    ]

                }

              })

            );

            setResult(null);

          }}

        >

          Add / Update Rule

        </Button>



        {Object.entries(

          model.transitions

        ).map(

          ([

            key,

            rule

          ]) => (

            <div

              key={key}

              style={row}

            >

              <strong>

                {key}

              </strong>



              {" → "}

              {rule.join(", ")}



              <Button

                onClick={() => {

                  setModel(

                    current => {

                      const next =

                        clone(

                          current

                        );



                      delete next.transitions[

                        key

                      ];



                      return next;

                    }

                  );

                  setResult(null);

                }}

              >

                Delete

              </Button>

            </div>

          )

        )}

      </Panel>



      <Panel title="Turing Machine Execution">

        <div style={row}>

          <Field

            label="Tape input"

            value={input}

            onChange={value => {

              setInput(value);

              setResult(null);

            }}

          />



          <Field

            label="Maximum steps"

            value={limit}

            onChange={

              setLimit

            }

          />

        </div>



        <Button

          onClick={() =>

            setResult(

              simulateTM(

                model,

                input,

                Math.max(

                  1,

                  Number(

                    limit

                  ) || 250

                )

              )

            )

          }

        >

          Execute Machine

        </Button>



        {result && (

          <>

            <Status

              good={

                result.halted &&

                result.accepted

              }

            >

              {result.halted

                ? result.accepted

                  ? "Machine accepted"

                  : "Machine halted without accepting"

                : "Step limit reached — halting unknown"}

            </Status>



            {result.error && (

              <p>

                {result.error}

              </p>

            )}



            <p style={muted}>

              Recorded{" "}

              {result.steps

                ?.length || 0}{" "}

              steps

            </p>



            <div

              style={{

                overflowX: "auto"

              }}

            >

              <table className="data-table">

                <thead>

                  <tr>

                    <th>Step</th>

                    <th>State</th>

                    <th>Head</th>

                    <th>Tape</th>

                  </tr>

                </thead>



                <tbody>

                  {result.steps

                    ?.slice(

                      0,

                      100

                    )

                    .map(

                      current => (

                        <tr

                          key={

                            current.step

                          }

                        >

                          <td>

                            {

                              current.step

                            }

                          </td>



                          <td>

                            {

                              current.state

                            }

                          </td>



                          <td>

                            {

                              current.head

                            }

                          </td>



                          <td>

                            {current.tape

                              .map(

                                ([

                                  index,

                                  symbol

                                ]) =>

                                  `${index}:${symbol}`

                              )

                              .join(

                                " "

                              )}

                          </td>

                        </tr>

                      )

                    )}

                </tbody>

              </table>

            </div>

          </>

        )}

      </Panel>

    </>

  );

}



/* ==========================================================

   7. DFA MINIMIZER

========================================================== */



function MinimizerSection({

  model,

  setModel

}) {

  const [result, setResult] =

    useState(null);



  return (

    <>

      <Workspace

        model={model}

        setModel={next => {

          setModel(next);

          setResult(null);

        }}

        title="DFA Minimization Studio"

      />



      <Panel title="Partition Refinement">

        <Button

          onClick={() =>

            setResult(

              minimizeDFA(

                model

              )

            )

          }

        >

          Minimize DFA

        </Button>



        <Errors

          errors={result?.errors}

        />



        {result?.automaton && (

          <>

            <Status good>

              {

                model.states

                  .length

              }{" "}

              states →{" "}

              {

                result.automaton

                  .states.length

              }{" "}

              states

            </Status>



            <Button

              onClick={() => {

                setModel(

                  clone(

                    result.automaton

                  )

                );

                setResult(null);

              }}

            >

              Use Minimized DFA

            </Button>

          </>

        )}

      </Panel>



      {result?.automaton && (

        <>

          <Preview

            model={model}

            title="Original DFA"

          />



          <Preview

            model={

              result.automaton

            }

            title="Minimized DFA"

          />



          <Panel title="Equivalent State Groups">

            {result.groups?.map(

              (

                group,

                index

              ) => (

                <p

                  key={index}

                >

                  M{index} ={" "}

                  {"{"}

                  {group.join(

                    ", "

                  )}

                  {"}"}

                </p>

              )

            )}

          </Panel>

        </>

      )}

    </>

  );

}



/* ==========================================================

   8. EQUIVALENCE CHECKER

========================================================== */



function ComparisonSection({

  student,

  setStudent,

  reference,

  setReference

}) {

  const [result, setResult] =

    useState(null);



  const [

    certificate,

    setCertificate

  ] = useState(null);



  return (

    <>

      <Workspace

        model={student}

        setModel={next => {

          setStudent(next);

          setResult(null);

          setCertificate(null);

        }}

        title="Student DFA"

      />



      <Workspace

        model={reference}

        setModel={next => {

          setReference(next);

          setResult(null);

          setCertificate(null);

        }}

        title="Reference DFA"

      />



      <Panel title="Formal Equivalence Verification">

        <div style={row}>

          <Button

            onClick={() => {

              setResult(

                equivalentDFA(

                  student,

                  reference

                )

              );



              setCertificate(

                null

              );

            }}

          >

            Compare DFAs

          </Button>



          <Button

            onClick={() =>

              setCertificate(

                createCertificate(

                  student,

                  reference

                )

              )

            }

          >

            Generate Verification Record

          </Button>

        </div>



        <Errors

          errors={result?.errors}

        />



        {result &&

          !result.errors?.length && (

            <>

              <Status

                good={

                  result.equivalent

                }

              >

                {result.equivalent

                  ? "Equivalent"

                  : "Not equivalent"}

              </Status>



              <p>

                Checked state

                pairs:{" "}

                {result.checked}

              </p>



              {!result.equivalent && (

                <p>

                  Counterexample:{" "}

                  {result.witness ||

                    "ε"}

                </p>

              )}

            </>

          )}



        {certificate && (

          <Status

            good={

              verifyCertificate(

                student,

                reference,

                certificate

              ).valid

            }

          >

            Verification record

            generated and

            rechecked.

          </Status>

        )}



        {!certificate &&

          result?.equivalent && (

            <p style={muted}>

              A verification

              record can be

              generated for

              equivalent DFAs.

            </p>

          )}

      </Panel>



      <Preview

        model={student}

        title="Student Diagram"

      />



      <Preview

        model={reference}

        title="Reference Diagram"

      />

    </>

  );

}



/* ==========================================================

   9. AUTOFIX VERIFYX

========================================================== */



function AutoFixSection({

  student,

  setStudent,

  reference,

  setReference

}) {

  const [maxEdits, setMaxEdits] =

    useState("2");



  const [result, setResult] =

    useState(null);



  const solution =

    result?.repairs?.[0];



  return (

    <>

      <Workspace

        model={student}

        setModel={next => {

          setStudent(next);

          setResult(null);

        }}

        title="Student DFA — Repair Target"

      />



      <Workspace

        model={reference}

        setModel={next => {

          setReference(next);

          setResult(null);

        }}

        title="Reference DFA"

      />



      <Panel title="VerifyX — Verified AutoFix">

        <p style={muted}>

          Search for transition

          edits verified by DFA

          equivalence.

        </p>



        <div style={row}>

          <Select

            label="Maximum edits"

            value={maxEdits}

            options={[

              "1",

              "2",

              "3"

            ]}

            onChange={

              setMaxEdits

            }

          />



          <Button

            onClick={() =>

              setResult(

                repairDFA(

                  student,

                  reference,

                  Number(

                    maxEdits

                  )

                )

              )

            }

          >

            Find Verified Repair

          </Button>

        </div>



        <Errors

          errors={result?.errors}

        />



        {result?.alreadyCorrect && (

          <Status good>

            Already equivalent.

          </Status>

        )}



        {solution && (

          <>

            <Status good>

              Verified repair

              found.

            </Status>



            {solution.edits.map(

              (

                edit,

                index

              ) => (

                <p

                  key={index}

                >

                  δ(

                  {edit.state},

                  {" "}

                  {edit.symbol}

                  ):{" "}

                  {edit.from}

                  {" → "}

                  {edit.to}

                </p>

              )

            )}



            <Button

              onClick={() => {

                setStudent(

                  clone(

                    solution.automaton

                  )

                );

                setResult(null);

              }}

            >

              Apply Verified Repair

            </Button>

          </>

        )}



        {result?.message && (

          <p>

            {result.message}

          </p>

        )}



        {result?.checked !==

          undefined && (

          <p style={muted}>

            Candidate repairs

            checked:{" "}

            {result.checked}

          </p>

        )}

      </Panel>



      {solution && (

        <Preview

          model={

            solution.automaton

          }

          title="Proposed Repaired DFA"

        />

      )}

    </>

  );

}



/* ==========================================================

   10. SMART TEST GENERATOR

========================================================== */



function SmartTestsSection({

  model,

  setModel

}) {

  const [length, setLength] =

    useState("4");



  const [result, setResult] =

    useState(null);



  return (

    <>

      <Workspace

        model={model}

        setModel={next => {

          setModel(next);

          setResult(null);

        }}

        title="DFA Test Generator"

      />



      <Panel title="Generate Exhaustive Short-String Tests">

        <div style={row}>

          <Select

            label="Maximum input length"

            value={length}

            options={[

              "1",

              "2",

              "3",

              "4",

              "5"

            ]}

            onChange={

              setLength

            }

          />



          <Button

            onClick={() =>

              setResult(

                testDFA(

                  model,

                  Number(

                    length

                  )

                )

              )

            }

          >

            Generate Tests

          </Button>

        </div>



        <Errors

          errors={result?.errors}

        />



        {result?.rows && (

          <>

            <p>

              Generated{" "}

              {

                result.rows

                  .length

              }{" "}

              test cases.

            </p>



            <div

              style={{

                overflowX: "auto"

              }}

            >

              <table className="data-table">

                <thead>

                  <tr>

                    <th>

                      Input

                    </th>

                    <th>

                      Outcome

                    </th>

                  </tr>

                </thead>



                <tbody>

                  {result.rows.map(

                    (

                      current,

                      index

                    ) => (

                      <tr

                        key={index}

                      >

                        <td>

                          {

                            current.input

                          }

                        </td>



                        <td>

                          {current.accepted

                            ? "Accepted"

                            : "Rejected"}

                        </td>

                      </tr>

                    )

                  )}

                </tbody>

              </table>

            </div>

          </>

        )}

      </Panel>

    </>

  );

}



/* ==========================================================

   11. AI TUTOR (LOCAL)

========================================================== */



function TutorSection({

  model

}) {

  const [input, setInput] =

    useState("0101");



  const [answer, setAnswer] =

    useState("");



  return (

    <>

      <Panel title="AI Tutor — Local Explanation">

        <p style={muted}>

          This uses a

          deterministic

          explanation algorithm,

          not an external

          language model.

        </p>



        <Field

          label="Input string"

          value={input}

          onChange={

            setInput

          }

        />



        <div style={row}>

          <Button

            onClick={() =>

              setAnswer(

                explainDFA(

                  model,

                  input

                )

              )

            }

          >

            Explain Execution

          </Button>

        </div>



        {answer && (

          <p

            style={{

              lineHeight: 1.8

            }}

          >

            {answer}

          </p>

        )}

      </Panel>



      <Preview

        model={model}

      />

    </>

  );

}



/* ==========================================================

   12. CHALLENGE MODE

========================================================== */



function ChallengeSection() {

  const questions = [

    {

      q: "Starting at q0 in the default DFA, which state is reached after reading 01?",

      options: [

        "q0",

        "q1",

        "q2"

      ],

      answer: "q2",

      explanation:

        "q0 → q1 on 0, then q1 → q2 on 1."

    },

    {

      q: "What does an accepting state represent?",

      options: [

        "A final state",

        "An invalid state",

        "An initial state"

      ],

      answer:

        "A final state",

      explanation:

        "A string is accepted if processing ends in an accepting state."

    },

    {

      q: "Which machine can use ε-transitions?",

      options: [

        "DFA",

        "NFA",

        "Neither"

      ],

      answer: "NFA",

      explanation:

        "An ε-NFA may move without consuming an input symbol."

    },

    {

      q: "What is the purpose of DFA minimization?",

      options: [

        "Add states",

        "Remove equivalent and unreachable states",

        "Change alphabet"

      ],

      answer:

        "Remove equivalent and unreachable states",

      explanation:

        "Minimization preserves the language while reducing states."

    }

  ];



  const [index, setIndex] =

    useState(0);



  const [answer, setAnswer] =

    useState("");



  const [submitted, setSubmitted] =

    useState(false);



  const question =

    questions[index];



  return (

    <Panel title="TOCVerse Challenge Mode">

      <p style={muted}>

        Challenge{" "}

        {index + 1} of{" "}

        {questions.length}

      </p>



      <h3>

        {question.q}

      </h3>



      <Select

        label="Choose answer"

        value={answer}

        options={[

          "",

          ...question.options

        ]}

        onChange={value => {

          setAnswer(value);

          setSubmitted(false);

        }}

      />



      <div style={row}>

        <Button

          disabled={!answer}

          onClick={() =>

            setSubmitted(true)

          }

        >

          Check Answer

        </Button>



        <Button

          onClick={() => {

            setIndex(

              current =>

                (

                  current + 1

                ) %

                questions.length

            );



            setAnswer("");

            setSubmitted(false);

          }}

        >

          Next Challenge

        </Button>

      </div>



      {submitted && (

        <Status

          good={

            answer ===

            question.answer

          }

        >

          {answer ===

          question.answer

            ? "Correct!"

            : "Incorrect."}



          {" "}

          {

            question.explanation

          }

        </Status>

      )}



      {index === 0 && (

        <Preview

          model={

            defaultDFA

          }

          title="Challenge Automaton"

        />

      )}

    </Panel>

  );

}



/* ==========================================================

   13. PROTOCOL VERIFICATION

========================================================== */



function ProtocolSection({

  model,

  setModel

}) {

  const [errors, setErrors] =

    useState(null);



  return (

    <>

      <Workspace

        model={model}

        setModel={next => {

          setModel(next);

          setErrors(null);

        }}

        title="Protocol State Machine"

      />



      <Panel title="Protocol Structure Check">

        <p style={muted}>

          Model a finite-state

          protocol and check

          its DFA structural

          validity.

        </p>



        <Button

          onClick={() =>

            setErrors(

              validateDFA(

                model

              )

            )

          }

        >

          Validate State Machine

        </Button>



        {errors &&

          (

            errors.length ? (

              <Errors

                errors={

                  errors

                }

              />

            ) : (

              <Status good>

                State machine is

                structurally valid.

              </Status>

            )

          )}

      </Panel>

    </>

  );

}



/* ==========================================================

   14. EXPERIMENTS

========================================================== */



function ExperimentsSection({

  model,

  setModel

}) {

  const [saved, setSaved] =

    useState([]);



  const [name, setName] =

    useState("");



  return (

    <Panel title="Local Experiments">

      <p style={muted}>

        Save temporary

        snapshots and export

        them as JSON.

      </p>



      <div style={row}>

        <Field

          label="Experiment name"

          value={name}

          onChange={

            setName

          }

        />



        <Button

          onClick={() => {

            setSaved(

              current => [

                ...current,

                {

                  id: `${

                    Date.now()

                  }-${

                    Math.random()

                  }`,

                  name:

                    name.trim() ||

                    `Experiment ${

                      current.length +

                      1

                    }`,

                  model:

                    clone(

                      model

                    )

                }

              ]

            );



            setName("");

          }}

        >

          Save Snapshot

        </Button>

      </div>



      {saved.map(item => (

        <div

          key={item.id}

          style={row}

        >

          <strong>

            {item.name}

          </strong>



          <Button

            onClick={() =>

              setModel(

                clone(

                  item.model

                )

              )

            }

          >

            Load

          </Button>



          <Button

            onClick={() =>

              exportJSON(

                `${

                  item.name.replace(

                    /[^a-z0-9_-]/gi,

                    "_"

                  )

                }.json`,

                item.model

              )

            }

          >

            Export

          </Button>



          <Button

            onClick={() =>

              setSaved(

                current =>

                  current.filter(

                    experiment =>

                      experiment.id !==

                      item.id

                  )

              )

            }

          >

            Delete

          </Button>

        </div>

      ))}

    </Panel>

  );

}



/* ==========================================================

   15. DASHBOARD

========================================================== */



function Dashboard({ goTo }) {
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("All");
  const items=[
    ["DFA Simulator","◎","Automata","Build and debug deterministic machines"],
    ["NFA & Conversion","◇","Automata","Explore nondeterminism and subset construction"],
    ["Regex Lab","✳","Languages","Convert expressions to finite automata"],
    ["Visual Algorithm Studio","⚡","Languages","Animate Regex → NFA → DFA → Minimized DFA"],
    ["CFG & Derivation","≡","Languages","Explore context-free grammars and derivations"],
    ["PDA Simulator","▤","Computation","Simulate pushdown automata and stack operations"],
    ["Turing Machine","▦","Computation","Run tape-based computational models"],
    ["DFA Minimizer","↘","Automata","Optimize automata through state minimization"],
    ["Equivalence Checker","⇄","Verification","Compare automata and find counterexamples"],
    ["AutoFix VerifyX","✦","Verification","Find formally verified transition repairs"],
    ["Smart Test Generator","☷","Learning","Generate tests for machine behavior"],
    ["AI Tutor (Local)","✧","Learning","Understand each transition step by step"],
    ["Challenge Mode","★","Learning","Practice theory of computation questions"],
    ["Protocol Verification","⬡","Verification","Validate finite-state protocol models"],
    ["Experiments","▣","Workspace","Save and export machine experiments"]
  ];
  const visible=items.filter(x=>(category==="All"||x[2]===category)&&x.join(" ").toLowerCase().includes(search.toLowerCase()));
  return <div className="command-dashboard">
    <style>{`
      .command-dashboard{color:#edf0ff;padding-bottom:40px}
      .command-dashboard *{box-sizing:border-box}
      .command-dashboard button{cursor:pointer}
      .command-dashboard .command-hero{background:radial-gradient(ellipse at 80% 30%,#6655c477,transparent 53%),linear-gradient(120deg,#202c57,#11182e);border:1px solid #56619a;border-radius:24px;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:24px;padding:38px;overflow:hidden}
      .command-dashboard .command-eyebrow{color:#b5a8ff;font-size:11px;font-weight:900;letter-spacing:2.5px}
      .command-dashboard .command-hero h2{font-size:clamp(32px,3.5vw,52px);letter-spacing:-1px;line-height:1.14;margin:18px 0;color:#fff}
      .command-dashboard .command-hero h2 span{color:#a998ff}
      .command-dashboard .command-hero p{color:#bec9e8;line-height:1.8;max-width:560px}
      .command-dashboard .command-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:25px}
      .command-dashboard .command-actions button{border-radius:11px;padding:13px 19px;font-weight:800;border:1px solid #8c7bf5;color:#fff;background:linear-gradient(120deg,#6555d6,#9d78ef)}
      .command-dashboard .command-actions button+button{background:#ffffff10;border-color:#59648d}
      .command-dashboard .command-graphic{width:100%;min-height:220px}
      .command-dashboard .command-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:20px 0 30px}
      .command-dashboard .command-stat,.command-dashboard .command-step,.command-dashboard .command-module{background:linear-gradient(145deg,#1b2546,#121a32);border:1px solid #34436e;border-radius:17px}
      .command-dashboard .command-stat{padding:20px;display:flex;gap:14px;align-items:center}
      .command-dashboard .command-stat b{font-size:29px;color:#fff;display:block}
      .command-dashboard .command-stat small{color:#9facd0;font-size:11px;letter-spacing:.7px}
      .command-dashboard .command-stat-icon{font-size:25px;color:#b7aaff;background:#7664dc22;padding:12px;border-radius:12px}
      .command-dashboard .command-section{display:flex;justify-content:space-between;gap:15px;align-items:end;margin:27px 0 16px}
      .command-dashboard .command-section h3{font-size:24px;margin:5px 0;color:white}
      .command-dashboard .command-section p{color:#a5b2d2;font-size:12px;margin:0}
      .command-dashboard .command-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
      .command-dashboard .command-step{padding:21px;text-align:left;color:white;transition:.2s}
      .command-dashboard .command-step em{color:#ab9bff;font-size:12px;font-style:normal;letter-spacing:1px;font-weight:900}
      .command-dashboard .command-step strong{display:block;margin:16px 0 8px;font-size:18px}
      .command-dashboard .command-step small{color:#a7b4d5}
      .command-dashboard .command-toolbar{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:17px}
      .command-dashboard .command-filters{display:flex;flex-wrap:wrap;gap:7px}
      .command-dashboard .command-filters button{background:#202b4c;border:1px solid #40517e;border-radius:9px;padding:9px 13px;color:#b4c0e3;font-size:12px}
      .command-dashboard .command-filters button.active{background:#6555c8;color:#fff;border-color:#a596ff}
      .command-dashboard .command-search{background:#10192f!important;border:1px solid #485780!important;color:white!important;border-radius:10px!important;padding:10px 14px!important;min-width:215px!important}
      .command-dashboard .command-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}
      .command-dashboard .command-module{padding:22px;text-align:left;display:flex;flex-direction:column;min-height:185px;color:#fff;transition:.2s}
      .command-dashboard .command-module:hover,.command-dashboard .command-step:hover{transform:translateY(-4px);border-color:#9e8aff}
      .command-dashboard .command-module .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
      .command-dashboard .command-module .symbol{font-size:25px;color:#baaaff;background:#7664db25;border:1px solid #7664db55;width:45px;height:45px;display:grid;place-items:center;border-radius:12px}
      .command-dashboard .command-module .tag{font-size:10px;color:#99a8d1;letter-spacing:1px}
      .command-dashboard .command-module strong{font-size:17px}
      .command-dashboard .command-module p{font-size:12px;color:#aebbdc;line-height:1.6;margin:9px 0 15px}
      .command-dashboard .command-module .open{font-size:12px;color:#b5a5ff;font-weight:900;margin-top:auto}
      @media(max-width:1100px){.command-dashboard .command-hero{grid-template-columns:1fr}.command-dashboard .command-stats,.command-dashboard .command-steps{grid-template-columns:repeat(2,1fr)}.command-dashboard .command-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:650px){.command-dashboard .command-hero{padding:22px}.command-dashboard .command-stats,.command-dashboard .command-steps,.command-dashboard .command-grid{grid-template-columns:1fr}}
    `}</style>
    <section className="command-hero">
      <div><div className="command-eyebrow">◈ TOCVERSE / INTERACTIVE COMPUTATION LAB</div>
        <h2>Understand the theory.<br/><span>Experience the machine.</span></h2>
        <p>Your command center for automata, formal languages, simulation and verification. Design machines, follow every transition, and test the logic behind computation.</p>
        <div className="command-actions"><button onClick={()=>goTo("DFA Simulator")}>▶ Launch Visual Studio →</button><button onClick={()=>goTo("AutoFix VerifyX")}>✦ Explore VerifyX</button></div>
        <p style={{fontSize:12,color:"#84e9c3",marginTop:20}}>● Local workspace · Interactive modules available</p>
      </div>
      <svg className="command-graphic" viewBox="0 0 470 275" role="img" aria-label="DFA with states q0, q1 and accepting state q2">
        <defs><linearGradient id="dashNode" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6654bd"/><stop offset="1" stopColor="#272c60"/></linearGradient><marker id="dashArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#b6a7ff"/></marker></defs>
        <g fill="none" stroke="#b6a7ff" strokeWidth="2.5" markerEnd="url(#dashArrow)"><path d="M12 135 H67"/><path d="M147 135 H208"/><path d="M287 135 H347"/><path d="M104 95 C77 17 169 17 143 101"/><path d="M244 95 C218 17 308 17 282 101"/><path d="M384 95 C356 17 452 17 424 101"/></g>
        <g fill="#c8bdff" fontSize="13"><text x="173" y="122">0</text><text x="317" y="122">1</text><text x="114" y="35">1</text><text x="257" y="35">0</text><text x="397" y="35">0,1</text></g>
        {[[107,"q0"],[247,"q1"],[387,"q2"]].map(([x,label],i)=><g key={label}><circle cx={x} cy="135" r="41" fill="url(#dashNode)" stroke={i===2?"#84eac2":"#b6a7ff"} strokeWidth="3"/>{i===2&&<circle cx={x} cy="135" r="33" fill="none" stroke="#84eac2" strokeWidth="2"/>}<text x={x} y="142" fill="#fff" fontSize="19" fontWeight="bold" textAnchor="middle">{label}</text></g>)}
        <g fill="#aab7d8" fontSize="11" textAnchor="middle"><text x="107" y="210">START</text><text x="247" y="210">TRANSITION</text><text x="387" y="210">ACCEPT</text></g>
        <rect x="135" y="240" width="200" height="25" rx="12" fill="#1b2345" stroke="#505b90"/><text x="235" y="257" textAnchor="middle" fill="#bcb1ff" fontSize="12">δ(q, a) → next state</text>
      </svg>
    </section>
    <div className="command-stats">{[["16","TOTAL MODULES","▦"],["6","SUBJECT AREAS","⬡"],["100%","LOCAL WORKSPACE","◈"],["∞","POSSIBILITIES","✧"]].map(([n,label,icon])=><div className="command-stat" key={label}><span className="command-stat-icon">{icon}</span><div><b>{n}</b><small>{label}</small></div></div>)}</div>
    <div className="command-section"><div><div className="command-eyebrow">THE LEARNING PIPELINE</div><h3>From concept to proof</h3></div><p>Choose a stage to open its lab</p></div>
    <div className="command-steps">{[["01","BUILD","Design an automaton","DFA Simulator"],["02","SIMULATE","Trace state transitions","NFA & Conversion"],["03","VERIFY","Check equivalence","Equivalence Checker"],["04","OPTIMIZE","Minimize the machine","DFA Minimizer"]].map(([n,title,desc,page])=><button key={n} className="command-step" onClick={()=>goTo(page)}><em>STEP {n} →</em><strong>{title}</strong><small>{desc}</small></button>)}</div>
    <div className="command-section"><div><div className="command-eyebrow">EXPLORE THE WORKSPACE</div><h3>Module Library</h3></div><p>All 15 modules remain available in the sidebar</p></div>
    <div className="command-toolbar"><div className="command-filters">{["All","Automata","Verification","Computation","Learning","Languages","Workspace"].map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div><input className="command-search" placeholder="Search modules..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="command-grid">{visible.map(([title,icon,tag,description])=><button className="command-module" key={title} onClick={()=>goTo(title)}><div className="top"><span className="symbol">{icon}</span><span className="tag">{tag.toUpperCase()}</span></div><strong>{title}</strong><p>{description}</p><span className="open">OPEN LAB ↗</span></button>)}</div>
    {!visible.length&&<p>No matching modules found.</p>}
  </div>;
}

/* MAIN APPLICATION — ALL 15 MODULES */

function App() {

  const [page, setPage] =

    useState("Dashboard");



  const [dfa, setDfa] =

    useState(

      clone(

        defaultDFA

      )

    );



  const [nfa, setNfa] =

    useState(

      clone(

        sampleNFA

      )

    );



  const [student, setStudent] =

    useState(

      clone(

        wrongDFA

      )

    );



  const [

    reference,

    setReference

  ] = useState(

    clone(

      defaultDFA

    )

  );



  const [

    protocol,

    setProtocol

  ] = useState(

    clone(

      defaultDFA

    )

  );



  function goTo(next) {

    setPage(next);



    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  }



  function renderPage() {

    switch (page) {

      case "Dashboard":

        return (

          <Dashboard

            goTo={goTo}

          />

        );



      case "DFA Simulator":

        return (

          <DFASection

            model={dfa}

            setModel={setDfa}

          />

        );



      case "NFA & Conversion":

        return (

          <NFASection

            model={nfa}

            setModel={setNfa}

          />

        );



      case "Regex Lab":

        return (

          <RegexSection />

        );



      case "Visual Algorithm Studio":

        return (

          <VisualAlgorithmStudio />

        );



      case "CFG & Derivation":

        return (

          <CFGSection />

        );



      case "PDA Simulator":

        return (

          <PDASection />

        );



      case "Turing Machine":

        return (

          <TMSection />

        );



      case "DFA Minimizer":

        return (

          <MinimizerSection

            model={dfa}

            setModel={setDfa}

          />

        );



      case "Equivalence Checker":

        return (

          <ComparisonSection

            student={student}

            setStudent={setStudent}

            reference={reference}

            setReference={setReference}

          />

        );



      case "AutoFix VerifyX":

        return (

          <AutoFixSection

            student={student}

            setStudent={setStudent}

            reference={reference}

            setReference={setReference}

          />

        );



      case "Smart Test Generator":

        return (

          <SmartTestsSection

            model={dfa}

            setModel={setDfa}

          />

        );



      case "AI Tutor (Local)":

        return (

          <TutorSection

            model={dfa}

          />

        );



      case "Challenge Mode":

        return (

          <ChallengeSection />

        );



      case "Protocol Verification":

        return (

          <ProtocolSection

            model={protocol}

            setModel={setProtocol}

          />

        );



      case "Experiments":

        return (

          <ExperimentsSection

            model={dfa}

            setModel={setDfa}

          />

        );



      default:

        return (

          <Dashboard

            goTo={goTo}

          />

        );

    }

  }



  return (

    <div className="app">

      <aside className="sidebar">

        <div className="logo">

          ◈ TOC

          <span>

            Verse

          </span>



          <small>

            VERIFYX LAB

          </small>

        </div>



        <nav className="nav">

          {pages.map(

            ([

              name,

              icon

            ]) => (

              <button

                key={name}

                className={

                  page === name

                    ? "selected"

                    : ""

                }

                onClick={() =>

                  goTo(name)

                }

              >

                <span className="nav-icon">

                  {icon}

                </span>



                {name}

              </button>

            )

          )}

        </nav>



        <div className="side-note">

          Interactive computation

          laboratory



          <div>

            Local research prototype

          </div>

        </div>

      </aside>



      <main>

        <header>

          <div>

            <div className="eyebrow">

              THEORY OF COMPUTATION

              {" · "}

              INTERACTIVE LAB

            </div>



            <h1>

              {page}

            </h1>

          </div>



          <div className="pill">

            ● Local Workspace

          </div>

        </header>



        {renderPage()}

      </main>

    </div>

  );

}



/* ==========================================================

   REACT ENTRY POINT

========================================================== */



createRoot(

  document.getElementById("root")

).render(

  <React.StrictMode>

    <App />

  </React.StrictMode>

);