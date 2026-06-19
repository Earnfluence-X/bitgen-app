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

// ✅ POSITION-BASED RANKS - Each position is UNIQUE
const POSITION_RANKS = [
  { 
    position: 1,
    emoji: '👑', 
    label: 'The Don',
    color: 'var(--gold)',
    bgColor: 'rgba(255, 215, 0, 0.20)',
    borderColor: 'var(--gold)',
  },
  { 
    position: 2,
    emoji: '🥇', 
    label: 'The Boss',
    color: '#C0C0C0',
    bgColor: 'rgba(192, 192, 192, 0.15)',
    borderColor: '#C0C0C0',
  },
  { 
    position: 3,
    emoji: '🥈', 
    label: 'Agba baller',
    color: '#CD7F32',
    bgColor: 'rgba(205, 127, 50, 0.15)',
    borderColor: '#CD7F32',
  },
  { 
    position: 4,
    emoji: '🥉', 
    label: 'Baller',
    color: 'var(--text-secondary)',
    bgColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'var(--border-light)',
  },
  { 
    position: 5,
    emoji: '⭐', 
    label: 'Nepo baby',
    color: 'var(--text-meta)',
    bgColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'var(--border-default)',
  },
];

function getRankByPosition(position: number) {
  return POSITION_RANKS.find(rank => rank.position === position) || POSITION_RANKS[POSITION_RANKS.length - 1];
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
      const cached = getCachedLeaderboard();
      if (cached) {
        setUsers(cached);
        setLoading(false);
        return;
      }

      const usersRef = collection(db, 'users');
      // ✅ TOP 5 USERS by balance
      const q = query(usersRef, orderBy('balance', 'desc'), limit(5));
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
          Top {users.length}
        </div>
      </div>

      {users.map((leaderboardUser, index) => {
        const isCurrentUser = leaderboardUser.id === user?.id;
        const position = index + 1;
        const rank = getRankByPosition(position);
        
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
              border: isCurrentUser 
                ? `2px solid var(--green-border)` 
                : position === 1 
                  ? `2px solid ${rank.borderColor}` 
                  : 'none',
              transition: '0.2s',
              cursor: 'default',
              position: 'relative',
            }}
          >
            {/* Position Badge - Large and prominent for #1 */}
            {position === 1 && (
              <div style={{
                position: 'absolute',
                top: '-6px',
                right: '12px',
                background: 'var(--gold)',
                color: 'var(--bg-primary)',
                padding: '2px 12px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                🏆 #1
              </div>
            )}

            {/* Rank Position (1-5) */}
            <div style={{
              width: '28px',
              fontSize: '14px',
              fontWeight: 700,
              color: position <= 3 ? 'var(--gold)' : 'var(--text-meta)',
              textAlign: 'center',
            }}>
              #{position}
            </div>

            {/* Rank Emoji + Label - UNIQUE per position */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '44px',
            }}>
              <span style={{ fontSize: '22px' }}>{rank.emoji}</span>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                color: rank.color,
                background: rank.bgColor,
                padding: '2px 8px',
                borderRadius: '10px',
                marginTop: '2px',
                whiteSpace: 'nowrap',
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
                : position === 1
                  ? 'linear-gradient(135deg, var(--gold), var(--gold-dark))'
                  : 'linear-gradient(135deg, #1c212e, #2a3142)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: isCurrentUser || position === 1 ? 'var(--bg-primary)' : 'var(--text-secondary)',
              flexShrink: 0,
              border: position === 1 ? '2px solid var(--gold)' : '1px solid var(--border-light)',
              boxShadow: position === 1 ? '0 0 20px rgba(255, 215, 0, 0.2)' : 'none',
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

            {/* Position Title - Bold and prominent */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '2px',
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 800,
                color: rank.color,
                textShadow: position === 1 ? '0 0 20px rgba(255, 215, 0, 0.2)' : 'none',
              }}>
                {rank.label}
              </span>
              <span style={{
                fontSize: '8px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {position === 1 ? '🏆 CHAMPION' : `Rank #${position}`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}