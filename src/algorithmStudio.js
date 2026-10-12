
import { regexToNFA, nfaToDFA } from "./advanced.js";
import { minimizeDFA, validateDFA } from "./automata.js";

const EPS = "ε";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function unique(values) {
  return [...new Set(values)].sort();
}

function destinations(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function emptyModel(alphabet = []) {
  return {
    states: [],
    alphabet: [...alphabet],
    start: "",
    finals: [],
    transitions: {}
  };
}

function snapshot(stage, title, description, model, extra = {}) {
  return {
    stage,
    title,
    description,
    model: clone(model),
    active: [],
    activeTransition: null,
    ...extra
  };
}

function addState(model, state) {
  if (!model.states.includes(state)) {
    model.states.push(state);
    model.transitions[state] = {};
  }
}

function addNFATransition(model, from, symbol, to) {
  model.transitions[from] ||= {};
  model.transitions[from][symbol] ||= [];

  if (!model.transitions[from][symbol].includes(to)) {
    model.transitions[from][symbol].push(to);
  }
}

function closure(nfa, initial) {
  const seen = new Set(initial);
  const stack = [...initial];

  while (stack.length) {
    const state = stack.pop();

    for (const next of destinations(
      nfa.transitions?.[state]?.[EPS]
    )) {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }

  return unique([...seen]);
}

function move(nfa, states, symbol) {
  return unique(
    states.flatMap(state =>
      destinations(nfa.transitions?.[state]?.[symbol])
    )
  );
}

function subsetKey(states) {
  return JSON.stringify(unique(states));
}

function countTransitions(model) {
  let count = 0;

  for (const state of model.states || []) {
    for (const value of Object.values(
      model.transitions?.[state] || {}
    )) {
      count += destinations(value).length;
    }
  }

  return count;
}

/*
 * STAGE 1
 * Animated Thompson NFA construction.
 *
 * Replays the states and transitions produced by
 * the existing regexToNFA implementation.
 */
export function traceRegexToNFA(pattern) {
  const result = regexToNFA(pattern);

  if (result.errors?.length || !result.nfa) {
    return {
      errors: result.errors || ["Could not generate NFA"],
      steps: [],
      automaton: null
    };
  }

  const finalNFA = result.nfa;
  const model = emptyModel(finalNFA.alphabet);
  const steps = [];

  steps.push(
    snapshot(
      "regex",
      "Regular Expression",
      `Expression: ${pattern}`,
      model,
      { pattern }
    )
  );

  for (const state of finalNFA.states) {
    addState(model, state);

    if (state === finalNFA.start) {
      model.start = state;
    }

    steps.push(
      snapshot(
        "nfa",
        `Create state ${state}`,
        `Add state ${state} to the Thompson NFA.`,
        model,
        { active: [state] }
      )
    );
  }

  for (const from of finalNFA.states) {
    const outgoing = finalNFA.transitions?.[from] || {};

    for (const [symbol, targets] of Object.entries(outgoing)) {
      for (const to of destinations(targets)) {
        addNFATransition(model, from, symbol, to);

        steps.push(
          snapshot(
            "nfa",
            `Add ${symbol} transition`,
            symbol === EPS
              ? `Connect ${from} to ${to} using an ε-transition.`
              : `Connect ${from} to ${to} using symbol ${symbol}.`,
            model,
            {
              active: [from, to],
              activeTransition: {
                from,
                to,
                symbol,
                progress: 1
              }
            }
          )
        );
      }
    }
  }

  model.start = finalNFA.start;
  model.finals = [...finalNFA.finals];

  steps.push(
    snapshot(
      "nfa",
      "Thompson NFA Complete",
      `Construction complete with ${model.states.length} states and ${countTransitions(model)} transitions.`,
      model,
      {
        active: [...model.finals],
        complete: true
      }
    )
  );

  return {
    errors: [],
    steps,
    automaton: clone(finalNFA)
  };
}

/*
 * STAGE 2
 * Step-by-step subset construction.
 *
 * Each step records the current DFA, discovered
 * subsets, and the transition being processed.
 */
export function traceNFAtoDFA(nfa) {
  const verified = nfaToDFA(nfa);

  if (verified.errors?.length) {
    return {
      errors: verified.errors,
      steps: [],
      automaton: null
    };
  }

  const alphabet = [...nfa.alphabet];
  const model = emptyModel(alphabet);
  const steps = [];

  const initial = closure(nfa, [nfa.start]);
  const queue = [initial];
  const names = new Map([[subsetKey(initial), "D0"]]);
  const subsets = [{ name: "D0", states: initial }];

  model.states.push("D0");
  model.start = "D0";
  model.transitions.D0 = {};

  if (initial.some(state => nfa.finals.includes(state))) {
    model.finals.push("D0");
  }

  steps.push(
    snapshot(
      "dfa",
      "Initial ε-Closure",
      `ε-closure(${nfa.start}) = {${initial.join(", ")}}. Create DFA state D0.`,
      model,
      {
        active: ["D0"],
        subsets: clone(subsets)
      }
    )
  );

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    const from = names.get(subsetKey(current));

    for (const symbol of alphabet) {
      const moved = move(nfa, current, symbol);
      const destination = closure(nfa, moved);
      const key = subsetKey(destination);

      let newlyCreated = false;

      if (!names.has(key)) {
        const name = `D${queue.length}`;

        names.set(key, name);
        queue.push(destination);

        model.states.push(name);
        model.transitions[name] = {};

        subsets.push({
          name,
          states: destination
        });

        if (destination.some(state => nfa.finals.includes(state))) {
          model.finals.push(name);
        }

        newlyCreated = true;

        steps.push(
          snapshot(
            "dfa",
            `Discover state ${name}`,
            `Reading ${symbol} from ${from} discovers subset {${destination.join(", ") || "∅"}}.`,
            model,
            {
              active: [name],
              subsets: clone(subsets),
              discovered: name
            }
          )
        );
      }

      const to = names.get(key);
      model.transitions[from][symbol] = to;

      steps.push(
        snapshot(
          "dfa",
          `Transition ${from} → ${to}`,
          `move({${current.join(", ")}}, ${symbol}) = {${moved.join(", ") || "∅"}}; ε-closure = {${destination.join(", ") || "∅"}}.${newlyCreated ? " A new DFA state was created." : " The destination was already discovered."}`,
          model,
          {
            active: [from, to],
            activeTransition: {
              from,
              to,
              symbol,
              progress: 1
            },
            subsets: clone(subsets)
          }
        )
      );
    }
  }

  steps.push(
    snapshot(
      "dfa",
      "DFA Construction Complete",
      `All reachable subsets have been processed. The DFA contains ${model.states.length} states.`,
      model,
      {
        complete: true,
        subsets: clone(subsets)
      }
    )
  );

  return {
    errors: [],
    steps,
    automaton: clone(model),
    subsets
  };
}

/*
 * STAGE 3
 * Animated DFA minimization using partition refinement.
 */
export function traceDFAMinimization(dfa) {
  const errors = validateDFA(dfa);

  if (errors.length) {
    return {
      errors,
      steps: [],
      automaton: null
    };
  }

  const verified = minimizeDFA(dfa);

  if (verified.errors?.length) {
    return {
      errors: verified.errors,
      steps: [],
      automaton: null
    };
  }

  const steps = [];

  // Remove unreachable states first.
  const reachable = new Set([dfa.start]);
  const queue = [dfa.start];

  for (let index = 0; index < queue.length; index++) {
    const state = queue[index];

    for (const symbol of dfa.alphabet) {
      const next = dfa.transitions[state][symbol];

      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }

  const reachableStates = dfa.states.filter(state =>
    reachable.has(state)
  );

  const removed = dfa.states.filter(state =>
    !reachable.has(state)
  );

  const working = {
    states: reachableStates,
    alphabet: [...dfa.alphabet],
    start: dfa.start,
    finals: dfa.finals.filter(state => reachable.has(state)),
    transitions: {}
  };

  for (const state of reachableStates) {
    working.transitions[state] = {
      ...dfa.transitions[state]
    };
  }

  steps.push(
    snapshot(
      "minimize",
      "Remove Unreachable States",
      removed.length
        ? `Remove unreachable states: ${removed.join(", ")}.`
        : "All DFA states are reachable.",
      working,
      {
        removed,
        partitions: []
      }
    )
  );

  let groups = [
    reachableStates.filter(state => working.finals.includes(state)),
    reachableStates.filter(state => !working.finals.includes(state))
  ].filter(group => group.length > 0);

  steps.push(
    snapshot(
      "minimize",
      "Initial Partition",
      "Separate accepting and non-accepting states.",
      working,
      {
        partitions: clone(groups),
        active: [...reachableStates]
      }
    )
  );

  let round = 0;

  while (true) {
    round++;

    const lookup = {};

    groups.forEach((group, index) => {
      group.forEach(state => {
        lookup[state] = index;
      });
    });

    const refined = [];

    for (const group of groups) {
      const buckets = new Map();

      for (const state of group) {
        const signature = working.alphabet
          .map(symbol => lookup[working.transitions[state][symbol]])
          .join(",");

        if (!buckets.has(signature)) {
          buckets.set(signature, []);
        }

        buckets.get(signature).push(state);
      }

      refined.push(...buckets.values());
    }

    const changed = refined.length !== groups.length;

    steps.push(
      snapshot(
        "minimize",
        `Partition Refinement ${round}`,
        changed
          ? `Partition refinement splits ${groups.length} groups into ${refined.length} groups.`
          : "All partitions are stable. Equivalent states have been identified.",
        working,
        {
          partitions: clone(refined),
          refinementRound: round,
          stable: !changed
        }
      )
    );

    groups = refined;

    if (!changed) break;
  }

  const minimized = verified.automaton;

  steps.push(
    snapshot(
      "minimize",
      "Minimized DFA Complete",
      `Minimization complete: ${dfa.states.length} original states → ${minimized.states.length} states.`,
      minimized,
      {
        partitions: clone(groups),
        complete: true,
        originalStateCount: dfa.states.length,
        minimizedStateCount: minimized.states.length
      }
    )
  );

  return {
    errors: [],
    steps,
    automaton: clone(minimized),
    groups: clone(groups)
  };
}

/*
 * STAGE 4
 * Full transformation pipeline.
 */
export function buildAlgorithmStudio(pattern) {
  const regex = traceRegexToNFA(pattern);

  if (regex.errors.length) {
    return {
      errors: regex.errors,
      steps: [],
      stages: {}
    };
  }

  const conversion = traceNFAtoDFA(regex.automaton);

  if (conversion.errors.length) {
    return {
      errors: conversion.errors,
      steps: regex.steps,
      stages: {
        nfa: regex.automaton
      }
    };
  }

  const minimization = traceDFAMinimization(
    conversion.automaton
  );

  if (minimization.errors.length) {
    return {
      errors: minimization.errors,
      steps: [...regex.steps, ...conversion.steps],
      stages: {
        nfa: regex.automaton,
        dfa: conversion.automaton
      }
    };
  }

  const steps = [
    ...regex.steps,
    ...conversion.steps,
    ...minimization.steps
  ].map((step, index) => ({
    ...step,
    index,
    stepNumber: index + 1
  }));

  const stages = {
    nfa: regex.automaton,
    dfa: conversion.automaton,
    minimized: minimization.automaton
  };

  return {
    errors: [],
    pattern,
    steps,
    stages,
    statistics: {
      totalSteps: steps.length,
      nfaStates: stages.nfa.states.length,
      dfaStates: stages.dfa.states.length,
      minimizedStates: stages.minimized.states.length,
      nfaTransitions: countTransitions(stages.nfa),
      dfaTransitions: countTransitions(stages.dfa),
      minimizedTransitions: countTransitions(stages.minimized),
      removedStates:
        stages.dfa.states.length -
        stages.minimized.states.length
    }
  };
}
