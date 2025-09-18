import { auth } from "@/lib/firebase";

/**
 * Copies a value to the clipboard when the Clipboard API is available.
 * Returns a boolean that indicates whether the operation was successful so
 * callers can provide appropriate UI feedback.
 */
export async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    console.warn("Clipboard API is not available in this environment");
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard", error);
    return false;
  }
}

/**
 * Retrieves the Firebase auth token for the current user. Throws if there is
 * no authenticated user available on the client.
 */
export async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("auth_required");
  }

  return currentUser.getIdToken();
}

/**
 * Performs a fetch request including the Firebase ID token in the
 * Authorization header. This keeps token-handling logic in a shared location
 * so panels can focus on their own behaviour.
 */
export async function authorizedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}
