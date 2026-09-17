# AGENTS.md

## Project Context
Internal employee-support agent for IT at Veridian Corp (fictional company, from the assignment datapack). Employees describe an issue in a chat UI; the agent understands the issue, finds the relevant KB policy, asks follow-up questions when needed, resolves simple requests, escalates risky/unclear ones, creates a structured ticket, shows its source, and maintains an audit trail.
Stack: React (Vite, plain JS) frontend + Node.js/Express backend + Google AI Studio (Gemini) for the LLM.
Status: single-sitting build, time-boxed to ~4 hours. No production hardening intended.

## Architecture
- `/server/server.js` — Express app entrypoint, route definitions only, no business logic.
- `/server/data/kb.json` — KB-01..KB-10 + Asset Management Policy extract, verbatim from the datapack.
- `/server/data/ticketHistory.json` — TK-1042..TK-1051, verbatim from the datapack (context only, not actionable).
- `/server/data/seedRequests.json` — REQ-01..REQ-15, verbatim from the datapack (used to drive the demo).
- `/server/lib/agent.js` — assembles the system prompt (full KB + full ticket history, no retrieval), calls Gemini with `responseSchema` for structured output, returns `{reply, action, category, kbSource, escalatedTo, ticketUpdate}`.
- `/server/lib/escalationRules.js` — hardcoded guard checks that run independently of the LLM's returned `action` (see Critical Rules).
- `/server/store.js` — in-memory ticket array + audit trail, optional JSON snapshot flush. No real DB.
- `/client/src/App.jsx` — app shell, holds chat + tickets state, calls backend only via `/api/*`.
- `/client/src/components/` — `ChatPanel.jsx`, `TicketsPanel.jsx`, `TicketDetail.jsx`.
- Client never talks to Gemini directly — always through the Express backend.

## Code Style
- Plain JavaScript, no TypeScript (deliberate — not confident defending TS in the interview).
- Naming: camelCase for JS variables/functions, PascalCase for React components.
- Async: async/await everywhere, no raw `.then()` chains.
- Comments: only where a decision needs explaining ("why"), not restating what the code does.
- Keep route handlers thin: parse request, call `agent.js`/`escalationRules.js`/`store.js`, return response. No business logic inline in `server.js`.

## Preferred Libraries
- Backend: `express`, `@google/generative-ai` (Gemini SDK), `cors`, `dotenv`.
- Frontend: React via Vite, built-in `useState`/`useReducer`, plain `fetch` — no query library, no UI framework, no CSS framework (plain CSS, keep it fast).
- No ORM, no vector DB client, no agent-orchestration framework (LangGraph/CrewAI etc.) — deliberately out of scope, see decision log below.

## Critical Rules
- NEVER commit `.env` (contains the Gemini API key).
- Grounding is full-context, not retrieval: every system prompt includes the entire `kb.json` and `ticketHistory.json`. No embeddings, no chunking, no vector search anywhere in this project.
- Safety-critical escalation rules are enforced in `escalationRules.js` as a guard on top of the LLM's output, not left to model judgment alone:
  - Security-incident language (phishing/malware/unauthorized access, per KB-09) → force `action: "escalate"`, `escalatedTo: "IT Security"`.
  - Requests needing authority IT doesn't have (admin/server access, Finance-owned systems, Finance sign-off) → force escalate to the correct owner, never `resolve`.
  - Contractor VPN requests → require manager approval before granting (KB-02), never auto-resolve.
  - If the LLM returns `resolve` but a hard rule applies, the hard rule wins.
- Persistence is in-memory + optional JSON snapshot, not a real database — a documented scope decision, not an oversight. Don't add SQLite/Postgres under time pressure; it wasn't the thing being evaluated.
- Gemini responses must use `responseSchema` so `action`/`category`/`kbSource` are structured JSON, never parsed out of free text.
- Every agent turn must append to the relevant ticket's `auditTrail` — this is a mandatory requirement in the brief, not optional polish.

## Commands
- Backend dev: `node server.js` (from `/server`)
- Frontend dev: `npm run dev` (Vite, from `/client`)
- No seed-data generator — `kb.json`/`ticketHistory.json`/`seedRequests.json` are static, transcribed once from the datapack, not generated per run.
