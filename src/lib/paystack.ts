// src/lib/paystack.ts

import { db, collection, addDoc, doc, updateDoc, increment, serverTimestamp } from './firebase';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number; // in Naira
  priceDisplay: string;
  badge: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { 
    id: 'p1', 
    name: 'Starter', 
    coins: 200, 
    price: 100, 
    priceDisplay: '₦100',
    badge: '✨'
  },
  { 
    id: 'p2', 
    name: 'Popular', 
    coins: 600, 
    price: 250, 
    priceDisplay: '₦250',
    badge: '🔥'
  },
  { 
    id: 'p3', 
    name: 'Pro', 
    coins: 1400, 
    price: 400, 
    priceDisplay: '₦400',
    badge: '💎'
  },
  { 
    id: 'p4', 
    name: 'Premium', 
    coins: 3000, 
    price: 700, 
    priceDisplay: '₦700',
    badge: '👑'
  },
  { 
    id: 'p5', 
    name: 'Mega', 
    coins: 8000, 
    price: 1500, 
    priceDisplay: '₦1,500',
    badge: '⭐'
  },
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
}: InitializePaymentParams) {
  // Load Paystack script if not already loaded
  if (!document.querySelector('script[src*="paystack"]')) {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.head.appendChild(script);
  }

  // Wait for Paystack to load
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
            callback(response);
          },
          onClose: () => {
            onClose();
          },
        });
        handler.openIframe();
      } catch (error) {
        console.error('Paystack error:', error);
        onClose();
      }
    } else {
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
) {
  try {
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

    await updateDoc(doc(db, 'users', userId), {
      balance: increment(coins),
      totalEarned: increment(coins),
    });

    return true;
  } catch (error) {
    console.error('Error recording purchase:', error);
    return false;
  }
}