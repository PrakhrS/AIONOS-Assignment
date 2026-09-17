import './TicketDetail.css';

function TicketDetail({ ticket, onBack }) {
  if (!ticket) return null;

  const getStatusBadgeClass = (status) => {
    if (status === 'resolved') return 'badge-resolved';
    if (status === 'escalated') return 'badge-escalated';
    return 'badge-in-progress';
  };

  const formatStatus = (status) => {
    if (status === 'in_progress') return 'In Progress';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="ticket-detail">
      <header className="detail-header">
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <h2>{ticket.id}</h2>
      </header>

      <div className="detail-content">
        <section className="info-section">
          <div className="info-grid">
            <div className="info-group">
              <label>Employee</label>
              <div>{ticket.employee}</div>
            </div>
            <div className="info-group">
              <label>Email</label>
              <div>{ticket.email}</div>
            </div>
            <div className="info-group">
              <label>Category</label>
              <div className="category-tag">{ticket.category}</div>
            </div>
            <div className="info-group">
              <label>Status</label>
              <div>
                <span className={`detail-status-badge ${getStatusBadgeClass(ticket.status)}`}>
                  {formatStatus(ticket.status)}
                </span>
              </div>
            </div>
            <div className="info-group">
              <label>KB Source</label>
              <div>{ticket.kbSource || '—'}</div>
            </div>
            <div className="info-group">
              <label>Escalated To</label>
              <div>{ticket.escalatedTo || '—'}</div>
            </div>
          </div>
          
          <div className="info-group full-width mt-3">
            <label>Issue Summary</label>
            <div className="issue-summary-box">{ticket.issueSummary}</div>
          </div>
        </section>

        <section className="audit-section">
          <h3>Audit Trail</h3>
          <div className="timeline">
            {ticket.auditTrail && ticket.auditTrail.length > 0 ? (
              ticket.auditTrail.map((entry, idx) => {
                const date = new Date(entry.ts);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-time">{timeStr}</span>
                        <span className="timeline-actor">{entry.actor}</span>
                        <span className={`timeline-action action-${entry.action}`}>
                          {entry.action}
                        </span>
                      </div>
                      <div className="timeline-detail">{entry.detail}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="no-audit">No audit trail available.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default TicketDetail;
