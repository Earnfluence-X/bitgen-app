import { 
  db, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  updateDoc, 
  doc, 
  increment, 
  serverTimestamp, 
  orderBy, 
  limit, 
  addDoc, 
  getCountFromServer,
  deleteDoc,
  writeBatch
} from './firebase';
import { auth } from './firebase';
import type { AdminStats, AdminUser, AdminReport, AdminLog, FeeTransaction } from '../types/admin';

// ===== CONFIGURATION =====
// Add admin emails here - these users will have admin access
const ADMIN_EMAILS = ['earnfluencex@gmail.com'];

// ===== AUTHENTICATION =====
export async function isUserAdmin(userId: string, email: string): Promise<boolean> {
  if (ADMIN_EMAILS.includes(email)) return true;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().isAdmin === true;
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
  return false;
}

// ===== FEE TRACKING =====
export async function getTotalFeesCollected(): Promise<number> {
  try {
    const feeRef = collection(db, 'feeTransactions');
    const snapshot = await getDocs(feeRef);
    return snapshot.docs.reduce((sum: number, doc) => sum + (doc.data().amount || 0), 0);
  } catch (error) {
    console.error('Error getting fees:', error);
    return 0;
  }
}

export async function getFeeTransactions(limitCount: number = 50): Promise<FeeTransaction[]> {
  try {
    const feeRef = collection(db, 'feeTransactions');
    const q = query(feeRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as FeeTransaction[];
  } catch (error) {
    console.error('Error getting fee transactions:', error);
    return [];
  }
}

// ===== STATISTICS =====
export async function getAdminStats(): Promise<AdminStats> {
  const usersRef = collection(db, 'users');
  const transactionsRef = collection(db, 'transactions');
  const gigsRef = collection(db, 'gigs');
  const reportsRef = collection(db, 'reports');
  const feeRef = collection(db, 'feeTransactions');

  const [usersSnapshot, transactionsSnapshot, gigsSnapshot, reportsSnapshot, feeSnapshot] = await Promise.all([
    getDocs(usersRef),
    getDocs(transactionsRef),
    getDocs(gigsRef),
    getDocs(reportsRef),
    getDocs(feeRef)
  ]);

  const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const totalUsers = users.length;
  const totalCoinsInCirculation = users.reduce((sum: number, u: any) => sum + (u.balance || 0), 0);
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const activeToday = users.filter((u: any) => u.lastActiveDate && new Date(u.lastActiveDate) > yesterday);
  
  const totalTransactions = transactionsSnapshot.size;
  const totalCoinsEarned = transactionsSnapshot.docs
    .filter(d => d.data().type === 'bonus' || d.data().type === 'transfer' || d.data().type === 'referral_bonus')
    .reduce((sum: number, d) => sum + (d.data().amount || 0), 0);
  
  const totalGigs = gigsSnapshot.size;
  const openGigs = gigsSnapshot.docs.filter(d => d.data().status === 'open').length;
  const completedGigs = gigsSnapshot.docs.filter(d => d.data().status === 'completed').length;
  
  const totalReports = reportsSnapshot.size;
  const pendingReports = reportsSnapshot.docs.filter(d => d.data().status === 'pending').length;
  const resolvedReports = reportsSnapshot.docs.filter(d => d.data().status === 'resolved').length;
  
  const avgReputation = users.reduce((sum: number, u: any) => sum + (u.reputationScore || 5), 0) / totalUsers || 0;

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const activeThisWeek = users.filter((u: any) => u.lastActiveDate && new Date(u.lastActiveDate) > weekAgo);

  // ✅ Calculate total fees collected
  const totalFeesCollected = feeSnapshot.docs.reduce((sum: number, doc) => sum + (doc.data().amount || 0), 0);

  return {
    totalUsers,
    totalTransactions,
    totalCoinsInCirculation,
    activeUsersToday: activeToday.length,
    activeUsersThisWeek: activeThisWeek.length,
    totalGigs,
    openGigs,
    completedGigs,
    totalReports,
    pendingReports,
    resolvedReports,
    avgReputation: Math.round(avgReputation * 10) / 10,
    totalCoinsEarned,
    totalCoinsSpent: totalCoinsEarned - totalCoinsInCirculation,
    totalFeesCollected, // ✅ Added
  };
}

// ===== USER MANAGEMENT =====
export async function getAdminUsers(options?: { limit?: number; offset?: number; search?: string }): Promise<AdminUser[]> {
  const usersRef = collection(db, 'users');
  let q = query(usersRef, orderBy('createdAt', 'desc'));
  
  if (options?.limit) {
    q = query(q, limit(options.limit));
  }
  
  const snapshot = await getDocs(q);
  const users = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const reportsQuery = query(
      collection(db, 'reports'),
      where('targetId', '==', doc.id),
      where('status', '==', 'pending')
    );
    const reportsSnapshot = await getDocs(reportsQuery);
    
    return {
      id: doc.id,
      username: data.username || 'unknown',
      userTag: data.userTag || '@unknown',
      email: data.email || '',
      balance: data.balance || 0,
      gigsPosted: data.gigsPosted || 0,
      gigsCompleted: data.gigsCompleted || 0,
      reputationScore: data.reputationScore || 5,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      lastActive: data.lastActiveDate?.toDate?.()?.toISOString() || new Date().toISOString(),
      isSuspended: data.isSuspended || false,
      isAdmin: data.isAdmin || false,
      reports: reportsSnapshot.size,
    };
  }));
  
  return users;
}

