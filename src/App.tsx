import { useEffect } from 'react';
import { useStore } from './lib/store';
import { useAdminStore } from './lib/adminStore';
import AppShell from './components/layout/AppShell';
import OnboardingScreen from './components/auth/OnboardingScreen';
import Dashboard from './components/dashboard/Dashboard';
import GigsBoard from './components/gigs/GigsBoard';
import ProfileScreen from './components/profile/ProfileScreen';
import SendFlow from './components/send/SendFlow';
import ReceiveFlow from './components/receive/ReceiveFlow';
import GigForm from './components/gigs/GigForm';
import SetPinModal from './components/profile/SetPinModal';
import AdminDashboard from './components/admin/AdminDashboard';

function LoadingScreen() {
  return (
    <div className="app-container">
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
      }}>
        <div className="coin-b" style={{ width: '56px', height: '56px', fontSize: '26px' }}>B</div>
        <div style={{ color: 'var(--text-meta)', fontSize: '14px' }}>Loading BitGen...</div>
        <div style={{
          width: '120px',
          height: '3px',
          background: 'var(--border-default)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '40%',
            height: '100%',
            background: 'var(--green)',
            borderRadius: '2px',
            animation: 'shimmer 1.2s infinite',
          }} />
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { activeTab, activeModal, firebaseUser, user } = useStore();
  const { checkAdmin, isAdmin, adminChecked } = useAdminStore();

  // Check admin status when user logs in
  useEffect(() => {
    if (firebaseUser && user && !adminChecked) {
      checkAdmin(firebaseUser.uid, firebaseUser.email || '');
    }
  }, [firebaseUser, user, adminChecked, checkAdmin]);

  return (
    <AppShell>
      {activeTab === 'home' && <Dashboard />}
      {activeTab === 'gigs' && <GigsBoard />}
      {activeTab === 'profile' && <ProfileScreen />}
      {activeTab === 'admin' && <AdminDashboard />}
      {activeModal === 'send' && <SendFlow />}
      {activeModal === 'receive' && <ReceiveFlow />}
      {activeModal === 'gig' && <GigForm />}
      {activeModal === 'pin' && <SetPinModal />}
    </AppShell>
  );
}

export default function App() {
  const { firebaseUser, authLoading, initialize } = useStore();

  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!firebaseUser) {
    return <OnboardingScreen />;
  }

  return <AppContent />;
}