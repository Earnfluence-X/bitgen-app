import { useState } from 'react';
import { useAdminStore } from '../../lib/adminStore';
import { formatTimeAgo } from '../../lib/utils';

export default function AdminReports() {
  const { reports, loadReports, resolveReport } = useAdminStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing' | 'resolved' | 'dismissed'>('all');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredReports = reports.filter(r => filter === 'all' || r.status === filter);

  const handleResolve = async (reportId: string, resolution: 'warn' | 'suspend' | 'dismiss') => {
    if (!resolutionNote.trim()) {
      alert('Please add a resolution note');
      return;
    }
    
    setLoading(true);
    try {
      await resolveReport(reportId, resolution, resolutionNote);
      setSelectedReport(null);
      setResolutionNote('');
      await loadReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Failed to resolve report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        {['all', 'pending', 'reviewing', 'resolved', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
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
            {status} ({reports.filter(r => status === 'all' || r.status === status).length})
          </button>
        ))}
      </div>

      {filteredReports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No reports to show
        </div>
      ) : (
        filteredReports.map((report) => (
          <div key={report.id} style={{
            background: 'var(--bg-primary)',
            border: `1px solid ${report.status === 'pending' ? 'var(--red-border)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <span style={{ fontWeight: 600 }}>@{report.targetUsername}</span>
                <span style={{ color: 'var(--text-meta)', fontSize: '13px', marginLeft: '8px' }}>
                  reported by @{report.reporterUsername}
                </span>
              </div>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                background: report.status === 'pending' ? 'var(--red-bg)' : 
                          report.status === 'resolved' ? 'var(--green-bg)' : 
                          'var(--gold-bg)',
                color: report.status === 'pending' ? 'var(--red)' : 
                       report.status === 'resolved' ? 'var(--green)' : 
                       'var(--gold)',
              }}>
                {report.status}
              </span>
            </div>

            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>
              <strong>Reason:</strong> {report.reason}
            </div>
            {report.description && (
              <div style={{ color: 'var(--text-meta)', fontSize: '13px', marginBottom: '8px' }}>
                {report.description}
              </div>
            )}
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              {formatTimeAgo(report.createdAt)}
            </div>

            {report.status === 'pending' && selectedReport === report.id ? (
              <div style={{ marginTop: '12px' }}>
                <textarea
                  className="input-dark"
                  placeholder="Resolution note..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={2}
                  style={{ resize: 'none', marginBottom: '12px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleResolve(report.id, 'warn')}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: 'var(--gold-bg)',
                      border: '1px solid var(--gold-border)',
                      color: 'var(--gold)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      flex: 1,
                    }}
                  >
                    Warn User
                  </button>
                  <button
                    onClick={() => handleResolve(report.id, 'suspend')}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: 'var(--red-bg)',
                      border: '1px solid var(--red-border)',
                      color: 'var(--red)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      flex: 1,
                    }}
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => handleResolve(report.id, 'dismiss')}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-meta)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      flex: 1,
                    }}
                  >
                    Dismiss
                  </button>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  style={{
                    marginTop: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-meta)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    width: '100%',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : report.status === 'pending' && (
              <button
                onClick={() => setSelectedReport(report.id)}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: 'var(--green-bg)',
                  border: '1px solid var(--green-border)',
                  color: 'var(--green)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Review Report
              </button>
            )}

            {report.status === 'resolved' && report.resolution && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px 12px', 
                background: 'var(--bg-surface)', 
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                color: 'var(--text-meta)',
              }}>
                <strong>Resolution:</strong> {report.resolution}
                {report.resolutionNote && ` - ${report.resolutionNote}`}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}