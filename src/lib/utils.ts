import { db, collection, query, where, getDocs, updateDoc, doc, increment, addDoc } from './firebase';
import { addTransaction } from './firebase';

export function generatePin(): string {
  const chars = '0123456789';
  let pin = '';
  for (let i = 0; i < 6; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

export function formatTimeAgo(timestamp: unknown): string {
  if (!timestamp) return 'just now';

  let date: Date;
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    date = (timestamp as { toDate: () => Date }).toDate();
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'just now';
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getInitials(username: string): string {
  if (!username) return '?';
  return username.charAt(0).toUpperCase();
}

export function truncateAddress(address: string, chars = 6): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Generate unique userTag (handles duplicates by adding numbers)
export async function generateUniqueUserTag(baseUsername: string): Promise<string> {
  const cleanBase = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  let userTag = `@${cleanBase}`;
  let counter = 1;
  
  try {
    const usersRef = collection(db, 'users');
    let existing = await getDocs(query(usersRef, where('userTag', '==', userTag)));
    
    while (!existing.empty) {
      userTag = `@${cleanBase}${counter}`;
      existing = await getDocs(query(usersRef, where('userTag', '==', userTag)));
      counter++;
      if (counter > 100) break;
    }
  } catch (error) {
    console.error('Error checking userTag uniqueness:', error);
  }
  
  return userTag;
}

// Generate referral code from user ID and username
export function generateReferralCode(userId: string, username: string): string {
  const shortId = userId.slice(-6).toUpperCase();
  const shortName = username.slice(0, 3).toUpperCase();
  return `${shortName}${shortId}`;
}

// Validate referral code format
export function validateReferralCode(code: string): boolean {
  return /^[A-Z0-9]{6,10}$/.test(code);
}

// Apply referral bonus when new user signs up with a code
export async function applyReferralBonus(newUserId: string, referralCode: string): Promise<boolean> {
  try {
    console.log('🔍 Applying referral bonus for code:', referralCode);
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    let referrerId: string | null = null;
    let referrerData: any = null;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const generatedCode = generateReferralCode(doc.id, data.username);
      if (generatedCode === referralCode) {
        referrerId = doc.id;
        referrerData = data;
        break;
      }
    }
    
    if (!referrerId || referrerId === newUserId) {
      console.log('❌ Invalid referral code:', referralCode);
      return false;
    }
    
    console.log('✅ Referrer found:', referrerData.username);
    
    const BONUS_AMOUNT = 25;
    
    await updateDoc(doc(db, 'users', referrerId), {
      balance: increment(BONUS_AMOUNT),
      totalEarned: increment(BONUS_AMOUNT),
    });
    
    await updateDoc(doc(db, 'users', newUserId), {
      balance: increment(BONUS_AMOUNT),
      totalEarned: increment(BONUS_AMOUNT),
    });
    
    await addTransaction({
      type: 'referral_bonus',
      senderId: 'system',
      senderUsername: 'BitGen',
      senderUserTag: '@bitgen',
      recipientId: referrerId,
      recipientUsername: referrerData.username,
      recipientUserTag: referrerData.userTag,
      amount: BONUS_AMOUNT,
      note: `Referral bonus for inviting new user`,
    });
    
    await addTransaction({
      type: 'referral_bonus',
      senderId: 'system',
      senderUsername: 'BitGen',
      senderUserTag: '@bitgen',
      recipientId: newUserId,
      recipientUsername: 'New User',
      recipientUserTag: '@newuser',
      amount: BONUS_AMOUNT,
      note: `Referral bonus for signing up with code`,
    });
    
    console.log('✅ Referral bonus applied successfully!');
    return true;
  } catch (error) {
    console.error('Error applying referral bonus:', error);
    return false;
  }
}