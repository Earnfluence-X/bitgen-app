export interface UserProfile {
  id: string;
  email: string;
  username: string;
  userTag: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactionPin: string;
  gigsCompleted: number;
  gigsPosted: number;
  reputationScore: number;
  reputationCount: number;
  loginStreak: number;
  lastLoginDate: string;
  lastBonusDate: string;
  emailVerified: boolean;
  createdAt: unknown;
  referralCode?: string;
  referredBy?: string;
  agreedToTerms?: boolean;
  agreedToTermsAt?: string;
  isVerified?: boolean;
  verifiedAt?: string;
}

export interface Transaction {
  id: string;
  type: 'transfer' | 'bonus' | 'gig_payment' | 'referral_bonus' | 'referral_fee' | 'listing_fee' | 'cancellation_fee' | 'verified_badge' | 'purchase';
  senderId: string;
  senderUsername: string;
  senderUserTag: string;
  recipientId: string;
  recipientUsername: string;
  recipientUserTag: string;
  amount: number;
  note: string;
  participants: string[];
  createdAt: unknown;
  fee?: number;
}

export interface Applicant {
  userId: string;
  username: string;
  userTag: string;
  appliedAt: number;
}

export interface Gig {
  id: string;
  posterId: string;
  posterUsername: string;
  posterUserTag: string;
  title: string;
  description: string;
  category: string;
  type: 'needed' | 'offered';
  coinReward: number;
  status: 'open' | 'requested' | 'accepted' | 'completed' | 'cancelled';
  applicants: Applicant[];
  acceptedApplicantId: string | null;
  acceptedApplicantUserTag: string | null;
  completedBy: string | null;
  completedByUsername: string | null;
  createdAt: unknown;
  completedAt: unknown;
  isPremium?: boolean;
  premiumExpiresAt?: string;
  listingFeePaid?: number;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  userTag: string;
  reputationScore: number;
  matchType?: 'exact' | 'partial';
}

export interface Purchase {
  id: string;
  userId: string;
  username: string;
  packageId: string;
  coins: number;
  amount: number;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: unknown;
}

export type TabType = 'home' | 'gigs' | 'profile' | 'admin';
export type ModalType = 'send' | 'receive' | 'gig' | 'pin' | 'premium' | 'buy' | null;