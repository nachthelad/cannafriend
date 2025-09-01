/**
 * Haptic feedback utilities for mobile web applications
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Trigger haptic feedback if supported by the device
 * @param pattern - The type of haptic feedback to trigger
 */
export function triggerHaptic(pattern: HapticPattern = 'light'): void {
  // Check if running on mobile device
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) return;

  // Try modern Haptic API first (iOS Safari)
  if ('Haptic' in window) {
    try {
      switch (pattern) {
        case 'light':
          // @ts-ignore - Haptic API is not yet in TypeScript
          window.Haptic.impactOccurred('light');
          break;
        case 'medium':
          // @ts-ignore
          window.Haptic.impactOccurred('medium');
          break;
        case 'heavy':
          // @ts-ignore
          window.Haptic.impactOccurred('heavy');
          break;
        case 'success':
          // @ts-ignore
          window.Haptic.notificationOccurred('success');
          break;
        case 'warning':
          // @ts-ignore
          window.Haptic.notificationOccurred('warning');
          break;
        case 'error':
          // @ts-ignore
          window.Haptic.notificationOccurred('error');
          break;
      }
      return;
    } catch (error) {
      // Fall through to vibration API
    }
  }

  // Fallback to Vibration API (Android Chrome, some iOS browsers)
  if ('vibrate' in navigator) {
    try {
      switch (pattern) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'success':
          navigator.vibrate([50, 50, 50]);
          break;
        case 'warning':
          navigator.vibrate([100, 50, 100]);
          break;
        case 'error':
          navigator.vibrate([200, 100, 200]);
          break;
      }
    } catch (error) {
      // Silently fail if vibration is not supported or blocked
    }
  }
}

/**
 * Check if haptic feedback is supported on the current device
 */
export function isHapticSupported(): boolean {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isMobile && ('Haptic' in window || 'vibrate' in navigator);
}