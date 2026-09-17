---
# Spec: Data Layer and Express Skeleton

## Overview
This feature sets up the backend foundation for the Internal Service Agent. It includes the Express server skeleton and seeds the static JSON data files (Knowledge Base, Ticket History, and Seed Requests) verbatim from the assignment datapack. It also establishes the in-memory ticket store that will act as the data layer for this project.

## Endpoints / API Routes
- `GET /health` — Simple health check to verify the Express server is running.
*(No feature-specific routes yet; chat and ticket routes will come in later specs)*

## Data / State Changes
1. **Seed JSON Data**: 
   - `kb.json` (Knowledge base and policies)
   - `ticketHistory.json` (Historical closed and active tickets)
   - `seedRequests.json` (Test requests to drive the demo)
2. **In-Memory Store**:
   - Create `store.js` which loads `ticketHistory.json` into an in-memory array and exposes functions to `getTickets()`, `getTicketById(id)`, and `addTicket(ticket)`.

## Files to modify
None

## Files to create
- `server/server.js` (Express setup, CORS, JSON body parser, health route)
- `server/data/kb.json` (Seed data)
- `server/data/ticketHistory.json` (Seed data)
- `server/data/seedRequests.json` (Seed data)
- `server/store.js` (In-memory ticket manager)

## Rules for implementation
- Node.js + Express backend.
- No DB integration (SQLite/Postgres etc.). Rely strictly on the `store.js` in-memory state.
- Seed data must be transcribed perfectly from the datapack (no missing fields).
- Keep route handlers thin.

## Definition of done
- [ ] `server/server.js` exists and can run on a specified port (e.g., 3000).
- [ ] `GET /health` returns a 200 OK status.
- [ ] All three JSON seed files are created in `server/data/`.
- [ ] `server/store.js` successfully initializes state by loading `ticketHistory.json`.
---
