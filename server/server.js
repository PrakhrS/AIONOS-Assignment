require('dotenv').config();
const express = require('express');
const cors = require('cors');
const store = require('./store'); 
const { processMessage } = require('./lib/agent');
const { applyEscalationGuard } = require('./lib/escalationRules');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Internal Service Agent backend is running.' });
});

function mapActionToStatus(action) {
  switch (action) {
    case 'resolve': return 'resolved';
    case 'escalate': return 'escalated';
    case 'ask_followup': return 'in_progress';
    case 'info': return 'in_progress';
    default: return 'in_progress';
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, employeeName, employeeEmail, ticketId, conversationHistory } = req.body;
    
    if (!message || !employeeName || !employeeEmail) {
      return res.status(400).json({ error: 'message, employeeName, and employeeEmail are required.' });
    }

    const agentResponse = await processMessage({ message, employeeName, employeeEmail, conversationHistory });
    const guardedResponse = applyEscalationGuard(agentResponse, message);
    
    let currentTicketId = ticketId;
    const status = mapActionToStatus(guardedResponse.action);
    
    if (!currentTicketId) {
      currentTicketId = store.getNextTicketId();
      store.addTicket({
        id: currentTicketId,
        employee: employeeName,
        email: employeeEmail,
        issueSummary: message.substring(0, 120),
        category: guardedResponse.category || 'unknown',
        status,
        kbSource: guardedResponse.kbSource || null,
        escalatedTo: guardedResponse.escalatedTo || null,
        createdAt: new Date().toISOString(),
        auditTrail: []
      });
    } else {
      store.updateTicket(currentTicketId, { 
        status, 
        category: guardedResponse.category || 'unknown', 
        kbSource: guardedResponse.kbSource || null, 
        escalatedTo: guardedResponse.escalatedTo || null 
      });
    }

    store.appendAuditEntry(currentTicketId, {
      ts: new Date().toISOString(),
      actor: 'agent',
      action: guardedResponse.action,
      detail: guardedResponse.ticketUpdate || guardedResponse.reply.substring(0, 200) + (guardedResponse.ruleApplied ? ` (Guard rule applied: ${guardedResponse.ruleApplied})` : '')
    });

    res.json({
      reply: guardedResponse.reply,
      action: guardedResponse.action,
      category: guardedResponse.category,
      kbSource: guardedResponse.kbSource || null,
      escalatedTo: guardedResponse.escalatedTo || null,
      ticketId: currentTicketId,
      ticketUpdate: guardedResponse.ticketUpdate || null
    });
    
  } catch (err) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: 'Failed to process your request. Please try again.' });
  }
});
// List all tickets
app.get('/api/tickets', (req, res) => {
  res.json(store.getTickets());
});

// Get a single ticket by ID (includes full audit trail)
app.get('/api/tickets/:id', (req, res) => {
  const ticket = store.getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: `Ticket ${req.params.id} not found.` });
  }
  res.json(ticket);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
