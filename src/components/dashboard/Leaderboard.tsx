import { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface LeaderboardUser {
  id: string;
  username: string;
  userTag: string;
  balance: number;
  reputationScore: number;
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
      const usersRef = collection(db, 'users');
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
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (index: number) => {
    switch(index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getRankColor = (index: number) => {
    switch(index) {
      case 0: return 'var(--gold)';
      case 1: return '#C0C0C0';
      case 2: return '#CD7F32';
      default: return 'var(--text-meta)';
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
          🏆 Leaderboard
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 0',
            borderBottom: i < 5 ? '1px solid var(--border-default)' : 'none',
          }}>
            <div style={{ width: '30px', fontSize: '14px', color: 'var(--text-meta)' }}>#{i}</div>
            <div style={{ flex: 1 }}>
              <div style={{ width: '80px', height: '14px', background: 'var(--bg-hover)', borderRadius: '4px' }} />
              <div style={{ width: '60px', height: '10px', background: 'var(--bg-hover)', borderRadius: '4px', marginTop: '4px' }} />
            </div>
            <div style={{ width: '40px', height: '14px', background: 'var(--bg-hover)', borderRadius: '4px' }} />
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
          🏆 Leaderboard
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-meta)' }}>
          Top 5 Richest
        </div>
      </div>

      {users.map((leaderboardUser, index) => {
        const isCurrentUser = leaderboardUser.id === user?.id;
        
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
            {/* Rank */}
            <div style={{
              width: '32px',
              fontSize: index < 3 ? '20px' : '13px',
              fontWeight: index >= 3 ? 700 : 400,
              color: index >= 3 ? 'var(--text-meta)' : 'inherit',
              textAlign: 'center',
            }}>
              {getRankEmoji(index)}
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

            {/* Balance */}
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: index === 0 ? 'var(--gold)' : 'var(--text-primary)',
              textAlign: 'right',
            }}>
              {leaderboardUser.balance.toLocaleString()}
              <span style={{
                fontSize: '10px',
                fontWeight: 400,
                color: 'var(--text-meta)',
                marginLeft: '2px',
              }}>
                BG
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}