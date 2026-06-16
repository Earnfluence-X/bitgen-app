import { useStore } from '../../lib/store';
import { useAdminStore } from '../../lib/adminStore';
import type { TabType } from '../../types';

const navItems: { id: TabType; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: 'H' },
  { id: 'gigs', label: 'Gigs', icon: 'G' },
  { id: 'profile', label: 'Profile', icon: 'P' },
];

export default function BottomNav() {
  const { activeTab, setActiveTab } = useStore();
  const { isAdmin } = useAdminStore();

  // Only show admin nav if user is admin
  const allNavItems = isAdmin 
    ? [...navItems, { id: 'admin' as TabType, label: 'Admin', icon: '👑' }]
    : navItems;

  return (
    <div className="bottom-nav">
      {allNavItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
        >
          {item.id === 'admin' ? (
            <span style={{ fontSize: '18px' }}>👑</span>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.id === 'home' && (
                <>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </>
              )}
              {item.id === 'gigs' && (
                <>
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </>
              )}
              {item.id === 'profile' && (
                <>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </>
              )}
            </svg>
          )}
          <span>{item.label}</span>
          <div className="nav-dot" />
        </button>
      ))}
    </div>
  );
}