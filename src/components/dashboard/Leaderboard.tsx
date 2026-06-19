// src/components/dashboard/Leaderboard.tsx

import { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cacheLeaderboard, getCachedLeaderboard } from '../../lib/cache';

interface LeaderboardUser {
  id: string;
  username: string;
  userTag: string;
  balance: number;
  reputationScore: number;
}

// ✅ Rank tiers with labels only - NO NUMBERS
const RANK_TIERS = [
  { 
    emoji: '👑', 
    label: 'Legend', 
    minBalance: 2000,
    color: 'var(--gold)',
    bgColor: 'rgba(255, 215, 0, 0.15)',
  },
  { 
    emoji: '🥇', 
    label: 'Odogwu', 
    minBalance: 1000,
    color: 'var(--gold)',
    bgColor: 'rgba(255, 215, 0, 0.10)',
  },
  { 
    emoji: '🥈', 
    label: 'Agba baller', 
    minBalance: 500,
    color: '#C0C0C0',
    bgColor: 'rgba(192, 192, 192, 0.08)',
  },
  { 
    emoji: '🥉', 
    label: 'Baller', 
    minBalance: 250,
    color: '#CD7F32',
    bgColor: 'rgba(205, 127, 50, 0.08)',
  },
  { 
    emoji: '⭐', 
    label: 'Nepo Baby', 
    minBalance: 100,
    color: 'var(--gold)',
    bgColor: 'rgba(255, 215, 0, 0.06)',
  },
  { 
    emoji: '⭐', 
    label: 'Elder', 
    minBalance: 0,
    color: 'var(--text-meta)',
    bgColor: 'transparent',
  },
];

function getRank(balance: number) {
  return RANK_TIERS.find(rank => balance >= rank.minBalance) || RANK_TIERS[RANK_TIERS.length - 1];
}

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useStore();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      // ✅ Check cache first
      const cached = getCachedLeaderboard();
      if (cached) {
        setUsers(cached);
        setLoading(false);
        return;
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('balance', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      
      const leaderboardUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        username: doc.data().username || 'Unknown',
        userTag: doc.data().userTag || '@unknown',
        balance: doc.data().balance || 0,
        reputationScore: doc.data().reputationScore || 5,
      }));
      
      setUsers(leaderboardUsers);
      cacheLeaderboard(leaderboardUsers);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px' }}>
          🏆 Top Earners
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 0',
            borderBottom: i < 5 ? '1px solid var(--border-default)' : 'none',
          }}>
            <div style={{ width: '30px', height: '20px', background: 'var(--bg-hover)', borderRadius: '4px' }} />
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '80px', height: '14px', background: 'var(--bg-hover)', borderRadius: '4px' }} />
              <div style={{ width: '60px', height: '10px', background: 'var(--bg-hover)', borderRadius: '4px', marginTop: '4px' }} />
            </div>
            <div style={{ width: '60px', height: '14px', background: 'var(--bg-hover)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      marginBottom: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative glow */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-30%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.05), transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)' }}>
          🏆 Top Earners
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-meta)' }}>
          {users.length} users
        </div>
      </div>

      {users.map((leaderboardUser, index) => {
        const isCurrentUser = leaderboardUser.id === user?.id;
        const rank = getRank(leaderboardUser.balance);
        
        return (
          <div
            key={leaderboardUser.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: index < users.length - 1 ? '4px' : '0',
              background: isCurrentUser ? 'var(--green-bg)' : 'transparent',
              border: isCurrentUser ? '1px solid var(--green-border)' : 'none',
              transition: '0.2s',
              cursor: 'default',
            }}
          >
            {/* Rank Position (1-10) */}
            <div style={{
              width: '28px',
              fontSize: '14px',
              fontWeight: 700,
              color: index < 3 ? 'var(--gold)' : 'var(--text-meta)',
              textAlign: 'center',
            }}>
              #{index + 1}
            </div>

            {/* Rank Emoji + Label */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '44px',
            }}>
              <span style={{ fontSize: '22px' }}>{rank.emoji}</span>
              <span style={{
                fontSize: '9px',
                fontWeight: 600,
                color: rank.color,
                background: rank.bgColor,
                padding: '1px 6px',
                borderRadius: '8px',
                marginTop: '2px',
              }}>
                {rank.label}
              </span>
            </div>

            {/* Avatar */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isCurrentUser 
                ? 'linear-gradient(135deg, var(--green), var(--green-dark))'
                : 'linear-gradient(135deg, #1c212e, #2a3142)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: isCurrentUser ? 'var(--bg-primary)' : 'var(--text-secondary)',
              flexShrink: 0,
              border: index === 0 ? '2px solid var(--gold)' : '1px solid var(--border-light)',
            }}>
              {leaderboardUser.username.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: isCurrentUser ? 'var(--green)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                {leaderboardUser.username}
                {isCurrentUser && (
                  <span style={{
                    fontSize: '9px',
                    color: 'var(--green)',
                    background: 'var(--green-bg)',
                    padding: '1px 8px',
                    borderRadius: '10px',
                    fontWeight: 500,
                  }}>
                    YOU
                  </span>
                )}
                {index === 0 && (
                  <span style={{
                    fontSize: '9px',
                    color: 'var(--gold)',
                    background: 'var(--gold-bg)',
                    padding: '1px 8px',
                    borderRadius: '10px',
                    fontWeight: 500,
                  }}>
                    👑
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-meta)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>{leaderboardUser.userTag}</span>
                <span>•</span>
                <span>★ {leaderboardUser.reputationScore.toFixed(1)}</span>
              </div>
            </div>

            {/* ✅ Show rank badge only - NO NUMBERS */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '2px',
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 700,
                color: rank.color,
              }}>
                {rank.label}
              </span>
              <span style={{
                fontSize: '9px',
                color: 'var(--text-muted)',
                background: 'var(--bg-hover)',
                padding: '1px 8px',
                borderRadius: '8px',
              }}>
                {rank.emoji} Rank
              </span>
            </div>
          </div>
        );
      })}
      
      {/* Privacy note */}
      <div style={{
        marginTop: '12px',
        padding: '10px 12px',
        background: 'var(--bg-hover)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
      }}>
        <span>🔒</span>
        <span>Balances are private. Only achievement ranks are displayed.</span>
      </div>
    </div>
  );
}