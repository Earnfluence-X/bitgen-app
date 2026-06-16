import { useState } from 'react';
import { useStore } from '../../lib/store';
import GigCard from './GigCard';

const filterOptions = ['All', 'Needed', 'Offered', 'My Gigs', 'My Requests'];

export default function GigsBoard() {
  const { gigs, user, openModal } = useStore();
  const [filter, setFilter] = useState('All');

  const filteredGigs = gigs.filter((gig) => {
    if (filter === 'Needed') return gig.type === 'needed';
    if (filter === 'Offered') return gig.type === 'offered';
    if (filter === 'My Gigs') return gig.posterId === user?.id;
    if (filter === 'My Requests') return gig.applicants?.some(a => a.userId === user?.id);
    return true;
  });

  return (
    <div className="fade-in">
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <h2 className="section-title">Gig Board</h2>
        <button className="section-link" onClick={() => openModal('gig')}>
          + Post Gig
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        {filterOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            style={{
              padding: '8px 16px',
              background: filter === opt ? 'var(--green-bg)' : 'transparent',
              border: `1px solid ${filter === opt ? 'var(--green-border)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-full)',
              color: filter === opt ? 'var(--green)' : 'var(--text-meta)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Gig List */}
      {filteredGigs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 16px',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto', display: 'block', color: 'var(--text-muted)' }}>
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <p style={{ fontSize: '14px', marginBottom: '4px' }}>No gigs found</p>
          <p style={{ fontSize: '12px' }}>Be the first to post one!</p>
        </div>
      ) : (
        filteredGigs.map((gig) => (
          <GigCard key={gig.id} gig={gig} />
        ))
      )}
    </div>
  );
}