import BalanceCard from './BalanceCard';
import QuickActions from './QuickActions';
import ActivityFeed from './ActivityFeed';

export default function Dashboard() {
  return (
    <div className="fade-in">
      <BalanceCard />
      <QuickActions />
      <ActivityFeed />
    </div>
  );
}
