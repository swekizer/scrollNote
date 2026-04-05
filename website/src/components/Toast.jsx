import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  error: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx.addToast;
};

function ToastItem({ toast, onClose }) {
  const { icon: Icon, color, bg, border } = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = setTimeout(onClose, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border ${bg} ${border} animate-slide-in-right`}
      role="alert"
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${color}`} />
      <p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/5 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
