
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import webpush from 'web-push';
import type { Notification, PushNotificationPayload, NotificationReceipt, NotificationWithStatus, StoredPushSubscription } from '@/types';

// This function is called from the client to save their subscription
export async function saveSubscription(subscription: PushSubscription, userId: string) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error('VAPID keys are not set in environment variables.');
    return { success: false, error: 'VAPID keys are not configured.' };
  }
  
  const sub: StoredPushSubscription = {
    ...JSON.parse(JSON.stringify(subscription)), // Ensure it's a plain object
    userId: userId,
  };

  try {
    const subscriptionId = Buffer.from(subscription.endpoint).toString('base64');
    const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
    await subscriptionRef.set(sub);
    return { success: true };
  } catch (error) {
    console.error('Failed to save subscription to Firestore:', error);
    return { success: false, error: (error as Error).message };
  }
}

// This function is called from the client to remove their subscription
export async function deleteSubscription(endpoint: string) {
    try {
        const subscriptionId = Buffer.from(endpoint).toString('base64');
        const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
        await subscriptionRef.delete();
        return { success: true };
    } catch (error) {
        console.error('Failed to delete subscription from Firestore:', error);
        return { success: false, error: (error as Error).message };
    }
}


// Central function to create a notification and send push messages
export async function sendAndSavePushNotification(payload: Omit<Notification, 'id' | 'createdAt'>) {
    // 1. Save notification to the database
    const notificationsCollection = adminDb.collection('notifications');
    const newNotificationRef = notificationsCollection.doc();
    const newNotification: Notification = {
        ...payload,
        id: newNotificationRef.id,
        createdAt: new Date().toISOString(),
    };
    await newNotificationRef.set(newNotification);

    // 2. Send push notifications
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.log('Push notifications are not configured on the server. Skipping send.');
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

    const pushPayload: PushNotificationPayload = {
        title: newNotification.title,
        body: newNotification.body,
        url: newNotification.url,
        icon: newNotification.icon,
        notificationId: newNotification.id,
    };
    const notificationString = JSON.stringify(pushPayload);
    const promises: Promise<any>[] = [];

    subscriptionsSnapshot.forEach(doc => {
        const subscription = doc.data() as webpush.PushSubscription;
        promises.push(
            webpush.sendNotification(subscription, notificationString)
                .catch(error => {
                    if (error.statusCode === 404 || error.statusCode === 410) {
                        console.log('Subscription has expired or is no longer valid, deleting: ', error.endpoint);
                        return doc.ref.delete();
                    } else {
                        console.error('Error sending push notification to endpoint:', error.endpoint, error.body);
                    }
                })
        );
    });

    await Promise.all(promises);
    revalidatePath('/layout'); // To trigger re-fetch in the bell
}

// Action to send a test notification to all subscribed users.
export async function sendTestNotification() {
    await sendAndSavePushNotification({
        title: "Test-Benachrichtigung",
        body: "Dies ist eine Test-Nachricht vom Admin-Dashboard.",
        url: "/",
        icon: "https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-180x180.png"
    });
    return { success: true };
}


// Gets all notifications for a user, along with their read/clicked status.
export async function getNotificationsForUser(userId: string): Promise<NotificationWithStatus[]> {
  const notificationsSnapshot = await adminDb.collection('notifications').orderBy('createdAt', 'desc').limit(20).get();
  const notifications = notificationsSnapshot.docs.map(doc => doc.data() as Notification);

  if (notifications.length === 0) return [];
  
  const notificationIds = notifications.map(n => n.id);
  const receiptsSnapshot = await adminDb.collection('notificationReceipts')
      .where('userId', '==', userId)
      .where('notificationId', 'in', notificationIds)
      .get();
  
  const receiptsMap = new Map<string, NotificationReceipt>();
  receiptsSnapshot?.docs.forEach(doc => {
    const receipt = doc.data() as NotificationReceipt;
    receiptsMap.set(receipt.notificationId, receipt);
  });

  const userNotifications = notifications
    .map(notification => {
      const receipt = receiptsMap.get(notification.id);
      return {
        ...notification,
        isRead: !!receipt?.readAt,
        isClicked: !!receipt?.clickedAt,
        isDeleted: !!receipt?.isDeleted,
      };
    })
    .filter(n => !n.isDeleted); // Filter out soft-deleted notifications

  return userNotifications;
}


// Marks a specific notification as clicked for a user.
export async function markNotificationAsClicked(notificationId: string, userId: string): Promise<void> {
  const receiptId = `${userId}_${notificationId}`;
  const receiptRef = adminDb.collection('notificationReceipts').doc(receiptId);
  
  try {
    await receiptRef.set({
      id: receiptId,
      userId,
      notificationId,
      clickedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error(`Failed to mark notification ${notificationId} as clicked for user ${userId}:`, error);
  }
}

// Marks all of a user's unread notifications as read.
export async function markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
  if (notificationIds.length === 0) return;
  const batch = adminDb.batch();
  
  notificationIds.forEach(notificationId => {
    const receiptId = `${userId}_${notificationId}`;
    const receiptRef = adminDb.collection('notificationReceipts').doc(receiptId);
    batch.set(receiptRef, {
      id: receiptId,
      userId,
      notificationId,
      readAt: new Date().toISOString(),
    }, { merge: true });
  });

  try {
    await batch.commit();
    revalidatePath('/layout');
  } catch (error) {
    console.error(`Failed to mark notifications as read for user ${userId}:`, error);
  }
}

// Soft-deletes a notification for a specific user.
export async function deleteNotificationForUser(notificationId: string, userId: string): Promise<void> {
  const receiptId = `${userId}_${notificationId}`;
  const receiptRef = adminDb.collection('notificationReceipts').doc(receiptId);
  
  try {
    await receiptRef.set({
      id: receiptId,
      userId,
      notificationId,
      isDeleted: true,
    }, { merge: true });
    revalidatePath('/layout');
  } catch (error) {
    console.error(`Failed to delete notification ${notificationId} for user ${userId}:`, error);
  }
}
