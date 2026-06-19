// src/components/admin/AdminDashboard.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '../../lib/adminStore';
import AdminStats from './AdminStats';
import AdminUsers from './AdminUsers';
import AdminReports from './AdminReports';
import AdminGigs from './AdminGigs';
import ActivityFeed from './ActivityFeed';
import SystemConfig from './SystemConfig';
import CreateAnnouncement from './CreateAnnouncement';

type AdminTab = 'overview' | 'users' | 'reports' | 'gigs' | 'activity' | 'config';

export default function AdminDashboard() {
  const { isAdmin, loadStats, loadUsers, loadReports } = useAdminStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadUsers();
      loadReports();
    }
  }, [isAdmin]);

  // ✅ Security check - non-admins see Access Denied
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
      case 'activity':
        return <ActivityFeed />;
      case 'config':
        return <SystemConfig />;
      default:
        return <AdminStats />;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-meta)', fontSize: '14px' }}>
              Monitor and manage the BitGen platform
            </p>
          </div>
          <button
            onClick={() => setShowAnnouncement(true)}
            style={{
              padding: '10px 20px',
              background: 'var(--green-bg)',
              border: '1px solid var(--green-border)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--green)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📢 Announcement
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '8px',
        flexWrap: 'wrap',
      }}>
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'users', label: '👥 Users' },
          { id: 'reports', label: '📋 Reports' },
          { id: 'gigs', label: '🎯 Gigs' },
          { id: 'activity', label: '📈 Activity' },
          { id: 'config', label: '⚙️ Config' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab.id ? 'var(--green-bg)' : 'transparent',
              border: `1px solid ${activeTab === tab.id ? 'var(--green-border)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-full)',
              color: activeTab === tab.id ? 'var(--green)' : 'var(--text-meta)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderContent()}

      {/* Announcement Modal */}
      {showAnnouncement && (
        <CreateAnnouncement
          onClose={() => setShowAnnouncement(false)}
          onSuccess={() => {
            // Refresh or show success
          }}
        />
      )}
    </div>
  );
}