"use client";

import { Toaster, toast } from "react-hot-toast";

export const showToast = (type, message, options = {}) => {
  const toastTypes = {
    success: toast.success,
    error: toast.error,
    warning: (msg, opts) => toast(msg, { icon: "⚠️", ...opts }),
    info: (msg, opts) => toast(msg, { icon: "ℹ️", ...opts }),
    default: toast,
  };

  const toastFn = toastTypes[type] || toastTypes.default;
  return toastFn(message, options);
};

export const showLoadingToast = (message, options = {}) =>
  toast.loading(message, options);

export const dismissToast = (toastId) => toast.dismiss(toastId);

const ToastProvider = ({ children }) => {
  return (
    <>
      {children}
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
};

export { ToastProvider };
