import BalanceCard from './BalanceCard';
import QuickActions from './QuickActions';
import ActivityFeed from './ActivityFeed';
import Leaderboard from './Leaderboard';

export default function Dashboard() {
  return (
    <div className="fade-in">
      <BalanceCard />
      <Leaderboard />
      <QuickActions />
      <ActivityFeed />
    </div>
  );
}