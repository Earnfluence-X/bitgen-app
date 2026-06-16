import { useStore } from '../../lib/store';
import { formatNumber } from '../../lib/utils';
import Skeleton from '../ui/Skeleton';

export default function BalanceCard() {
  const { user, balance } = useStore();

  if (!user) {
    return (
      <div className="balance-card">
        <Skeleton width="80px" height="12px" />
        <div style={{ marginTop: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
          <Skeleton width="48px" height="48px" borderRadius="50%" />
          <Skeleton width="120px" height="44px" />
        </div>
      </div>
    );
  }

  return (
    <div className="balance-card">
      <div className="balance-label">Total Balance</div>
      <div className="balance-row">
        <div className="coin-b">B</div>
        <div className="balance-amount">
          {formatNumber(balance)}
          <span className="currency">BG</span>
        </div>
      </div>
      <div className="balance-stats">
        <div className="balance-stat">
          <span className="balance-stat-label">Earned</span>
          <span className="balance-stat-value green">+{formatNumber(user.totalEarned)}</span>
        </div>
        <div className="balance-stat">
          <span className="balance-stat-label">Spent</span>
          <span className="balance-stat-value red">-{formatNumber(user.totalSpent)}</span>
        </div>
        <div className="balance-stat">
          <span className="balance-stat-label">Streak</span>
          <span className="balance-stat-value gold">{user.loginStreak}d</span>
        </div>
      </div>
    </div>
  );
}
