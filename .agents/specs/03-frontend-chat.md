---
# Spec: Frontend Chat

## Overview
This feature scaffolds the entire React (Vite) frontend and wires it up to the backend API. The UI is a two-panel layout: a **Chat Panel** on the left where the employee converses with the IT support agent, and a **Tickets Panel** on the right showing all tickets with the ability to drill into a single ticket's detail and audit trail. The client never talks to Gemini directly — all communication goes through the Express backend at `/api/*`. Conversation history is owned by the client and sent up with each message.

## Endpoints / API Routes
No new backend routes. The frontend consumes the existing API:
- `POST /api/chat` — send a message, receive the agent's structured response.
- `GET /api/tickets` — fetch all tickets for the tickets panel.
- `GET /api/tickets/:id` — fetch a single ticket (with full audit trail) for the detail view.

## Data / State Changes
No backend data changes. All state is client-side:
- `messages` — array of `{ role: 'user' | 'agent', text, action?, category?, kbSource?, escalatedTo? }` for the current conversation.
- `ticketId` — the active ticket ID returned by the first `/api/chat` call in a conversation (null until the first message is sent).
- `tickets` — array of all tickets fetched from `GET /api/tickets`.
- `selectedTicket` — the ticket object currently displayed in the detail view (null when none selected).
- `employeeName` / `employeeEmail` — captured at the start of a session (simple input form or hardcoded demo values).
- `isLoading` — boolean to show a loading/typing indicator while waiting for the agent response.

## Files to modify
None — this is a greenfield frontend scaffold.

## Files to create
- `client/package.json` — Vite + React dependencies.
- `client/vite.config.js` — Vite config with proxy to `http://localhost:3000` for `/api/*` routes (avoids CORS issues in dev).
- `client/index.html` — Vite HTML entry point.
- `client/src/main.jsx` — React root render.
- `client/src/App.jsx` — App shell. Holds all top-level state (`messages`, `ticketId`, `tickets`, `selectedTicket`, `employeeName`, `employeeEmail`, `isLoading`). Renders the two-panel layout: `<ChatPanel />` and `<TicketsPanel />` side by side. Contains all `fetch()` calls to the backend (passed as callbacks to children).
- `client/src/components/ChatPanel.jsx` — Chat UI:
  - Message input form at the bottom (textarea + send button).
  - Scrollable message list above showing user messages and agent replies.
  - Agent replies should visually surface `kbSource` (e.g. "Source: KB-01") and `action` (e.g. a badge showing "Resolved" / "Escalated" / "Follow-up needed").
  - Typing indicator while `isLoading` is true.
  - On send: calls `POST /api/chat` with `{ message, employeeName, employeeEmail, ticketId, conversationHistory }`.
- `client/src/components/TicketsPanel.jsx` — Ticket list UI:
  - Fetches tickets from `GET /api/tickets` on mount and after each chat message.
  - Displays each ticket as a card/row showing: ID, employee name, summary, status badge (color-coded: resolved=green, escalated=red, in_progress=yellow), category.
  - Clicking a ticket opens `<TicketDetail />`.
- `client/src/components/TicketDetail.jsx` — Single ticket detail view:
  - Shows full ticket info: ID, employee, email, issue summary, category, status, KB source, escalation target.
  - Renders the full **audit trail** as a timeline/list: each entry shows timestamp, actor, action, and detail.
  - Back button to return to the tickets list.
- `client/src/App.css` — Global styles and layout (two-panel grid or flexbox).
- `client/src/components/ChatPanel.css` — Chat-specific styles (message bubbles, input area, typing indicator).
- `client/src/components/TicketsPanel.css` — Ticket list styles (cards, status badges).
- `client/src/components/TicketDetail.css` — Detail view styles (info grid, audit trail timeline).

## Rules for implementation
- **React via Vite, plain JS** — no TypeScript per AGENTS.md.
- **Plain CSS** — no Tailwind, no CSS-in-JS, no UI framework. One CSS file per component.
- **State management** — `useState` only, no Redux, no context. App.jsx owns all state, passes props and callbacks down.
- **Data fetching** — plain `fetch()`, no axios, no react-query. async/await, no `.then()` chains.
- **Conversation history is client-side** — `App.jsx` maintains the `messages` array and sends the full history as `conversationHistory` with each `POST /api/chat` request.
- **Vite proxy** — configure `vite.config.js` to proxy `/api` requests to `http://localhost:3000` so the frontend dev server (port 5173) can reach the backend without CORS issues.
- **No direct Gemini calls** — the client only talks to the Express backend.
- **Responsive-ish** — two panels side by side on desktop, stacked on narrow screens (simple media query).
- **Accessible basics** — semantic HTML (`<main>`, `<aside>`, `<form>`, `<button>`), visible focus states, aria-labels on icon-only buttons.

## Definition of done
- [ ] `npm run dev` from `client/` starts the Vite dev server successfully.
- [ ] The app renders a two-panel layout: Chat Panel on the left, Tickets Panel on the right.
- [ ] Typing a message and clicking Send calls `POST /api/chat` and displays the agent's reply in the chat.
- [ ] The agent's reply shows the KB source and action badge.
- [ ] A loading/typing indicator appears while the agent is processing.
- [ ] The Tickets Panel lists all tickets fetched from `GET /api/tickets`.
- [ ] Each ticket card shows ID, summary, status badge (color-coded), and category.
- [ ] Clicking a ticket shows the `TicketDetail` view with the full audit trail.
- [ ] Sending a new chat message refreshes the tickets list to show the newly created/updated ticket.
- [ ] Multi-turn conversation works: follow-up messages reuse the same `ticketId` and the ticket updates accordingly.
- [ ] The "New Conversation" action clears chat state and starts a fresh session (new ticket on next message).
---
