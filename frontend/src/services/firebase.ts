// Firebase/FCM has been removed from this project.
// This file is kept as a no-op stub to avoid broken imports.

export const isFirebaseConfigured = (): boolean => false;

export const requestNotificationPermissionAndGetToken = async (): Promise<string> => {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

export const onForegroundMessage = (_callback: (payload: any) => void) => {
  return () => {};
};
