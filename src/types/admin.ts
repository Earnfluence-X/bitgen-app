export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalCoinsInCirculation: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  totalGigs: number;
  openGigs: number;
  completedGigs: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  avgReputation: number;
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  totalFeesCollected: number; // ✅ ADDED - Tracks all fees collected
}

export interface AdminUser {
  id: string;
  username: string;
  userTag: string;
  email: string;
  balance: number;
  gigsPosted: number;
  gigsCompleted: number;
  reputationScore: number;
  createdAt: string;
  lastActive: string;
  isSuspended: boolean;
  isAdmin: boolean;
  reports: number;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetId: string;
  targetUsername: string;
  targetType: 'user' | 'gig' | 'transaction';
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolution: 'warn' | 'suspend' | 'dismiss' | null;
  resolutionNote: string | null;
}

export interface AdminTransaction {
  id: string;
  type: string;
  senderUsername: string;
  recipientUsername: string;
  amount: number;
  note: string;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  action: 'suspend_user' | 'unsuspend_user' | 'make_admin' | 'resolve_report' | 'delete_gig' | 'warn_user' | 'remove_admin' | 'delete_user';
  userId: string;
  username?: string;
  timestamp: string;
  details?: string;
  adminId?: string;
  adminName?: string;
}

// ✅ ADDED - Fee transaction type
export interface FeeTransaction {
  id: string;
  type: 'fee';
  senderId: string;
  senderUsername: string;
  senderUserTag: string;
  amount: number;
  note: string;
  createdAt: string;
}