import { useAdminStore } from '../../lib/adminStore';

export default function AdminStats() {
  const { stats, loading } = useAdminStore();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading stats...</div>;
  }

  if (!stats) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No stats available</div>;
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, color: 'var(--green)' },
    { label: 'Active Today', value: stats.activeUsersToday, color: 'var(--gold)' },
    { label: 'Active This Week', value: stats.activeUsersThisWeek, color: 'var(--text-secondary)' },
    { label: 'Total Transactions', value: stats.totalTransactions, color: 'var(--text-secondary)' },
    { label: 'Coins in Circulation', value: `${stats.totalCoinsInCirculation} BG`, color: 'var(--gold)' },
    { label: '💰 Fees Collected', value: `${stats.totalFeesCollected} BG`, color: 'var(--green)' }, // ✅ ADDED
    { label: 'Total Gigs', value: stats.totalGigs, color: 'var(--text-secondary)' },
    { label: 'Open Gigs', value: stats.openGigs, color: 'var(--green)' },
    { label: 'Completed Gigs', value: stats.completedGigs, color: 'var(--gold)' },
    { label: 'Reports Pending', value: stats.pendingReports, color: 'var(--red)' },
    { label: 'Resolved Reports', value: stats.resolvedReports, color: 'var(--green)' },
    { label: 'Avg Reputation', value: stats.avgReputation, color: 'var(--gold)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {statCards.map((stat) => (
        <div key={stat.label} style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-meta)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {stat.label}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: stat.color }}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}