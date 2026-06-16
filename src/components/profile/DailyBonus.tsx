import { useState } from 'react';
import { useStore } from '../../lib/store';
import { getTodayDateString } from '../../lib/utils';
import { SoundEngine } from '../../lib/soundEngine';

export default function DailyBonus() {
  const { user, claimDailyBonus } = useStore();
  const [claiming, setClaiming] = useState(false);

  if (!user) return null;

  const today = getTodayDateString();
  const alreadyClaimed = user.lastBonusDate === today;
  const streakBonus = Math.min(5 + ((user.loginStreak || 1) - 1) * 2, 25);

  const handleClaim = async () => {
    if (alreadyClaimed || claiming) return;
    setClaiming(true);
    try {
      const success = await claimDailyBonus();
      if (success) {
        SoundEngine.coinReceive();
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="bonus-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Daily Bonus
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-meta)' }}>
            {alreadyClaimed ? 'Come back tomorrow!' : `Streak day ${user.loginStreak || 1}`}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--gold)',
          fontWeight: 700,
          fontSize: '18px',
        }}>
          <div className="coin-b-small" />
          +{streakBonus}
        </div>
      </div>

      {/* Streak Indicator */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <div
            key={day}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: day <= (user.loginStreak || 0) ? 'var(--gold)' : 'var(--border-default)',
              transition: '0.3s',
            }}
          />
        ))}
      </div>

      <button
        className={`btn ${alreadyClaimed ? 'btn-outline' : 'btn-primary'}`}
        onClick={handleClaim}
        disabled={alreadyClaimed || claiming}
        style={{
          padding: '12px',
          fontSize: '14px',
          opacity: alreadyClaimed ? 0.5 : 1,
        }}
      >
        {claiming ? 'Claiming...' : alreadyClaimed ? 'Already Claimed' : 'Claim Daily Bonus'}
      </button>
    </div>
  );
}
