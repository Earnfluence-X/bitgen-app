// src/lib/paystack.ts

import { db, collection, addDoc, doc, updateDoc, increment, serverTimestamp, getDoc } from './firebase';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  priceDisplay: string;
  badge: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'p1', name: 'Starter', coins: 200, price: 100, priceDisplay: '₦100', badge: '' },
  { id: 'p2', name: 'Popular', coins: 600, price: 250, priceDisplay: '₦250', badge: '★' },
  { id: 'p3', name: 'Pro', coins: 1400, price: 400, priceDisplay: '₦400', badge: '★★' },
  { id: 'p4', name: 'Premium', coins: 3000, price: 700, priceDisplay: '₦700', badge: '★★★' },
  { id: 'p5', name: 'Mega', coins: 8000, price: 1500, priceDisplay: '₦1,500', badge: '★' },
];

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function initializePaystackPayment({
  email,
  amount,
  metadata,
  callback,
  onClose,
}: {
  email: string;
  amount: number;
  metadata: {
    userId: string;
    username: string;
    packageId: string;
    coins: number;
  };
  callback: (response: any) => void;
  onClose: () => void;
}) {
  console.log('🔑 Starting Paystack payment...');
  console.log('💰 Amount:', amount);
  console.log('📧 Email:', email);

  if (!document.querySelector('script[src*="paystack"]')) {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.head.appendChild(script);
  }

  const checkPaystack = () => {
    if (window.PaystackPop) {
      try {
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: email,
          amount: amount,
          metadata: metadata,
          currency: 'NGN',
          ref: `BG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          callback: (response: any) => {
            console.log('✅ Paystack callback received:', response);
            callback(response);
          },
          onClose: () => {
            console.log('❌ Paystack modal closed by user');
            onClose();
          },
        });
        handler.openIframe();
      } catch (error) {
        console.error('❌ Paystack error:', error);
        onClose();
      }
    } else {
      console.log('⏳ Waiting for Paystack to load...');
      setTimeout(checkPaystack, 500);
    }
  };

  setTimeout(checkPaystack, 1000);
}

export async function recordPurchase(
  userId: string,
  username: string,
  packageId: string,
  coins: number,
  amount: number,
  reference: string
): Promise<boolean> {
  console.log('💰 Recording purchase...', { userId, username, packageId, coins, amount, reference });

  try {
    // 1. Check if user exists
    console.log('🔍 Checking user...');
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ User not found:', userId);
      return false;
    }
    console.log('✅ User found');

    // 2. Record the purchase
    console.log('📝 Recording purchase in Firestore...');
    await addDoc(collection(db, 'purchases'), {
      userId,
      username,
      packageId,
      coins,
      amount,
      reference,
      status: 'completed',
      createdAt: serverTimestamp(),
    });
    console.log('✅ Purchase recorded in Firestore');

    // 3. Add coins to user balance
    console.log(`💰 Adding ${coins} BG to user balance...`);
    await updateDoc(userRef, {
      balance: increment(coins),
      totalEarned: increment(coins),
    });
    console.log('✅ Coins added to balance');

    return true;
  } catch (error) {
    console.error('❌ Error recording purchase:', error);
    return false;
  }
}