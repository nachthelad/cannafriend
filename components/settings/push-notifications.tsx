"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { useTranslation } from "react-i18next";
import type { PushNotificationsProps } from "@/types";
import { getVapidPublicKey, urlBase64ToUint8Array } from "@/lib/push-notifications";

export function PushNotifications({
  userId
}: PushNotificationsProps) {
  const { t } = useTranslation("common");
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const subscribeUser = async () => {
    try {
      setIsLoading(true);
      console.log("=== STARTING PUSH SUBSCRIPTION ===");

      // Request notification permission
      console.log("Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log("Permission result:", permission);
      setPermission(permission);

      if (permission !== 'granted') {
        console.log("Permission denied by user");
        toast({
          variant: "destructive",
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
        });
        return;
      }

      // Ensure service worker is registered and ready
      console.log("Getting service worker registration...");

      // Wait for service worker to be registered if not already
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log("No service worker found, registering...");
        registration = await navigator.serviceWorker.register('/sw.js');
        console.log("Service worker registered:", registration);
      }

      // Wait for service worker to be ready
      console.log("Waiting for service worker to be ready...");
      await navigator.serviceWorker.ready;
      console.log("Service worker is ready:", registration);

      // Subscribe to push manager
      const vapidPublicKey = getVapidPublicKey();
      console.log("VAPID key length:", vapidPublicKey?.length);

      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      console.log("Subscribing to push manager...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      console.log("Push subscription created:", subscription.endpoint.substring(0, 50));

      // Send subscription to server
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("Sending subscription to server...");
      const token = await user.getIdToken();
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });

      console.log("Server response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error('Failed to save subscription: ' + (errorData.error || response.statusText));
      }

      console.log("=== SUBSCRIPTION SUCCESSFUL ===");
      setIsSubscribed(true);
      toast({
        title: "Notifications enabled",
        description: "You'll now receive push notifications from Cannafriend.",
      });

    } catch (error) {
      console.error('=== SUBSCRIPTION ERROR ===');
      console.error('Error subscribing to push notifications:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });

      toast({
        variant: "destructive",
        title: "Subscription failed",
        description: (error as Error).message || "Could not enable push notifications. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeUser = async () => {
    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Notify server
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      setIsSubscribed(false);
      toast({
        title: "Notifications disabled",
        description: "You will no longer receive push notifications.",
      });

    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        variant: "destructive",
        title: "Unsubscribe failed",
        description: "Could not disable push notifications. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribeUser();
    } else {
      await unsubscribeUser();
    }
  };

  if (!isSupported) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">{t("pushNotifications.title")}</h3>
        </div>
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("pushNotifications.notSupported")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{t("pushNotifications.title")}</h3>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <div className="font-medium">{t("pushNotifications.title")}</div>
            <div className="text-sm text-muted-foreground">
              {permission === 'granted'
                ? isSubscribed
                  ? t("pushNotifications.enabled")
                  : t("pushNotifications.permissionGranted")
                : permission === 'denied'
                  ? t("pushNotifications.blocked")
                  : t("pushNotifications.getNotified")
              }
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {permission === 'denied' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: t("pushNotifications.blockedTitle"),
                  description: t("pushNotifications.blockedDesc"),
                });
              }}
            >
              {t("pushNotifications.enableInBrowser")}
            </Button>
          ) : (
            <Switch
              checked={isSubscribed && permission === 'granted'}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
