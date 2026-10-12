# TOCVerse VerifyX – expanded educational research prototype

## Run
Requires Node.js 18+. Run `npm install`, then `npm run dev`. Open the localhost URL shown by Vite. For production, run `npm run build`.

## Included working modules
- DFA simulation, validation, state graph, step controls
- NFA with epsilon closure and subset-construction NFA→DFA
- Formal regex subset to epsilon-NFA (Thompson construction)
- CFG bounded leftmost derivation search
- Nondeterministic PDA bounded configuration search
- Single-tape bounded Turing Machine simulator
- DFA minimization, equivalence and shortest distinguishing string (BFS)
- Exhaustive transition-only AutoFix for at most two edits, independently verified
- DFA test-string enumeration, rule-based contextual explanation, challenges
- Finite-state protocol sequence checking, session-only experiment saves, JSON export

## Important limitations
This is a **local-first demonstration**, not a production-grade system or an established patented invention. The AI Tutor is rule-based; there is no connected LLM, authentication, cloud database, PDF generator, analytics, natural-language-to-automata LLM, distributed verification, or incremental verification cache. AutoFix requires a formal reference DFA, can be expensive, and searches only up to 2 transition edits. CFG and PDA searches are bounded; a search failure is not generally a mathematical proof of non-membership. Turing machine simulation cannot decide arbitrary halting. The equivalence certificate is a reproducible verification record, not a compact independently-checkable formal proof. The graph layout is an illustrative SVG, not a drag-and-drop editor.

## Model formats
See preloaded examples in `src/advanced.js` and `src/automata.js`. Models can be edited as JSON in the UI. Data saved in Experiments persists only for the current app session; use Export for backups.

## Suggested research next steps
Prior-art analysis, dependency-aware incremental verifier, certificate format and independent checker, benchmarks against full recomputation, and legal review before any patent filing.
