/**
 * Orbit Toast Utility
 * A theme-aware replacement for react-hot-toast that bridges
 * into the Zustand notification store for use in stores/services.
 */

import { useNotificationStore } from '../store/useNotificationStore';

const createToast = (type, message, options = {}) => {
  const { addNotification } = useNotificationStore.getState();
  addNotification({
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    message,
    duration: options.duration ?? 4000,
    position: options.position ?? 'top-right',
    ...options,
  });
};

const toast = (message, options = {}) => createToast('info', message, options);

toast.success = (message, options = {}) => createToast('success', message, options);
toast.error   = (message, options = {}) => createToast('error',   message, options);
toast.warning = (message, options = {}) => createToast('warning', message, options);
toast.info    = (message, options = {}) => createToast('info',    message, options);

export default toast;
