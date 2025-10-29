"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, TestTube } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useToast } from "@/hooks/use-toast";
import { getApplicationServerKey, getVapidPublicKey } from "@/lib/push-notifications";

export function PushNotificationTest() {
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    typeof window !== "undefined" ? Notification.permission === "granted" : false
  );
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const { user } = useAuthUser();
  const { toast } = useToast();

  // Debug notification support
  useState(() => {
    if (typeof window !== "undefined") {
      const info = [
        `URL: ${window.location.href}`,
        `Host: ${window.location.host}`,
        `Protocol: ${window.location.protocol}`,
        `Notification supported: ${"Notification" in window}`,
        `Service Worker supported: ${"serviceWorker" in navigator}`,
        `Push Manager supported: ${"PushManager" in window}`,
        `Permission: ${Notification.permission}`,
        `User Agent: ${navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"}`,
      ].join("\n");
      setDebugInfo(info);
    }
  });

  const testPushNotification = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to test notifications",
        variant: "destructive",
      });
      return;
    }

    if (!hasNotificationPermission) {
      toast({
        title: "Notifications Disabled",
        description: "Please enable notifications in Settings first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingNotification(true);

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "no_subscription") {
          toast({
            title: "No Push Subscription",
            description: "Please enable push notifications in Settings → Notifications",
            variant: "destructive",
          });
        } else {
          throw new Error(data.message || "Failed to send test notification");
        }
        return;
      }

      toast({
        title: "Test Notification Sent!",
        description: "Check your device for the test notification",
      });

    } catch (error) {
      console.error("Test notification error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsTestingNotification(false);
    }
  };

  // Check notification permission on mount and when it changes
  const checkNotificationPermission = () => {
    if (typeof window !== "undefined") {
      setHasNotificationPermission(Notification.permission === "granted");
    }
  };

  // Re-check permission every few seconds in case user enables it
  useState(() => {
    if (typeof window !== "undefined") {
      const interval = setInterval(checkNotificationPermission, 2000);
      return () => clearInterval(interval);
    }
  });

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingPermission(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        setHasNotificationPermission(true);
        toast({
          title: "Notifications Enabled!",
          description: "You can now receive push notifications for plant reminders",
        });

        // Also subscribe the user to push notifications
        if (user && 'serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const vapidPublicKey = getVapidPublicKey();

          if (!vapidPublicKey) {
            throw new Error("VAPID public key not configured");
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: getApplicationServerKey(vapidPublicKey),
          });

          // Send subscription to server
          const token = await user.getIdToken();
          const subscribeResponse = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(subscription),
          });

          if (!subscribeResponse.ok) {
            const errorData = await subscribeResponse.json().catch(() => null);
            const errorMessage =
              errorData?.error || errorData?.message || subscribeResponse.statusText || "Failed to save subscription";

            console.error("Failed to save push subscription:", errorData);
            toast({
              title: "Subscription Failed",
              description: errorMessage,
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Successfully Subscribed!",
            description: "You're now subscribed to push notifications",
          });
        }
      } else if (permission === "denied") {
        toast({
          title: "Permission Denied",
          description: "You can enable notifications later in your browser settings",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Permission Required",
          description: "Please allow notifications to receive plant reminders",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPermission(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            <CardTitle className="text-lg">Test Push Notifications</CardTitle>
          </div>
          <Badge variant={hasNotificationPermission ? "default" : "secondary"}>
            {hasNotificationPermission ? (
              <>
                <Bell className="h-3 w-3 mr-1" />
                Enabled
              </>
            ) : (
              <>
                <BellOff className="h-3 w-3 mr-1" />
                Disabled
              </>
            )}
          </Badge>
        </div>
        <CardDescription>
          Test the push notification system to make sure reminder notifications will work correctly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {hasNotificationPermission ? (
              "✅ Notifications are enabled. You can test the notification system."
            ) : (
              "⚠️ Click the button below to enable notifications for plant reminders."
            )}
          </div>

          {!hasNotificationPermission ? (
            <Button
              onClick={requestNotificationPermission}
              disabled={isRequestingPermission}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isRequestingPermission ? "Requesting Permission..." : "Enable Notifications"}
            </Button>
          ) : (
            <Button
              onClick={testPushNotification}
              disabled={isTestingNotification}
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTestingNotification ? "Sending Test..." : "Send Test Notification"}
            </Button>
          )}

          {process.env.NODE_ENV === "development" && (
            <>
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                <strong>Dev Mode:</strong> This test button will be hidden in production.
                The test sends a sample notification to verify your push subscription is working.
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Debug Information
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {debugInfo}
                </pre>
              </details>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}