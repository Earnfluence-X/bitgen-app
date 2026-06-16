import { useState, useEffect } from 'react';
import { useAdminStore } from '../../lib/adminStore';
import { formatTimeAgo } from '../../lib/utils';
import { deleteGig } from '../../lib/admin';

export default function AdminGigs() {
  const { loadStats } = useAdminStore();
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadGigs();
  }, [filter]);

  const loadGigs = async () => {
    setLoading(true);
    try {
      const { getAdminGigs } = await import('../../lib/admin');
      const gigsData = await getAdminGigs({ 
        limit: 100,
        status: filter === 'all' ? undefined : filter 
      });
      setGigs(gigsData);
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGig = async (gigId: string, reason?: string) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;
    try {
      await deleteGig(gigId, reason);
      await loadGigs();
      await loadStats();
    } catch (error) {
      console.error('Error deleting gig:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        {['all', 'open', 'requested', 'accepted', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 16px',
              background: filter === status ? 'var(--green-bg)' : 'transparent',
              border: `1px solid ${filter === status ? 'var(--green-border)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-full)',
              color: filter === status ? 'var(--green)' : 'var(--text-meta)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {status} ({gigs.filter(g => status === 'all' || g.status === status).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading gigs...
        </div>
      ) : gigs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No gigs found
        </div>
      ) : (
        gigs.map((gig) => (
          <div key={gig.id} style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {gig.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-meta)', marginTop: '4px' }}>
                  by @{gig.posterUsername} • {gig.category} • {formatTimeAgo(gig.createdAt)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gold)', marginTop: '4px' }}>
                  ★ {gig.coinReward} BG
                </div>
                {gig.applicants && gig.applicants.length > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text-meta)', marginTop: '4px' }}>
                    {gig.applicants.length} applicant(s)
                  </div>
                )}
              </div>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                background: gig.status === 'open' ? 'var(--green-bg)' : 
                          gig.status === 'completed' ? 'var(--gold-bg)' : 
                          gig.status === 'accepted' ? 'var(--gold-bg)' :
                          'var(--red-bg)',
                color: gig.status === 'open' ? 'var(--green)' : 
                       gig.status === 'completed' ? 'var(--gold)' : 
                       gig.status === 'accepted' ? 'var(--gold)' :
                       'var(--red)',
                textTransform: 'capitalize',
              }}>
                {gig.status}
              </span>
            </div>
            {gig.description && (
              <div style={{ color: 'var(--text-meta)', fontSize: '13px', marginTop: '8px' }}>
                {gig.description.length > 100 ? gig.description.slice(0, 100) + '...' : gig.description}
              </div>
            )}
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleDeleteGig(gig.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'var(--red-bg)',
                  border: '1px solid var(--red-border)',
                  color: 'var(--red)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Delete Gig
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}