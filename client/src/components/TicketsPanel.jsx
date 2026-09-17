import './TicketsPanel.css';

function TicketsPanel({ tickets, activeTicketId, onSelectTicket }) {
  
  const getStatusBadgeClass = (status) => {
    if (status === 'resolved') return 'status-resolved';
    if (status === 'escalated') return 'status-escalated';
    return 'status-in-progress';
  };

  const formatStatus = (status) => {
    if (status === 'in_progress') return 'In Progress';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="tickets-panel">
      <header className="tickets-header">
        <h2>Tickets ({tickets.length})</h2>
      </header>

      <div className="tickets-list">
        {tickets.length === 0 ? (
          <div className="empty-tickets">No tickets found.</div>
        ) : (
          tickets.map(ticket => (
            <div 
              key={ticket.id} 
              className={`ticket-card ${activeTicketId === ticket.id ? 'active' : ''}`}
              onClick={() => onSelectTicket(ticket.id)}
            >
              <div className="ticket-card-header">
                <span className="ticket-id">{ticket.id}</span>
                <span className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>
                  {formatStatus(ticket.status)}
                </span>
              </div>
              <h3 className="ticket-summary">{ticket.issueSummary}</h3>
              <div className="ticket-card-meta">
                <span>{ticket.employee}</span>
                <span className="dot-separator">•</span>
                <span className="ticket-category">{ticket.category}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TicketsPanel;
