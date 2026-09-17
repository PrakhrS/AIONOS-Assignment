---
# Spec: Agent Core

## Overview
This feature implements the core AI agent loop — the `agent.js` module and its companion `escalationRules.js` guard. Together they form the "brain" of the Internal Service Agent: `agent.js` assembles a system prompt containing the full KB and ticket history, calls Gemini with `responseSchema` for structured JSON output, and returns a decision object; `escalationRules.js` then applies hardcoded safety-critical overrides on top of the LLM's output before the response is returned to the caller. This step also wires up the chat API route in `server.js` that ties everything together.

## Endpoints / API Routes
- `POST /api/chat` — Accepts `{ message, employeeName, employeeEmail, ticketId? }`. Calls `agent.js` to get a structured response, runs escalation guard rules, creates or updates a ticket in the store, appends to the audit trail, and returns `{ reply, action, category, kbSource, escalatedTo, ticketId, ticketUpdate }`.

## Data / State Changes
1. **Ticket creation**: When a new conversation starts (no `ticketId` provided), a new ticket is created in the in-memory store with an auto-generated ID (e.g. `TK-1052`, incrementing from the highest existing ID).
2. **Ticket updates**: On follow-up messages (existing `ticketId`), the ticket's `status`, `category`, `kbSource`, `escalatedTo` fields are updated based on the agent response.
3. **Audit trail**: Every agent turn appends an entry to the ticket's `auditTrail` array: `{ ts, actor: "agent", action, detail }`.
4. **No changes to seed JSON files** — `kb.json`, `ticketHistory.json`, and `seedRequests.json` remain read-only.

## Files to modify
- `server/server.js` — Add `POST /api/chat` route. The handler parses the request, calls `processMessage()` from `agent.js`, applies `applyEscalationGuard()` from `escalationRules.js`, interacts with the store, and returns the response. Keep the handler thin — all logic lives in the lib modules.
- `server/store.js` — Add `getNextTicketId()` helper that finds the current max numeric ID and returns the next one (e.g. `TK-1052`). Add `appendAuditEntry(ticketId, entry)` to push to a ticket's audit trail.

## Files to create
- `server/lib/agent.js` — Core agent module. Responsibilities:
  - Reads `kb.json` at startup and caches it.
  - Exports `processMessage({ message, employeeName, employeeEmail, conversationHistory })` which:
    1. Builds the system prompt: role description, full KB dump, full ticket history dump, and behavioral instructions (cite KB source, ask follow-ups for vague requests, classify the issue, decide action).
    2. Calls `GoogleGenerativeAI` (`gemini-2.0-flash` or current model) with `generationConfig.responseSchema` enforcing this output shape:
       ```json
       {
         "reply": "string — the natural-language response to the employee",
         "action": "string enum — resolve | escalate | ask_followup | info",
         "category": "string — e.g. hardware, access, software, account, security, network",
         "kbSource": "string | null — e.g. KB-03",
         "escalatedTo": "string | null — e.g. IT Security, Finance, Manager",
         "ticketUpdate": "string | null — brief internal note for audit"
       }
       ```
    3. Parses and returns the structured response object.
  - Uses `@google/generative-ai` SDK, reads API key from `process.env.GEMINI_API_KEY`.

- `server/lib/escalationRules.js` — Hardcoded guard that runs after the LLM returns. Exports `applyEscalationGuard(agentResponse, message)` which:
  1. **Security incident keywords** — If the employee message contains phishing / malware / unauthorized access language, force `action: "escalate"`, `escalatedTo: "IT Security"`, override reply to include the KB-09 reporting instructions. This fires even if the LLM said `resolve`.
  2. **Finance / Admin server access** — If the message requests admin access, server access, or access to Finance-owned systems (expense tool account creation), force `action: "escalate"`, `escalatedTo` to the correct owner (Finance / Server Admin).
  3. **Contractor VPN** — If the message mentions contractor + VPN, force `action: "escalate"`, `escalatedTo: "Manager"` (manager approval required per KB-02), never auto-resolve.
  4. Returns the (possibly overridden) response object. If no rule fires, the original LLM response is returned untouched.

## Rules for implementation
- **No retrieval / no RAG** — the system prompt includes the full text of `kb.json` (all 11 articles) and `ticketHistory.json` (all 10 tickets). No embeddings, no chunking, no vector DB.
- **Structured output only** — use Gemini's `responseSchema` in `generationConfig` to enforce the JSON shape. Never parse structured fields out of free text.
- **Escalation rules are a guard, not a replacement** — `escalationRules.js` only overrides when a hardcoded safety rule fires; otherwise the LLM's judgment stands.
- **Audit trail is mandatory** — every call to `POST /api/chat` must result in an audit trail entry on the ticket, even if the action is `info` or `ask_followup`.
- **Conversation history** — the route should accept and forward prior messages so Gemini has multi-turn context. Store conversation as an array of `{ role, parts }` objects matching the Gemini SDK's content format.
- **No TypeScript, no agent frameworks** — plain JS with async/await per AGENTS.md.
- **API key from env** — `process.env.GEMINI_API_KEY`, loaded via `dotenv` (already in `server.js`).
- **Error handling** — if the Gemini call fails, return a 500 with a safe error message. Never expose API keys or raw error traces to the client.

## Definition of done
- [ ] `server/lib/agent.js` exists and exports `processMessage()`.
- [ ] `server/lib/escalationRules.js` exists and exports `applyEscalationGuard()`.
- [ ] `POST /api/chat` with a simple message (e.g. "I'm locked out of my account") returns structured JSON with `reply`, `action`, `category`, `kbSource` fields.
- [ ] A new ticket is created in the store when no `ticketId` is provided.
- [ ] The ticket's `auditTrail` is appended to on every agent turn.
- [ ] Sending a message containing "phishing" forces `action: "escalate"` and `escalatedTo: "IT Security"` regardless of LLM output.
- [ ] Sending "contractor needs VPN" forces escalation requiring manager approval.
- [ ] Sending "I need admin access to the finance server" forces escalation, never resolves.
- [ ] Multi-turn conversation works: sending a follow-up with the same `ticketId` updates the existing ticket.
- [ ] Server returns 500 with a safe message if Gemini API key is missing or the call fails.
---
