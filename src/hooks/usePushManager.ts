
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
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const setup = async () => {
        setLoading(true);
        const runningOnIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIos(runningOnIos);

        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);

        if (supported) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'notifications' });
            setPermission(permissionStatus.state);
            permissionStatus.onchange = () => setPermission(permissionStatus.state);
          } catch (e) {
            // Safari on iOS before 16.4 does not support the Permissions API for notifications.
            // Fallback to Notification.permission.
            setPermission(Notification.permission);
          }

          if (user) {
            try {
              const registration = await navigator.serviceWorker.ready;
              const sub = await registration.pushManager.getSubscription();
              if (sub) {
                setSubscription(sub);
                setIsSubscribed(true);
              } else {
                setIsSubscribed(false);
              }
            } catch (error) {
              console.error('Error getting push subscription:', error);
              setIsSubscribed(false);
            }
          }
        }
        setLoading(false);
      };
      setup();
    }
  }, [user]);

  const subscribeToPush = useCallback(async () => {
    if (!isSupported) {
      if (isIos && !window.matchMedia('(display-mode: standalone)').matches) {
          toast({
            title: 'Hinweis für iPhone-Nutzer',
            description: 'Um Benachrichtigungen zu erhalten, fügen Sie diese App bitte zuerst zu Ihrem Home-Bildschirm hinzu (über das "Teilen"-Menü in Safari). Öffnen Sie die App dann vom Home-Bildschirm und aktivieren Sie die Benachrichtigungen hier erneut.',
            duration: 12000,
          });
      } else {
        toast({ title: 'Nicht unterstützt', description: 'Ihr Browser unterstützt keine Push-Benachrichtigungen.', variant: 'destructive'});
      }
      return;
    }

    if (!window.isSecureContext) {
        toast({
            title: 'Unsichere Verbindung',
            description: 'Push-Benachrichtigungen sind nur über eine sichere (HTTPS) Verbindung möglich.',
            variant: 'destructive',
        });
        return;
    }

    if (!user || !VAPID_PUBLIC_KEY) {
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
        await newSubscription.unsubscribe();
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to subscribe to push notifications:', error);
      if (error.name === 'NotAllowedError') {
        setPermission('denied');
        toast({ 
          title: 'Benachrichtigungen blockiert', 
          description: 'Sie können die Berechtigung in den Browser-Einstellungen ändern.',
          variant: 'destructive'
        });
      } else {
        toast({ 
          title: 'Fehler bei der Anmeldung', 
          description: `Die Benachrichtigungen konnten nicht aktiviert werden. (${error.name})`, 
          variant: 'destructive'
        });
        setPermission(Notification.permission);
      }
    } finally {
      setLoading(false);
    }
  }, [isSupported, user, toast, isIos]);

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

  return { isSubscribed, subscribeToPush, unsubscribeFromPush, permission, loading };
}
