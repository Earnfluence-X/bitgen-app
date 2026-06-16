import { type ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import Toast from './Toast';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-container">
      <div className="app-inner">
        <Header />
        {children}
      </div>
      <BottomNav />
      <Toast />
    </div>
  );
}
