const fs = require('fs');
const path = require('path');

let tickets = [];

function loadData() {
  try {
    const dataPath = path.join(__dirname, 'data', 'ticketHistory.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    tickets = JSON.parse(data);
    console.log(`Loaded ${tickets.length} tickets into in-memory store.`);
  } catch (error) {
    console.error("Error loading ticket history data:", error);
    tickets = [];
  }
}

function getTickets() {
  return tickets;
}

function getTicketById(id) {
  return tickets.find(t => t.id === id);
}

function addTicket(ticket) {
  tickets.push(ticket);
  return ticket;
}

function updateTicket(id, updates) {
  const index = tickets.findIndex(t => t.id === id);
  if (index !== -1) {
    tickets[index] = { ...tickets[index], ...updates };
    return tickets[index];
  }
  return null;
}

function getNextTicketId() {
  const maxNum = tickets.reduce((max, t) => {
    const num = parseInt(t.id.replace('TK-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `TK-${String(maxNum + 1).padStart(4, '0')}`;
}

function appendAuditEntry(ticketId, entry) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return null;
  if (!ticket.auditTrail) ticket.auditTrail = [];
  ticket.auditTrail.push(entry);
  return ticket;
}

// Initial load
loadData();

module.exports = {
  getTickets,
  getTicketById,
  addTicket,
  updateTicket,
  getNextTicketId,
  appendAuditEntry
};
