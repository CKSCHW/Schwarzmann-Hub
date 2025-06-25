
'use server';

import { adminDb } from '@/lib/firebase-admin';
import webpush from 'web-push';
import type { PushNotificationPayload } from '@/types';

// This function is called from the client to save their subscription
export async function saveSubscription(subscription: PushSubscription, userId: string) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error('VAPID keys are not set in environment variables.');
    return;
  }
  
  const sub = {
    ...subscription,
    userId: userId,
  };

  try {
    // Use the endpoint as a unique ID to prevent duplicate subscriptions for the same browser
    const subscriptionRef = adminDb.collection('subscriptions').doc(Buffer.from(subscription.endpoint).toString('base64'));
    await subscriptionRef.set(sub);
  } catch (error) {
    console.error('Failed to save subscription to Firestore:', error);
  }
}

// This function is called from the client to remove their subscription
export async function deleteSubscription(endpoint: string) {
    try {
        const subscriptionRef = adminDb.collection('subscriptions').doc(Buffer.from(endpoint).toString('base64'));
        await subscriptionRef.delete();
    } catch (error) {
        console.error('Failed to delete subscription from Firestore:', error);
    }
}


// This function is called from other server actions to send notifications
export async function sendPushNotification(payload: PushNotificationPayload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('Push notifications are not configured on the server. Skipping.');
    return;
  }
  
  webpush.setVapidDetails(
    'mailto:info@elektro-schwarzmann.at',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const subscriptionsSnapshot = await adminDb.collection('subscriptions').get();
  
  if (subscriptionsSnapshot.empty) {
    console.log('No push notification subscriptions found.');
    return;
  }

  const notificationPayload = JSON.stringify(payload);
  const promises: Promise<any>[] = [];

  subscriptionsSnapshot.forEach(doc => {
    const subscription = doc.data() as webpush.PushSubscription;
    promises.push(
      webpush.sendNotification(subscription, notificationPayload)
        .catch(error => {
          // If a subscription is expired or invalid, delete it from the database
          if (error.statusCode === 404 || error.statusCode === 410) {
            console.log('Subscription has expired or is no longer valid: ', error.endpoint);
            return doc.ref.delete();
          } else {
            console.error('Error sending push notification:', error);
          }
        })
    );
  });

  await Promise.all(promises);
}
