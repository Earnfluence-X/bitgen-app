import { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { getInitials } from '../../lib/utils';
import { isUserAdmin } from '../../lib/admin';

export default function Header() {
  const { user, setActiveTab } = useStore();
  const [tapCount, setTapCount] = useState(0);
  const [tapTimer, setTapTimer] = useState<NodeJS.Timeout | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const initials = user ? getInitials(user.username) : '?';

  // Check if user is admin when they login
  useEffect(() => {
    if (user) {
      setCheckingAdmin(true);
      isUserAdmin(user.id, user.email)
        .then(setIsAdmin)
        .finally(() => setCheckingAdmin(false));
    } else {
      setIsAdmin(false);
      setCheckingAdmin(false);
    }
  }, [user]);

  const handleLogoClick = () => {
    // Only process taps if user is an admin
    if (!isAdmin) return;
    
    setTapCount(prev => prev + 1);
    
    if (tapTimer) {
      clearTimeout(tapTimer);
      setTapTimer(null);
    }
    
    const timer = setTimeout(() => {
      setTapCount(0);
      setTapTimer(null);
    }, 2000);
    setTapTimer(timer);
    
    // After 5 taps (0-4), go to admin
    if (tapCount >= 4) {
      setActiveTab('admin');
      setTapCount(0);
      if (tapTimer) {
        clearTimeout(tapTimer);
        setTapTimer(null);
      }
    }
  };

  return (
    <div className="app-header">
      <div 
        className="app-logo" 
        onClick={handleLogoClick} 
        style={{ 
          cursor: isAdmin ? 'pointer' : 'default',
          position: 'relative',
        }}
        title={isAdmin ? 'Tap 5 times for admin panel' : ''}
      >
        <div className="logo-icon">B</div>
        Bit<span>Gen</span>
        {isAdmin && (
          <span style={{ 
            fontSize: '14px', 
            color: 'var(--gold)', 
            marginLeft: '6px',
            fontWeight: 400,
          }}>
            👑
          </span>
        )}
        {!isAdmin && !checkingAdmin && user && (
          <span style={{ 
            fontSize: '10px', 
            color: 'var(--text-meta)', 
            marginLeft: '6px',
            fontWeight: 400,
          }}>
            user
          </span>
        )}
      </div>
      <button
        className="avatar-circle"
        onClick={() => setActiveTab('profile')}
        aria-label="Profile"
      >
        {initials}
      </button>
    </div>
  );
}