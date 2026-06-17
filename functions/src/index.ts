// functions/src/index.ts

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// ============================================
// RATE LIMITING CONFIG
// ============================================
const RATE_LIMITS = {
  SEND_COINS: { limit: 10, window: 60000 },     // 10 per minute
  POST_GIG: { limit: 5, window: 60000 },         // 5 per minute
  SEARCH: { limit: 20, window: 60000 },          // 20 per minute
  REQUEST_GIG: { limit: 10, window: 60000 },     // 10 per minute
};

// ============================================
// CHECK RATE LIMIT HELPER
// ============================================
async function checkRateLimit(userId: string, action: string): Promise<boolean> {
  const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
  if (!config) return true;

  const now = Date.now();
  const windowStart = now - config.window;

  const docRef = admin.firestore().doc(`rateLimits/${userId}_${action}`);
  const doc = await docRef.get();
  
  const data = doc.exists ? doc.data() : { timestamps: [] };
  const timestamps = data?.timestamps || [];
  
  const recentTimestamps = timestamps.filter((t: number) => t > windowStart);
  
  if (recentTimestamps.length >= config.limit) {
    return false;
  }
  
  recentTimestamps.push(now);
  await docRef.set({ timestamps: recentTimestamps });
  
  return true;
}

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
export const healthCheck = functions.https.onCall(async (data, context) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
});

// ============================================
// SEND COINS WITH RATE LIMITING
// ============================================
export const sendCoinsWithRateLimit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in');
  }

  const userId = context.auth.uid;

  const allowed = await checkRateLimit(userId, 'SEND_COINS');
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many send requests. Please wait a moment and try again.'
    );
  }

  // Data validation
  const { recipientUserTag, amount, senderPin } = data;
  
  if (!recipientUserTag || !amount || !senderPin) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  if (amount <= 0 || amount > 500) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
  }

  return {
    success: true,
    message: `Sent ${amount} BG to ${recipientUserTag}`,
  };
});

// ============================================
// POST GIG WITH RATE LIMITING
// ============================================
export const postGigWithRateLimit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in');
  }

  const userId = context.auth.uid;

  const allowed = await checkRateLimit(userId, 'POST_GIG');
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many gigs posted. Please wait a moment.'
    );
  }

  const { title, reward } = data;
  
  if (!title || title.length < 3) {
    throw new functions.https.HttpsError('invalid-argument', 'Title must be at least 3 characters');
  }
  
  if (reward <= 0 || reward > 1000) {
    throw new functions.https.HttpsError('invalid-argument', 'Reward must be between 1 and 1000');
  }

  return {
    success: true,
    message: 'Gig posted successfully',
  };
});

// ============================================
// REQUEST GIG WITH RATE LIMITING
// ============================================
export const requestGigWithRateLimit = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in');
  }

  const userId = context.auth.uid;

  const allowed = await checkRateLimit(userId, 'REQUEST_GIG');
  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many gig requests. Please wait a moment.'
    );
  }

  const { gigId } = data;
  
  if (!gigId) {
    throw new functions.https.HttpsError('invalid-argument', 'Gig ID is required');
  }

  return {
    success: true,
    message: 'Gig requested successfully',
  };
});

// ============================================
// CLEANUP RATE LIMITS (Daily)
// ============================================
export const cleanupRateLimits = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Africa/Lagos')
  .onRun(async (context) => {
    const now = Date.now();
    const oneDayAgo = now - 86400000;
    
    const snapshots = await admin.firestore().collection('rateLimits').get();
    const batch = admin.firestore().batch();
    
    let deletedCount = 0;
    let updatedCount = 0;
    
    snapshots.docs.forEach(doc => {
      const data = doc.data();
      const timestamps = data.timestamps || [];
      const recent = timestamps.filter((t: number) => t > oneDayAgo);
      
      if (recent.length === 0) {
        batch.delete(doc.ref);
        deletedCount++;
      } else {
        batch.update(doc.ref, { timestamps: recent });
        updatedCount++;
      }
    });
    
    await batch.commit();
    console.log(`✅ Rate limits cleaned up: ${deletedCount} deleted, ${updatedCount} updated`);
  });