// src/lib/paystack.ts

import { db, collection, addDoc, doc, updateDoc, increment, serverTimestamp } from './firebase';
import { auth } from './firebase';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number; // in Naira
  priceDisplay: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'p1', name: 'Starter', coins: 100, price: 100, priceDisplay: '₦100' },
  { id: 'p2', name: 'Popular', coins: 300, price: 250, priceDisplay: '₦250' },
  { id: 'p3', name: 'Pro', coins: 600, price: 400, priceDisplay: '₦400' },
  { id: 'p4', name: 'Premium', coins: 1200, price: 700, priceDisplay: '₦700' },
  { id: 'p5', name: 'Mega', coins: 3000, price: 1500, priceDisplay: '₦1,500' },
];

interface InitializePaymentParams {
  email: string;
  amount: number; // in kobo (multiply by 100)
  metadata: {
    userId: string;
    username: string;
    packageId: string;
    coins: number;
  };
  callback: (response: any) => void;
  onClose: () => void;
}

export function initializePaystackPayment({
  email,
  amount,
  metadata,
  callback,
  onClose,
}: InitializePaymentParams) {
  // Load Paystack script if not already loaded
  if (!document.querySelector('script[src*="paystack"]')) {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    document.head.appendChild(script);
  }

  // Wait for Paystack to load
  const checkPaystack = () => {
    // @ts-ignore
    if (window.PaystackPop) {
      // @ts-ignore
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amount, // in kobo
        metadata: metadata,
        currency: 'NGN',
        ref: `BG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        callback: (response: any) => {
          callback(response);
        },
        onClose: () => {
          onClose();
        },
      });
      handler.openIframe();
    } else {
      setTimeout(checkPaystack, 300);
    }
  };

  checkPaystack();
}

export async function recordPurchase(
  userId: string,
  username: string,
  packageId: string,
  coins: number,
  amount: number,
  reference: string
) {
  try {
    // Record purchase
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

    // Add coins to user balance
    await updateDoc(doc(db, 'users', userId), {
      balance: increment(coins),
      totalEarned: increment(coins),
    });

    // Track fee for admin
    await addDoc(collection(db, 'feeTransactions'), {
      type: 'purchase',
      senderId: userId,
      senderUsername: username,
      senderUserTag: `@${username}`,
      recipientId: 'system',
      recipientUsername: 'BitGen',
      recipientUserTag: '@bitgen',
      amount: coins,
      note: `Purchased ${coins} BG coins`,
      createdAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error recording purchase:', error);
    return false;
  }
}