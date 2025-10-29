export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (typeof window === "undefined") {
    throw new Error("Cannot convert VAPID key on the server");
  }

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function getApplicationServerKey(base64String: string): ArrayBuffer {
  const uint8Array = urlBase64ToUint8Array(base64String);
  const applicationServerKey = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(applicationServerKey).set(uint8Array);

  return applicationServerKey;
}
