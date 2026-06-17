import { useStore } from '../../lib/store';

export default function QuickActions() {
  const { openModal } = useStore();

  return (
    <div className="action-buttons">
      <button className="action-btn" onClick={() => openModal('send')}>
        <div className="action-icon-circle send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </div>
        Send
      </button>
      <button className="action-btn" onClick={() => openModal('receive')}>
        <div className="action-icon-circle receive">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        </div>
        Receive
      </button>
      <button className="action-btn" onClick={() => openModal('buy')}>
        <div className="action-icon-circle" style={{ background: 'var(--gold-bg)', color: 'var(--gold)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12M6 12h12" />
          </svg>
        </div>
        Buy
      </button>
    </div>
  );
}