"use client";

import { toast } from "sonner";

export interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  id?: string;
}

interface ToastPromiseOptions<T> {
  loading?: string;
  success?: string | ((data: T) => string);
  error?: string | ((error: Error) => string);
}

export const useToast = () => {
  const showSuccess = (message: string, options?: ToastOptions) => {
    return toast.success(message, options);
  };

  const showError = (message: string, options?: ToastOptions) => {
    return toast.error(message, options);
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    return toast.info(message, options);
  };

  const showWarning = (message: string, options?: ToastOptions) => {
    return toast.warning(message, options);
  };

  const showDefault = (message: string, options?: ToastOptions) => {
    return toast(message, options);
  };

  const showPromise = <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: ToastPromiseOptions<T>,
    toastOptions?: Omit<ToastOptions, "description">,
  ) => {
    return toast.promise(promise, { ...options, ...toastOptions });
  };

  const dismiss = (id?: string) => {
    toast.dismiss(id);
  };

  return {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
    default: showDefault,
    promise: showPromise,
    dismiss,
  };
};

// Export direct toast functions for convenience
export const toastSuccess = (message: string, options?: ToastOptions) =>
  toast.success(message, options);

export const toastError = (message: string, options?: ToastOptions) =>
  toast.error(message, options);

export const toastInfo = (message: string, options?: ToastOptions) =>
  toast.info(message, options);

export const toastWarning = (message: string, options?: ToastOptions) =>
  toast.warning(message, options);

export const toastDefault = (message: string, options?: ToastOptions) =>
  toast(message, options);

export const toastPromise = <T>(
  promise: Promise<T> | (() => Promise<T>),
  options: ToastPromiseOptions<T>,
  toastOptions?: Omit<ToastOptions, "description">,
) => toast.promise(promise, { ...options, ...toastOptions });

export const toastDismiss = (id?: string) => toast.dismiss(id);
