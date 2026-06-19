// src/components/admin/UserDetailModal.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from '../../lib/firebase';
import { formatTimeAgo } from '../../lib/utils';
import { getActivityLogsByUser } from '../../lib/admin';
import { useAdminStore } from '../../lib/adminStore';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
}

export default function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'transactions' | 'activity'>('profile');
  const { suspendUser, unsuspendUser } = useAdminStore();

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Get user profile
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUser({ id: userDoc.id, ...userDoc.data() });
      }

      // Get user transactions
      const txQuery = query(
        collection(db, 'transactions'),
        where('participants', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const txSnapshot = await getDocs(txQuery);
      setTransactions(txSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      // Get user activity logs
      const logs = await getActivityLogsByUser(userId, 20);
      setActivities(logs);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!user) return;
    if (user.isSuspended) {
      await unsuspendUser(userId);
    } else {
      if (!confirm(`Suspend @${user.username}?`)) return;
      await suspendUser(userId);
    }
    await loadUserData();
  };

  if (loading) {
    return (
      <div className="modal-overlay fade-in" onClick={onClose}>
        <div className="modal-sheet" style={{ textAlign: 'center', padding: '40px' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="modal-overlay fade-in" onClick={onClose}>
        <div className="modal-sheet" style={{ textAlign: 'center', padding: '40px' }}>
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <motion.div
        className="modal-sheet slide-up"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        style={{ maxHeight: '90vh' }}
      >
        <div className="modal-handle" />

        {/* User Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-default)',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1c212e, #2a3142)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            border: user.isSuspended ? '2px solid var(--red)' : '2px solid var(--border-light)',
          }}>
            {user.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              @{user.username}
              {user.isAdmin && (
                <span style={{ fontSize: '14px', color: 'var(--gold)' }}>👑</span>
              )}
              {user.isSuspended && (
                <span style={{
                  fontSize: '10px',
                  background: 'var(--red-bg)',
                  color: 'var(--red)',
                  padding: '2px 10px',
                  borderRadius: '10px',
                  fontWeight: 600,
                }}>
                  SUSPENDED
                </span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-meta)' }}>
              {user.userTag} • {user.email}
            </div>
          </div>
          <button
            onClick={handleSuspend}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: user.isSuspended ? 'var(--green-bg)' : 'var(--red-bg)',
              border: `1px solid ${user.isSuspended ? 'var(--green-border)' : 'var(--red-border)'}`,
              color: user.isSuspended ? 'var(--green)' : 'var(--red)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {user.isSuspended ? 'Unsuspend' : 'Suspend'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
        }}>
          {['profile', 'transactions', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background: activeTab === tab ? 'var(--green-bg)' : 'transparent',
                border: `1px solid ${activeTab === tab ? 'var(--green-border)' : 'var(--border-default)'}`,
                color: activeTab === tab ? 'var(--green)' : 'var(--text-meta)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Balance</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)' }}>{user.balance} BG</div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Reputation</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)' }}>★ {user.reputationScore?.toFixed(1) || '5.0'}</div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Gigs Posted</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)' }}>{user.gigsPosted || 0}</div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Gigs Completed</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)' }}>{user.gigsCompleted || 0}</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Joined</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatTimeAgo(user.createdAt)}</div>
            </div>
            {user.referredBy && (
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-meta)' }}>Referred By</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.referredBy}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No transactions
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} style={{
                  padding: '10px 12px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '6px',
                  border: '1px solid var(--border-default)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {tx.senderUsername} → {tx.recipientUsername}
                    </span>
                    <span style={{
                      fontWeight: 700,
                      color: tx.senderId === userId ? 'var(--red)' : 'var(--green)',
                    }}>
                      {tx.senderId === userId ? '-' : '+'}{tx.amount} BG
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-meta)' }}>
                    {tx.note} • {formatTimeAgo(tx.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No activity found
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} style={{
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '4px',
                  border: '1px solid var(--border-default)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}>
                  {activity.details}
                  <span style={{ fontSize: '11px', color: 'var(--text-meta)', marginLeft: '8px' }}>
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        <button
          className="btn btn-outline"
          onClick={onClose}
          style={{ marginTop: '16px' }}
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}