import { useStore } from '../../lib/store';

export default function StatsGrid() {
  const { user } = useStore();
  if (!user) return null;

  const stats = [
    { label: 'Gigs Done', value: user.gigsCompleted, color: 'var(--green)' },
    { label: 'Gigs Posted', value: user.gigsPosted, color: 'var(--text-secondary)' },
    { label: 'Reputation', value: user.reputationScore?.toFixed(1) || '5.0', color: 'var(--gold)' },
    { label: 'Streak', value: `${user.loginStreak}d`, color: 'var(--red)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      marginBottom: '20px',
    }}>
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <div className="stat-card-value" style={{ color: stat.color }}>{stat.value}</div>
          <div className="stat-card-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
