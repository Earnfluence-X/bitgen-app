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
  isVerified?: boolean;        // ✅ ADDED - Verified badge
  verifiedAt?: string;         // ✅ ADDED - When verified
}

export interface Transaction {
  id: string;
  type: 'transfer' | 'bonus' | 'gig_payment' | 'referral_bonus' | 'referral_fee' | 'listing_fee' | 'cancellation_fee' | 'verified_badge';
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
  isPremium?: boolean;         // ✅ ADDED - Premium gig flag
  premiumExpiresAt?: string;   // ✅ ADDED - Premium expiration
  listingFeePaid?: number;     // ✅ ADDED - Fee paid
  cancelledBy?: string;        // ✅ ADDED - Who cancelled
  cancelledAt?: string;        // ✅ ADDED - When cancelled
  cancellationReason?: string; // ✅ ADDED - Why cancelled
}

export interface UserSearchResult {
  id: string;
  username: string;
  userTag: string;
  reputationScore: number;
  matchType?: 'exact' | 'partial';
}

export type TabType = 'home' | 'gigs' | 'profile' | 'admin';
export type ModalType = 'send' | 'receive' | 'gig' | 'pin' | 'premium' | null;