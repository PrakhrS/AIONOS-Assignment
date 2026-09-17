import { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

function ChatPanel({ messages, isLoading, ticketId, onSendMessage, onNewConversation }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getActionBadgeClass = (action) => {
    if (action === 'resolve') return 'badge-resolved';
    if (action === 'escalate') return 'badge-escalated';
    return 'badge-in-progress';
  };

  const formatActionText = (action, escalatedTo) => {
    if (action === 'resolve') return 'Resolved';
    if (action === 'escalate') return `Escalated${escalatedTo ? ' to ' + escalatedTo : ''}`;
    if (action === 'ask_followup') return 'Follow-up Needed';
    return 'Info';
  };

  return (
    <div className="chat-panel">
      <header className="chat-header">
        <div className="chat-header-info">
          <h2>IT Support Agent</h2>
          {ticketId && <span className="ticket-id-badge">{ticketId}</span>}
        </div>
        <button className="btn-new-chat" onClick={onNewConversation}>
          New Conversation
        </button>
      </header>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Describe your IT issue to get started.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.role}`}>
              <div className="message-bubble">
                <p className="message-text">{msg.text}</p>
                {msg.role === 'agent' && (
                  <div className="message-meta">
                    {msg.action && (
                      <span className={`badge ${getActionBadgeClass(msg.action)}`}>
                        {formatActionText(msg.action, msg.escalatedTo)}
                      </span>
                    )}
                    {msg.kbSource && (
                      <span className="kb-source">📋 {msg.kbSource}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="message-wrapper agent">
            <div className="message-bubble typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your issue... (Enter to send, Shift+Enter for newline)"
          disabled={isLoading}
        />
        <button type="submit" disabled={!input.trim() || isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatPanel;
