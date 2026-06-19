// src/components/admin/ActivityFeed.tsx

import { useState, useEffect } from 'react';
import { getActivityLogs } from '../../lib/admin';
import { formatTimeAgo } from '../../lib/utils';

type ActivityLog = {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
};

const ACTION_ICONS: Record<string, string> = {
  login: '🔑',
  send: '📤',
  receive: '📥',
  post_gig: '📝',
  claim_bonus: '🎁',
  complete_gig: '✅',
  cancel_gig: '❌',
  report: '⚠️',
};

const ACTION_COLORS: Record<string, string> = {
  login: 'var(--text-meta)',
  send: 'var(--red)',
  receive: 'var(--green)',
  post_gig: 'var(--gold)',
  claim_bonus: 'var(--gold)',
  complete_gig: 'var(--green)',
  cancel_gig: 'var(--red)',
  report: 'var(--red)',
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const logs = await getActivityLogs(50);
      setActivities(logs);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.action === filter);

  const actionTypes = ['all', ...new Set(activities.map(a => a.action))];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        Loading activity feed...
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        overflowX: 'auto',
        flexWrap: 'wrap',
      }}>
        {actionTypes.map((action) => (
          <button
            key={action}
            onClick={() => setFilter(action)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: filter === action ? 'var(--green-bg)' : 'transparent',
              border: `1px solid ${filter === action ? 'var(--green-border)' : 'var(--border-default)'}`,
              color: filter === action ? 'var(--green)' : 'var(--text-meta)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {action === 'all' ? '📊 All' : `${ACTION_ICONS[action] || '📌'} ${action.replace('_', ' ')}`}
            <span style={{ marginLeft: '4px', opacity: 0.6 }}>
              ({activities.filter(a => action === 'all' || a.action === action).length})
            </span>
          </button>
        ))}
      </div>

      {filteredActivities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No activity found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                transition: '0.2s',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                background: 'var(--bg-hover)',
                flexShrink: 0,
              }}>
                {ACTION_ICONS[activity.action] || '📌'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}>
                  <strong>@{activity.username}</strong>
                  <span style={{ color: 'var(--text-meta)', margin: '0 6px' }}>•</span>
                  <span style={{ color: ACTION_COLORS[activity.action] || 'var(--text-meta)' }}>
                    {activity.action.replace('_', ' ')}
                  </span>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-meta)',
                }}>
                  {activity.details}
                </div>
              </div>

              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}>
                {formatTimeAgo(activity.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}