export async function suspendUser(userId: string, reason?: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    isSuspended: true,
    suspendedAt: serverTimestamp(),
    suspensionReason: reason || 'Violation of community guidelines',
  });
  
  await addAdminLog({
    action: 'suspend_user',
    userId,
    details: `Suspended user. Reason: ${reason || 'Violation of community guidelines'}`,
  });
}

export async function unsuspendUser(userId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    isSuspended: false,
    suspendedAt: null,
    suspensionReason: null,
  });
  
  await addAdminLog({
    action: 'unsuspend_user',
    userId,
    details: 'User unsuspended',
  });
}

export async function makeAdmin(userId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    isAdmin: true,
  });
  
  await addAdminLog({
    action: 'make_admin',
    userId,
    details: 'User granted admin privileges',
  });
}

export async function removeAdmin(userId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    isAdmin: false,
  });
  
  await addAdminLog({
    action: 'remove_admin',
    userId,
    details: 'Admin privileges revoked',
  });
}

// ===== REPORT MANAGEMENT =====
export async function getAdminReports(status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed'): Promise<AdminReport[]> {
  const reportsRef = collection(db, 'reports');
  let q = query(reportsRef, orderBy('createdAt', 'desc'));
  
  if (status) {
    q = query(q, where('status', '==', status));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    resolvedAt: doc.data().resolvedAt?.toDate?.()?.toISOString() || null,
  })) as AdminReport[];
}

export async function resolveReport(
  reportId: string, 
  resolution: 'warn' | 'suspend' | 'dismiss', 
  note: string,
  adminId?: string
): Promise<void> {
  const reportRef = doc(db, 'reports', reportId);
  const reportDoc = await getDoc(reportRef);
  
  if (!reportDoc.exists()) {
    throw new Error('Report not found');
  }
  
  const reportData = reportDoc.data();
  
  await updateDoc(reportRef, {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
    resolvedBy: adminId || null,
    resolution: resolution,
    resolutionNote: note,
  });
  
  if (resolution === 'suspend' && reportData) {
    await suspendUser(reportData.targetId, note);
  }
  
  if (resolution === 'warn' && reportData) {
    await addAdminLog({
      action: 'warn_user',
      userId: reportData.targetId,
      details: `Warning issued. Reason: ${note}`,
    });
  }
  
  await addAdminLog({
    action: 'resolve_report',
    userId: reportData.targetId,
    details: `Report ${reportId} resolved with ${resolution}. Note: ${note}`,
  });
}

export async function createReport(data: {
  reporterId: string;
  reporterUsername: string;
  targetId: string;
  targetUsername: string;
  targetType: 'user' | 'gig' | 'transaction';
  reason: string;
  description: string;
}): Promise<string> {
  const reportRef = await addDoc(collection(db, 'reports'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
    resolvedAt: null,
    resolvedBy: null,
    resolution: null,
    resolutionNote: null,
  });
  
  return reportRef.id;
}

// ===== GIG MANAGEMENT =====
export async function deleteGig(gigId: string, reason?: string): Promise<void> {
  const gigRef = doc(db, 'gigs', gigId);
  const gigDoc = await getDoc(gigRef);
  
  if (!gigDoc.exists()) {
    throw new Error('Gig not found');
  }
  
  const gigData = gigDoc.data();
  
  await deleteDoc(gigRef);
  
  await addAdminLog({
    action: 'delete_gig',
    userId: gigData.posterId || 'unknown',
    details: `Gig ${gigId} deleted. Reason: ${reason || 'Violation of guidelines'}`,
  });
}

export async function getAdminGigs(options?: { limit?: number; status?: string }): Promise<any[]> {
  const gigsRef = collection(db, 'gigs');
  let q = query(gigsRef, orderBy('createdAt', 'desc'));
  
  if (options?.status) {
    q = query(q, where('status', '==', options.status));
  }
  
  if (options?.limit) {
    q = query(q, limit(options.limit));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }));
}

// ===== ADMIN LOGS =====
export async function addAdminLog(data: Omit<AdminLog, 'id' | 'timestamp'>): Promise<void> {
  await addDoc(collection(db, 'adminLogs'), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

export async function getAdminLogs(options?: { limit?: number }): Promise<AdminLog[]> {
  const logsRef = collection(db, 'adminLogs');
  let q = query(logsRef, orderBy('timestamp', 'desc'));
  
  if (options?.limit) {
    q = query(q, limit(options.limit));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
  })) as AdminLog[];
}

// ===== BULK ACTIONS =====
export async function deleteUserData(userId: string): Promise<void> {
  const batch = writeBatch(db);
  
  batch.delete(doc(db, 'users', userId));
  
  const txQuery = query(
    collection(db, 'transactions'),
    where('participants', 'array-contains', userId)
  );
  const txSnapshot = await getDocs(txQuery);
  txSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  const gigsQuery = query(
    collection(db, 'gigs'),
    where('posterId', '==', userId)
  );
  const gigsSnapshot = await getDocs(gigsQuery);
  gigsSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  const reportsQuery1 = query(
    collection(db, 'reports'),
    where('reporterId', '==', userId)
  );
  const reportsQuery2 = query(
    collection(db, 'reports'),
    where('targetId', '==', userId)
  );
  const [reports1, reports2] = await Promise.all([
    getDocs(reportsQuery1),
    getDocs(reportsQuery2)
  ]);
  [...reports1.docs, ...reports2.docs].forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  
  await addAdminLog({
    action: 'delete_user',
    userId,
    details: 'User account and all associated data deleted',
  });
}