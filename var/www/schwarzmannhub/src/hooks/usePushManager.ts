
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { saveSubscription, deleteSubscription } from '@/actions/notificationActions';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushManager() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    } else {
        setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupported || !user) {
        setLoading(false);
        return;
    };

    const getSubscription = async () => {
      setLoading(true);
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
        setIsSubscribed(!!sub);
      } catch (error) {
        console.error('Error getting push subscription:', error);
      } finally {
        setLoading(false);
      }
    };
    getSubscription();
  }, [isSupported, user]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user || !VAPID_PUBLIC_KEY) {
      console.error('Push not supported, user not logged in, or VAPID key missing.');
      if (!VAPID_PUBLIC_KEY) {
        alert('Push-Benachrichtigungen sind nicht konfiguriert. VAPID Public Key fehlt.');
      }
      return;
    }
    
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // The subscription object needs to be stringified to be passed to a server action.
      await saveSubscription(JSON.parse(JSON.stringify(newSubscription)), user.uid);
      setSubscription(newSubscription);
      setIsSubscribed(true);
      setPermission('granted');

    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      setPermission(Notification.permission); // Update permission state if user denied it
    } finally {
      setLoading(false);
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async () => {
    if (!subscription || !user) return;
    
    setLoading(true);
    try {
        // Unsubscribe on the client
      await subscription.unsubscribe();
      // Unsubscribe on the server
      await deleteSubscription(subscription.endpoint);
      
      setSubscription(null);
      setIsSubscribed(false);
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    } finally {
        setLoading(false);
    }
  }, [subscription, user]);

  return { isSubscribed, subscribe, unsubscribe, permission, isSupported, loading };
}
