import { useStore } from '../../lib/store';
import { getInitials } from '../../lib/utils';
import StatsGrid from './StatsGrid';
import DailyBonus from './DailyBonus';
import ReferralCard from './ReferralCard';

export default function ProfileScreen() {
  const { user, logout, purchaseVerifiedBadge, showToast } = useStore();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
  };

  const handlePurchaseVerified = async () => {
    try {
      await purchaseVerifiedBadge();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to purchase badge';
      showToast(message, 'error');
    }
  };

  return (
    <div className="fade-in">
      {/* Profile Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1c212e, #2a3142)',
          border: user?.isVerified ? '3px solid var(--gold)' : '2px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '28px',
          color: 'var(--text-secondary)',
          margin: '0 auto 12px',
          position: 'relative',
        }}>
          {getInitials(user.username)}
          {user?.isVerified && (
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              fontSize: '20px',
            }}>
              🎖️
            </div>
          )}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          @{user.username}
          {user?.isVerified && (
            <span style={{ 
              fontSize: '14px', 
              color: 'var(--gold)', 
              marginLeft: '8px',
            }}>
              ✓ Verified
            </span>
          )}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-meta)' }}>
          {user.email}
        </div>
      </div>

      {/* Verified Badge Purchase */}
      {!user?.isVerified && (
        <div style={{
          background: 'linear-gradient(160deg, rgba(255, 215, 0, 0.06), var(--bg-primary))',
          border: '1px solid var(--gold-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              🎖️ Get Verified
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-meta)' }}>
              50 BG - One-time purchase
            </div>
          </div>
          <button
            onClick={handlePurchaseVerified}
            style={{
              padding: '8px 20px',
              borderRadius: '50px',
              background: 'var(--gold-bg)',
              border: '1px solid var(--gold-border)',
              color: 'var(--gold)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Buy
          </button>
        </div>
      )}

      {/* Daily Bonus */}
      <DailyBonus />

      {/* Stats Grid */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Your Stats
        </h3>
        <StatsGrid />
      </div>

      {/* Referral Card */}
      <div style={{ marginBottom: '24px' }}>
        <ReferralCard />
      </div>

      {/* Wallet Summary */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid #1a1f2c',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        marginBottom: '24px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Wallet Summary
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-meta)', fontSize: '13px' }}>Current Balance</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.balance} BG</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-meta)', fontSize: '13px' }}>Total Earned</span>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>+{user.totalEarned} BG</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-meta)', fontSize: '13px' }}>Total Spent</span>
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>-{user.totalSpent} BG</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        className="btn btn-outline"
        onClick={handleLogout}
        style={{
          borderColor: 'var(--red)',
          color: 'var(--red)',
        }}
      >
        Sign Out
      </button>
    </div>
  );
}