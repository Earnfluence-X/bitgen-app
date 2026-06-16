import { useEffect, useState } from 'react';
import { useAdminStore } from '../../lib/adminStore';
import AdminStats from './AdminStats';
import AdminUsers from './AdminUsers';
import AdminReports from './AdminReports';
import AdminGigs from './AdminGigs';

type AdminTab = 'overview' | 'users' | 'reports' | 'gigs' | 'settings';

export default function AdminDashboard() {
  const { isAdmin, loadStats, loadUsers, loadReports } = useAdminStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadUsers();
      loadReports();
    }
  }, [isAdmin]);

  // ✅ This is the security check - non-admins see Access Denied
  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h2>Admin Access Required</h2>
        <p style={{ color: 'var(--text-meta)' }}>
          You don't have permission to view this page.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: 'var(--green-bg)',
            border: '1px solid var(--green-border)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--green)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return <AdminStats />;
      case 'users':
        return <AdminUsers />;
      case 'reports':
        return <AdminReports />;
      case 'gigs':
        return <AdminGigs />;
      default:
        return <AdminStats />;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-meta)', fontSize: '14px' }}>
          Monitor and manage the BitGen platform
        </p>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '8px',
      }}>
        {['overview', 'users', 'reports', 'gigs', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as AdminTab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab ? 'var(--green-bg)' : 'transparent',
              border: `1px solid ${activeTab === tab ? 'var(--green-border)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-full)',
              color: activeTab === tab ? 'var(--green)' : 'var(--text-meta)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}