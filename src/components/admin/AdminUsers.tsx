// src/components/admin/AdminUsers.tsx

import { useState } from 'react';
import { useAdminStore } from '../../lib/adminStore';
import { formatTimeAgo } from '../../lib/utils';
import UserDetailModal from './UserDetailModal';

export default function AdminUsers() {
  const { users, loadUsers, suspendUser, unsuspendUser, makeAdmin, removeAdmin } = useAdminStore();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.userTag.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuspend = async (userId: string, currentStatus: boolean) => {
    if (currentStatus) {
      if (!confirm('Unsuspend this user?')) return;
      await unsuspendUser(userId);
    } else {
      if (!confirm('Suspend this user? They will lose access to the app.')) return;
      await suspendUser(userId);
    }
    await loadUsers();
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (currentStatus) {
      if (!confirm('Remove admin privileges from this user?')) return;
      await removeAdmin(userId);
    } else {
      if (!confirm('Grant admin privileges to this user?')) return;
      await makeAdmin(userId);
    }
    await loadUsers();
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          className="input-dark"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No users found
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div 
              key={user.id} 
              style={{
                background: 'var(--bg-primary)',
                border: `1px solid ${user.isSuspended ? 'var(--red-border)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                cursor: 'pointer',
                transition: '0.2s',
              }}
              onClick={() => setSelectedUser(user.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--green-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = user.isSuspended ? 'var(--red-border)' : 'var(--border-default)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    @{user.username}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-meta)' }}>
                    {user.userTag} • {user.email}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--gold)' }}>★ {user.reputationScore}</span>
                    <span style={{ color: 'var(--text-meta)', marginLeft: '12px' }}>
                      {user.balance} BG
                    </span>
                    <span style={{ color: 'var(--text-meta)', marginLeft: '12px' }}>
                      {user.gigsCompleted} gigs done • {user.gigsPosted} posted
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Joined {formatTimeAgo(user.createdAt)}
                    {user.isSuspended && (
                      <span style={{ color: 'var(--red)', marginLeft: '8px' }}>
                        ⚠️ Suspended
                      </span>
                    )}
                    {user.isAdmin && (
                      <span style={{ color: 'var(--gold)', marginLeft: '8px' }}>
                        👑 Admin
                      </span>
                    )}
                    {user.reports > 0 && (
                      <span style={{ color: 'var(--red)', marginLeft: '8px' }}>
                        {user.reports} reports
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleSuspend(user.id, user.isSuspended)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: user.isSuspended ? 'var(--green-bg)' : 'var(--red-bg)',
                      border: `1px solid ${user.isSuspended ? 'var(--green-border)' : 'var(--red-border)'}`,
                      color: user.isSuspended ? 'var(--green)' : 'var(--red)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                  <button
                    onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: user.isAdmin ? 'var(--gold-bg)' : 'var(--bg-hover)',
                      border: `1px solid ${user.isAdmin ? 'var(--gold-border)' : 'var(--border-default)'}`,
                      color: user.isAdmin ? 'var(--gold)' : 'var(--text-meta)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => setSelectedUser(user.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-meta)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📊 View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}