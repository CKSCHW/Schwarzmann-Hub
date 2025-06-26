'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { saveSubscription, deleteSubscription } from '@/actions/notificationActions';
import { useToast } from './use-toast';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
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
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);

  // New state for iOS / PWA detection
  const [isIos, setIsIos] = useState(false);
  const [isPwa, setIsPwa] = useState(false);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
        setPermission(Notification.permission);
      } else {
        setIsSupported(false);
      }
      
      // Detect iOS and PWA mode
      setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setIsPwa(window.matchMedia('(display-mode: standalone)').matches);
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

  const subscribeToPush = useCallback(async () => {
    if (!isSupported || !user || !VAPID_PUBLIC_KEY) {
      console.error('Push not supported, user not logged in, or VAPID key missing.');
      if (!VAPID_PUBLIC_KEY) {
        toast({ title: 'Fehler', description: 'Push-Benachrichtigungen sind serverseitig nicht konfiguriert.', variant: 'destructive'});
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

      const result = await saveSubscription(newSubscription, user.uid);
      if (result.success) {
        setSubscription(newSubscription);
        setIsSubscribed(true);
        setPermission('granted');
        toast({ title: 'Erfolg', description: 'Sie erhalten nun Benachrichtigungen.' });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      toast({ title: 'Fehler bei der Anmeldung', description: 'Die Benachrichtigungen konnten nicht aktiviert werden.', variant: 'destructive'});
      setPermission(Notification.permission);
    } finally {
      setLoading(false);
    }
  }, [isSupported, user, toast]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription || !user) return;
    
    setLoading(true);
    try {
      await subscription.unsubscribe();
      await deleteSubscription(subscription.endpoint);
      
      setSubscription(null);
      setIsSubscribed(false);
      toast({ title: 'Abgemeldet', description: 'Sie erhalten keine Benachrichtigungen mehr.' });
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      toast({ title: 'Fehler beim Abmelden', description: 'Die Benachrichtigungen konnten nicht deaktiviert werden.', variant: 'destructive'});
    } finally {
        setLoading(false);
    }
  }, [subscription, user, toast]);

  return { isSubscribed, subscribeToPush, unsubscribeFromPush, permission, isSupported, loading, isIos, isPwa };
}
