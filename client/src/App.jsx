import { useState, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import TicketsPanel from './components/TicketsPanel';
import TicketDetail from './components/TicketDetail';
import './App.css';

function App() {
  const [employeeName, setEmployeeName] = useState('John Doe');
  const [employeeEmail, setEmployeeEmail] = useState('john.doe@veridian-corp.example');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [messages, setMessages] = useState([]);
  const [ticketId, setTicketId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Fetch tickets initially and whenever updated
  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (employeeName.trim() && employeeEmail.trim()) {
      setIsLoggedIn(true);
      fetchTickets();
    }
  };

  const handleSendMessage = async (text) => {
    // 1. Add user message
    const newMsg = { role: 'user', text };
    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    setIsLoading(true);

    // 2. Prepare conversation history for Gemini context
    const conversationHistory = newMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.text
    }));

    try {
      // 3. Call backend API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          employeeName,
          employeeEmail,
          ticketId, // Will be null for the first message, backend creates one
          conversationHistory
        })
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      // 4. Update state with agent response
      setTicketId(data.ticketId);
      setMessages([...newMessages, {
        role: 'agent',
        text: data.reply,
        action: data.action,
        category: data.category,
        kbSource: data.kbSource,
        escalatedTo: data.escalatedTo
      }]);
      
      // 5. Refresh tickets panel
      fetchTickets();

      // If viewing the active ticket, update the detail view
      if (selectedTicket && selectedTicket.id === data.ticketId) {
        handleSelectTicket(data.ticketId);
      }

    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'agent', text: 'Error connecting to IT service desk.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setTicketId(null);
  };

  const handleSelectTicket = async (id) => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
      }
    } catch (err) {
      console.error('Failed to fetch ticket detail', err);
    }
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
  };

  // Render Login Screen
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>IT Support Portal</h2>
          <div className="login-hint">
            <p><strong>Reviewer Instructions:</strong></p>
            <p>You can use the default test credentials below to quickly start testing, or enter your own.</p>
          </div>
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={employeeName} 
              onChange={e => setEmployeeName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={employeeEmail} 
              onChange={e => setEmployeeEmail(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary">Start Session</button>
        </form>
      </div>
    );
  }

  // Render Main Layout
  return (
    <div className="app-layout">
      <main className="panel chat-panel-container">
        <ChatPanel 
          messages={messages}
          isLoading={isLoading}
          ticketId={ticketId}
          onSendMessage={handleSendMessage}
          onNewConversation={handleNewConversation}
        />
      </main>
      <aside className="panel tickets-panel-container">
        {selectedTicket ? (
          <TicketDetail 
            ticket={selectedTicket} 
            onBack={handleBackToList} 
          />
        ) : (
          <TicketsPanel 
            tickets={tickets} 
            activeTicketId={ticketId}
            onSelectTicket={handleSelectTicket} 
          />
        )}
      </aside>
    </div>
  );
}

export default App;
