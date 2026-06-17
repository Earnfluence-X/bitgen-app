import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  auth, db, isDemo,
  onAuthStateChanged, signOut as fbSignOut,
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs,
  serverTimestamp, increment, addDoc,
  writeBatch,
  listenToUserTransactions,
  listenToUserGigs,
  listenToActiveGigs,
  addTransaction,
  isEmailVerified,
  onSnapshot,
  limit
} from './firebase';
import type { UserProfile, Transaction, Gig, TabType, UserSearchResult, Applicant, ModalType } from '../types';
import { getTodayDateString, generateReferralCode, validateReferralCode, applyReferralBonus } from './utils';
import { 
  getCachedSearch, 
  setCachedSearch, 
  updateCache, 
  getCachedBalance,
  cacheUserData,
  getCachedUserData,
  cacheTransactions,
  getCachedTransactions,
  cacheGigs,
  getCachedGigs,
  clearUserCache,
  cacheLeaderboard,
  getCachedLeaderboard
} from './cache';

const MAX_TRANSACTION_AMOUNT = 500;
const SEND_COOLDOWN_MS = 3000;
const TRANSACTION_FEE = 2;
const GIG_LISTING_FEE = 2;
const PREMIUM_GIG_PRICE = 15;
const GIG_CANCELLATION_FEE = 5;
const VERIFIED_BADGE_COST = 50;

interface BitGenStore {
  firebaseUser: FirebaseUser | null;
  user: UserProfile | null;
  authLoading: boolean;
  balance: number;
  transactions: Transaction[];
  gigs: Gig[];
  activeTab: TabType;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';
  activeModal: ModalType;
  coinAnimating: boolean;
  searchResults: UserSearchResult[];
  searching: boolean;
  lastSendTime: number;
  transactionsLoading: boolean;
  hasMoreTransactions: boolean;
  lastTransactionDoc: any;

  initialize: () => () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  setActiveTab: (tab: TabType) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setCoinAnimating: (animating: boolean) => void;

  searchUsers: (query: string) => Promise<UserSearchResult[]>;
  sendToUsername: (recipientUserTag: string, amount: number, note: string, senderPin: string) => Promise<boolean>;
  setTransactionPin: (pin: string) => Promise<void>;
  verifyTransactionPin: (pin: string) => boolean;
  claimDailyBonus: () => Promise<boolean>;
  postGig: (title: string, description: string, category: string, type: 'needed' | 'offered', reward: number, isPremium?: boolean) => Promise<void>;
  requestGig: (gigId: string) => Promise<void>;
  acceptApplicant: (gigId: string, applicantUserTag: string) => Promise<void>;
  rejectApplicant: (gigId: string, applicantUserTag: string) => Promise<void>;
  getGigApplicants: (gigId: string) => Applicant[];
  completeGig: (gigId: string, workerId: string, amount: number) => Promise<void>;
  cancelGig: (gigId: string, reason?: string) => Promise<void>;
  purchaseVerifiedBadge: () => Promise<void>;
}

export const useStore = create<BitGenStore>((set, get) => {
  let unsubscribers: (() => void)[] = [];

  return {
    firebaseUser: null,
    user: null,
    authLoading: true,
    balance: 0,
    transactions: [],
    gigs: [],
    activeTab: 'home',
    toastMessage: null,
    toastType: 'success',
    activeModal: null,
    coinAnimating: false,
    searchResults: [],
    searching: false,
    lastSendTime: 0,
    transactionsLoading: false,
    hasMoreTransactions: true,
    lastTransactionDoc: null,

    initialize: () => {
      const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
        unsubscribers.forEach(unsub => unsub());
        unsubscribers = [];

        if (firebaseUser) {
          console.log('🔐 User logged in:', firebaseUser.uid);
          set({ firebaseUser, authLoading: false });

          // ✅ Check cache first
          const cachedUser = getCachedUserData(firebaseUser.uid);
          if (cachedUser) {
            console.log('📦 Using cached user data');
            set({
              user: { id: firebaseUser.uid, ...cachedUser },
              balance: cachedUser.balance || 0
            });
          }

          // ✅ Check cached transactions
          const cachedTx = getCachedTransactions(firebaseUser.uid);
          if (cachedTx) {
            console.log('📦 Using cached transactions:', cachedTx.length);
            set({ transactions: cachedTx });
          }

          // ✅ Check cached gigs
          const cachedGigs = getCachedGigs(firebaseUser.uid);
          if (cachedGigs) {
            console.log('📦 Using cached gigs:', cachedGigs.length);
            set((state) => ({
              gigs: [...state.gigs.filter(g => g.posterId !== firebaseUser.uid), ...cachedGigs]
            }));
          }

          const userUnsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data() as Omit<UserProfile, 'id'>;
              console.log('👤 User data updated:', userData.username);
              set({
                user: { id: firebaseUser.uid, ...userData },
                balance: userData.balance || 0
              });
              // ✅ Cache updated user data
              cacheUserData(firebaseUser.uid, userData);
              updateCache(userData.balance || 0, []);
              
              if (!userData.transactionPin) {
                set({ activeModal: 'pin' });
              }
            }
          });
          unsubscribers.push(userUnsub);

          const txUnsub = listenToUserTransactions(firebaseUser.uid, (transactions) => {
            console.log('📊 Transactions received:', transactions.length);
            set({ transactions });
            // ✅ Cache transactions
            cacheTransactions(firebaseUser.uid, transactions);
          });
          unsubscribers.push(txUnsub);

          const userGigsUnsub = listenToUserGigs(firebaseUser.uid, (userGigs) => {
            set((state) => ({
              gigs: [...state.gigs.filter(g => g.posterId !== firebaseUser.uid), ...userGigs]
            }));
            // ✅ Cache gigs
            cacheGigs(firebaseUser.uid, userGigs);
          });
          unsubscribers.push(userGigsUnsub);

          const activeGigsUnsub = listenToActiveGigs((activeGigs) => {
            set((state) => ({
              gigs: [...state.gigs.filter(g => g.posterId === firebaseUser.uid), ...activeGigs]
            }));
          });
          unsubscribers.push(activeGigsUnsub);

        } else {
          console.log('🔐 User logged out');
          // ✅ Clear cache on logout
          if (get().firebaseUser) {
            clearUserCache(get().firebaseUser!.uid);
          }
          set({
            firebaseUser: null,
            user: null,
            authLoading: false,
            balance: 0,
            transactions: [],
            gigs: []
          });
        }
      });

      return () => {
        authUnsub();
        unsubscribers.forEach(unsub => unsub());
        unsubscribers = [];
      };
    },

    refreshUser: async () => {
      const { firebaseUser } = get();
      if (!firebaseUser) return;
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<UserProfile, 'id'>;
        set({
          user: { id: firebaseUser.uid, ...userData },
          balance: userData.balance || 0
        });
        updateCache(userData.balance || 0, []);
        cacheUserData(firebaseUser.uid, userData);
      }
    },

    logout: async () => {
      unsubscribers.forEach(unsub => unsub());
      unsubscribers = [];
      if (get().firebaseUser) {
        clearUserCache(get().firebaseUser!.uid);
      }
      await fbSignOut(auth);
      set({
        firebaseUser: null,
        user: null,
        balance: 0,
        transactions: [],
        gigs: [],
        activeTab: 'home',
        activeModal: null
      });
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    openModal: (modal) => set({ activeModal: modal }),
    closeModal: () => set({ activeModal: null }),

    showToast: (message, type = 'success') => {
      set({ toastMessage: message, toastType: type });
      setTimeout(() => set({ toastMessage: null }), 3000);
    },

    hideToast: () => set({ toastMessage: null }),
    setCoinAnimating: (animating) => set({ coinAnimating: animating }),

    searchUsers: async (queryStr: string) => {
      if (!queryStr.trim() || queryStr.trim().length < 2) {
        set({ searchResults: [], searching: false });
        return [];
      }

      const cached = getCachedSearch(queryStr);
      if (cached) {
        set({ searchResults: cached, searching: false });
        return cached;
      }

      set({ searching: true });
      
      try {
        const usersRef = collection(db, 'users');
        const searchLower = queryStr.toLowerCase().replace(/^@/, '');
        
        const exactTagQuery = query(
          usersRef,
          where('userTag', '==', `@${searchLower}`),
          limit(3)
        );
        
        const prefixTagQuery = query(
          usersRef,
          where('userTag', '>=', `@${searchLower}`),
          where('userTag', '<=', `@${searchLower}\uf8ff`),
          limit(5)
        );
        
        const usernameQuery = query(
          usersRef,
          where('username', '>=', searchLower),
          where('username', '<=', searchLower + '\uf8ff'),
          limit(5)
        );
        
        const emailQuery = query(
          usersRef,
          where('email', '>=', searchLower),
          where('email', '<=', searchLower + '\uf8ff'),
          limit(5)
        );
        
        const [exactTag, prefixTag, username, email] = await Promise.all([
          getDocs(exactTagQuery),
          getDocs(prefixTagQuery),
          getDocs(usernameQuery),
          getDocs(emailQuery)
        ]);
        
        const combined = new Map();
        const currentUserId = get().firebaseUser?.uid;
        
        [...exactTag.docs, ...prefixTag.docs, ...username.docs, ...email.docs]
          .forEach(doc => {
            if (!combined.has(doc.id) && doc.id !== currentUserId) {
              const data = doc.data();
              combined.set(doc.id, {
                id: doc.id,
                username: data.username || 'Unknown',
                userTag: data.userTag || '@unknown',
                reputationScore: data.reputationScore || 5,
                matchType: data.userTag === `@${searchLower}` ? 'exact' : 'partial'
              });
            }
          });
        
        const results = Array.from(combined.values())
          .sort((a, b) => {
            if (a.matchType === 'exact' && b.matchType !== 'exact') return -1;
            if (b.matchType === 'exact' && a.matchType !== 'exact') return 1;
            return b.reputationScore - a.reputationScore;
          })
          .slice(0, 10);
        
        setCachedSearch(queryStr, results);
        set({ searchResults: results, searching: false });
        return results;
      } catch (error) {
        console.error('Search error:', error);
        set({ searching: false });
        return [];
      }
    },

    setTransactionPin: async (pin: string) => {
      const { firebaseUser } = get();
      if (!firebaseUser) throw new Error('Not authenticated');
      if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be 4 digits');
      
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        transactionPin: pin
      });
      
      get().showToast('Transaction PIN set successfully', 'success');
      set({ activeModal: null });
    },

    verifyTransactionPin: (pin: string) => {
      const { user } = get();
      return user?.transactionPin === pin;
    },

    sendToUsername: async (recipientUserTag: string, amount: number, note: string, senderPin: string) => {
      const { firebaseUser, user, lastSendTime } = get();
      if (!firebaseUser || !user) throw new Error('Not authenticated');
      if (isDemo) throw new Error('Demo mode - connect Firebase');
      
      const now = Date.now();
      if (now - lastSendTime < SEND_COOLDOWN_MS) {
        get().showToast(`Please wait ${Math.ceil((SEND_COOLDOWN_MS - (now - lastSendTime)) / 1000)} seconds between sends`, 'error');
        return false;
      }
      
      if (!user.transactionPin) {
        get().showToast('Please set a transaction PIN first', 'error');
        set({ activeModal: 'pin' });
        return false;
      }
      
      if (user.transactionPin !== senderPin) {
        get().showToast('Invalid transaction PIN', 'error');
        return false;
      }
      
      if (amount <= 0) throw new Error('Invalid amount');
      if (amount > MAX_TRANSACTION_AMOUNT) {
        get().showToast(`Maximum ${MAX_TRANSACTION_AMOUNT} BG per transaction`, 'error');
        return false;
      }
      
      const totalCost = amount + TRANSACTION_FEE;
      if (user.balance < totalCost) {
        get().showToast(`Insufficient balance. Need ${totalCost} BG (${amount} + ${TRANSACTION_FEE} fee)`, 'error');
        return false;
      }
      
      const usersRef = collection(db, 'users');
      
      const q = query(usersRef, where('userTag', '==', recipientUserTag.toLowerCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        get().showToast(`User ${recipientUserTag} not found`, 'error');
        return false;
      }
      
      const recipientDoc = snapshot.docs[0];
      const recipient = recipientDoc.data() as UserProfile;
      const recipientId = recipientDoc.id;
      
      if (recipientId === firebaseUser.uid) {
        get().showToast('Cannot send to yourself', 'error');
        return false;
      }
      
      const adminQuery = query(usersRef, where('userTag', '==', '@admin'));
      const adminSnapshot = await getDocs(adminQuery);
      let adminId = null;
      if (!adminSnapshot.empty) {
        adminId = adminSnapshot.docs[0].id;
      }
      
      set({ lastSendTime: now });
      
      const batch = writeBatch(db);
      
      batch.update(doc(db, 'users', firebaseUser.uid), {
        balance: increment(-totalCost),
        totalSpent: increment(amount),
      });
      
      batch.update(doc(db, 'users', recipientId), {
        balance: increment(amount),
        totalEarned: increment(amount),
      });
      
      if (adminId) {
        batch.update(doc(db, 'users', adminId), {
          balance: increment(TRANSACTION_FEE),
          totalEarned: increment(TRANSACTION_FEE),
        });
      }
      
      await batch.commit();
      
      await addTransaction({
        type: 'transfer',
        senderId: firebaseUser.uid,
        senderUsername: user.username,
        senderUserTag: user.userTag,
        recipientId: recipientId,
        recipientUsername: recipient.username,
        recipientUserTag: recipient.userTag,
        amount: amount,
        note: note || 'Transfer',
        fee: TRANSACTION_FEE,
      });
      
      await addDoc(collection(db, 'feeTransactions'), {
        type: 'fee',
        senderId: firebaseUser.uid,
        senderUsername: user.username,
        senderUserTag: user.userTag,
        recipientId: adminId || 'system',
        recipientUsername: 'BitGen Admin',
        recipientUserTag: '@admin',
        amount: TRANSACTION_FEE,
        note: `Transaction fee for sending ${amount} BG`,
        createdAt: serverTimestamp(),
      });
      
      get().showToast(`Sent ${amount} BG to ${recipient.userTag} (${TRANSACTION_FEE} BG fee applied)`, 'success');
      return true;
    },

    claimDailyBonus: async () => {
      const { firebaseUser, user } = get();
      if (!firebaseUser || !user) return false;
      if (isDemo) {
        get().showToast('Demo mode - connect Firebase for bonuses', 'info');
        return false;
      }

      const today = getTodayDateString();
      if (user.lastBonusDate === today) {
        get().showToast('Already claimed today', 'info');
        return false;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const newStreak = user.lastLoginDate === yesterdayStr ? (user.loginStreak || 0) + 1 : 1;
      const bonusAmount = Math.min(5 + (newStreak - 1) * 2, 25);

      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        balance: increment(bonusAmount),
        totalEarned: increment(bonusAmount),
        loginStreak: newStreak,
        lastLoginDate: today,
        lastBonusDate: today,
      });

      await addTransaction({
        type: 'bonus',
        senderId: 'system',
        senderUsername: 'BitGen',
        senderUserTag: '@bitgen',
        recipientId: firebaseUser.uid,
        recipientUsername: user.username,
        recipientUserTag: user.userTag,
        amount: bonusAmount,
        note: `Day ${newStreak} streak bonus`,
      });

      get().showToast(`+${bonusAmount} BG daily bonus! Streak: ${newStreak}`, 'success');
      return true;
    },

    postGig: async (title, description, category, type, reward, isPremium = false) => {
      const { firebaseUser, user } = get();
      if (!firebaseUser || !user) throw new Error('Not authenticated');
      if (isDemo) throw new Error('Demo mode - connect Firebase');

      const totalCost = GIG_LISTING_FEE + (isPremium ? PREMIUM_GIG_PRICE : 0);
      
      if (user.balance < totalCost) {
        throw new Error(`Insufficient balance. Need ${totalCost} BG (${GIG_LISTING_FEE} listing fee${isPremium ? ` + ${PREMIUM_GIG_PRICE} premium` : ''})`);
      }

      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('userTag', '==', '@admin'));
      const adminSnapshot = await getDocs(adminQuery);
      let adminId = null;
      if (!adminSnapshot.empty) {
        adminId = adminSnapshot.docs[0].id;
      }

      const batch = writeBatch(db);

      batch.update(doc(db, 'users', firebaseUser.uid), {
        balance: increment(-totalCost),
      });

      if (adminId) {
        const feeAmount = GIG_LISTING_FEE + (isPremium ? PREMIUM_GIG_PRICE : 0);
        batch.update(doc(db, 'users', adminId), {
          balance: increment(feeAmount),
          totalEarned: increment(feeAmount),
        });
      }

      await batch.commit();

      await addDoc(collection(db, 'gigs'), {
        posterId: firebaseUser.uid,
        posterUsername: user.username,
        posterUserTag: user.userTag,
        title,
        description,
        category,
        type,
        coinReward: reward,
        status: 'open',
        applicants: [],
        acceptedApplicantId: null,
        acceptedApplicantUserTag: null,
        completedBy: null,
        completedByUsername: null,
        isPremium: isPremium,
        premiumExpiresAt: isPremium ? new Date(Date.now() + 86400000).toISOString() : null,
        listingFeePaid: totalCost,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        gigsPosted: increment(1),
      });

      await addDoc(collection(db, 'feeTransactions'), {
        type: 'listing_fee',
        senderId: firebaseUser.uid,
        senderUsername: user.username,
        senderUserTag: user.userTag,
        recipientId: adminId || 'system',
        recipientUsername: 'BitGen Admin',
        recipientUserTag: '@admin',
        amount: GIG_LISTING_FEE,
        note: `Listing fee for gig: ${title}`,
        createdAt: serverTimestamp(),
      });

      if (isPremium) {
        await addDoc(collection(db, 'feeTransactions'), {
          type: 'premium_fee',
          senderId: firebaseUser.uid,
          senderUsername: user.username,
          senderUserTag: user.userTag,
          recipientId: adminId || 'system',
          recipientUsername: 'BitGen Admin',
          recipientUserTag: '@admin',
          amount: PREMIUM_GIG_PRICE,
          note: `Premium listing for gig: ${title}`,
          createdAt: serverTimestamp(),
        });
      }

      get().showToast(`Gig posted! (${totalCost} BG in fees applied)`, 'success');
    },

    requestGig: async (gigId: string) => {
      const { firebaseUser, user } = get();
      if (!firebaseUser || !user) throw new Error('Not authenticated');
      if (isDemo) throw new Error('Demo mode');

      const gigRef = doc(db, 'gigs', gigId);
      const gigDoc = await getDoc(gigRef);
      if (!gigDoc.exists()) return;
      const gigData = gigDoc.data() as Gig;

      if (gigData.posterId === firebaseUser.uid) {
        get().showToast('Cannot request your own gig', 'error');
        return;
      }

      if (gigData.status !== 'open') {
        get().showToast('This gig is no longer available', 'error');
        return;
      }

      const alreadyApplied = gigData.applicants?.some(a => a.userId === firebaseUser.uid);
      if (alreadyApplied) {
        get().showToast('You already requested this gig', 'info');
        return;
      }

      const newApplicant: Applicant = {
        userId: firebaseUser.uid,
        username: user.username,
        userTag: user.userTag,
        appliedAt: Date.now(),
      };

      const currentApplicants = gigData.applicants || [];
      
      await updateDoc(gigRef, {
        applicants: [...currentApplicants, newApplicant],
        status: 'requested',
      });

      get().showToast(`Request sent to ${gigData.posterUsername}!`, 'success');
    },

    acceptApplicant: async (gigId: string, applicantUserTag: string) => {
      const { firebaseUser, user } = get();
      if (!firebaseUser || !user) throw new Error('Not authenticated');

      const gigRef = doc(db, 'gigs', gigId);
      const gigDoc = await getDoc(gigRef);
      if (!gigDoc.exists()) return;
      const gigData = gigDoc.data() as Gig;

      if (gigData.posterId !== firebaseUser.uid) {
        get().showToast('Only the poster can accept applicants', 'error');
        return;
      }

      const applicant = gigData.applicants?.find(a => a.userTag === applicantUserTag);
      if (!applicant) {
        get().showToast('Applicant not found', 'error');
        return;
      }

      await updateDoc(gigRef, {
        acceptedApplicantId: applicant.userId,
        acceptedApplicantUserTag: applicant.userTag,
        status: 'accepted',
      });

      get().showToast(`Accepted ${applicant.userTag}! Send payment to complete the gig.`, 'success');
      
      sessionStorage.setItem('pendingPaymentGig', JSON.stringify({
        gigId: gigId,
        workerId: applicant.userId,
        workerUsername: applicant.username,
        workerUserTag: applicant.userTag,
        amount: gigData.coinReward,
        title: gigData.title,
      }));
      
      set({ activeModal: 'send' });
    },

    rejectApplicant: async (gigId: string, applicantUserTag: string) => {
      const { firebaseUser } = get();
      if (!firebaseUser) throw new Error('Not authenticated');

      const gigRef = doc(db, 'gigs', gigId);
      const gigDoc = await getDoc(gigRef);
      if (!gigDoc.exists()) return;
      const gigData = gigDoc.data() as Gig;

      if (gigData.posterId !== firebaseUser.uid) {
        get().showToast('Only the poster can reject applicants', 'error');
        return;
      }

      const updatedApplicants = gigData.applicants?.filter(a => a.userTag !== applicantUserTag) || [];

      await updateDoc(gigRef, {
        applicants: updatedApplicants,
        status: updatedApplicants.length === 0 ? 'open' : 'requested',
      });

      get().showToast(`Rejected ${applicantUserTag}`, 'success');
    },

    getGigApplicants: (gigId: string) => {
      const { gigs } = get();
      const gig = gigs.find(g => g.id === gigId);
      return gig?.applicants || [];
    },

    completeGig: async (gigId: string, workerId: string, amount: number) => {
      const { firebaseUser, user } = get();
      if (!firebaseUser || !user) throw new Error('Not authenticated');

      const gigRef = doc(db, 'gigs', gigId);
      
      await updateDoc(gigRef, {
        status: 'completed',
        completedBy: workerId,
        completedByUsername: null,
        completedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', workerId), {
        gigsCompleted: increment(1),
        reputationScore: increment(0.1),
        reputationCount: increment(1),
      });

      get().showToast('Gig completed!', 'success');
    },

    cancelGig: async (gigId: string, reason?: string) => {
      const { firebaseUser, user } = get();
      if (!firebaseUser || !user) throw new Error('Not authenticated');

      const gigRef = doc(db, 'gigs', gigId);
      const gigDoc = await getDoc(gigRef);
      if (!gigDoc.exists()) return;
      const gigData = gigDoc.data() as Gig;

      if (gigData.posterId !== firebaseUser.uid && 
          gigData.acceptedApplicantId !== firebaseUser.uid) {
        get().showToast('You are not part of this gig', 'error');
        return;
      }

      if (gigData.status !== 'accepted') {
        get().showToast('Only accepted gigs can be cancelled', 'error');
        return;
      }

      if (user.balance < GIG_CANCELLATION_FEE) {
        get().showToast(`Insufficient balance. Need ${GIG_CANCELLATION_FEE} BG to cancel`, 'error');
        return;
      }

      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('userTag', '==', '@admin'));
      const adminSnapshot = await getDocs(adminQuery);
      let adminId = null;
      if (!adminSnapshot.empty) {
        adminId = adminSnapshot.docs[0].id;
      }

      const batch = writeBatch(db);

      batch.update(doc(db, 'users', firebaseUser.uid), {
        balance: increment(-GIG_CANCELLATION_FEE),
      });

      if (adminId) {
        batch.update(doc(db, 'users', adminId), {
          balance: increment(GIG_CANCELLATION_FEE),
          totalEarned: increment(GIG_CANCELLATION_FEE),
        });
      }

      await batch.commit();

      await updateDoc(gigRef, {
        status: 'open',
        acceptedApplicantId: null,
        acceptedApplicantUserTag: null,
        cancelledBy: firebaseUser.uid,
        cancelledAt: serverTimestamp(),
        cancellationReason: reason || 'No reason provided',
      });

      await addDoc(collection(db, 'feeTransactions'), {
        type: 'cancellation_fee',
        senderId: firebaseUser.uid,
        senderUsername: user.username,
        senderUserTag: user.userTag,
        recipientId: adminId || 'system',
        recipientUsername: 'BitGen Admin',
        recipientUserTag: '@admin',
        amount: GIG_CANCELLATION_FEE,
        note: `Cancellation fee for gig: ${gigData.title}`,
        createdAt: serverTimestamp(),
      });

      get().showToast(`Gig cancelled (${GIG_CANCELLATION_FEE} BG fee applied)`, 'success');
    },

    purchaseVerifiedBadge: async () => {
      const { firebaseUser, user } = get();
      if (!firebaseUser || !user) throw new Error('Not authenticated');

      if (user.isVerified) {
        get().showToast('You already have a verified badge', 'info');
        return;
      }

      if (user.balance < VERIFIED_BADGE_COST) {
        get().showToast(`Insufficient balance. Need ${VERIFIED_BADGE_COST} BG`, 'error');
        return;
      }

      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('userTag', '==', '@admin'));
      const adminSnapshot = await getDocs(adminQuery);
      let adminId = null;
      if (!adminSnapshot.empty) {
        adminId = adminSnapshot.docs[0].id;
      }

      const batch = writeBatch(db);

      batch.update(doc(db, 'users', firebaseUser.uid), {
        balance: increment(-VERIFIED_BADGE_COST),
        isVerified: true,
        verifiedAt: new Date().toISOString(),
      });

      if (adminId) {
        batch.update(doc(db, 'users', adminId), {
          balance: increment(VERIFIED_BADGE_COST),
          totalEarned: increment(VERIFIED_BADGE_COST),
        });
      }

      await batch.commit();

      await addDoc(collection(db, 'feeTransactions'), {
        type: 'verified_badge',
        senderId: firebaseUser.uid,
        senderUsername: user.username,
        senderUserTag: user.userTag,
        recipientId: adminId || 'system',
        recipientUsername: 'BitGen Admin',
        recipientUserTag: '@admin',
        amount: VERIFIED_BADGE_COST,
        note: 'Verified badge purchase',
        createdAt: serverTimestamp(),
      });

      await get().refreshUser();
      
      get().showToast('🎖️ You are now verified!', 'success');
    },
  };
});