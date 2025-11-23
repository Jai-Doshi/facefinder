// Toast.tsx
// Toast notification component for error and success messages

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string | React.ReactNode;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-400 dark:text-green-400 light:text-green-600 transition-colors duration-300" />,
    error: <AlertCircle size={20} className="text-red-400 dark:text-red-400 light:text-red-600 transition-colors duration-300" />,
    info: <AlertCircle size={20} className="text-blue-400 dark:text-blue-400 light:text-blue-600 transition-colors duration-300" />,
  };

  const colors = {
    success: 'border-green-500/30 dark:border-green-500/30 light:border-green-300 bg-green-500/10 dark:bg-green-500/10 light:bg-green-100',
    error: 'border-red-500/30 dark:border-red-500/30 light:border-red-300 bg-red-500/10 dark:bg-red-500/10 light:bg-red-100',
    info: 'border-blue-500/30 dark:border-blue-500/30 light:border-blue-300 bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`glass-panel border ${colors[toast.type]} p-4 rounded-xl flex items-center gap-3 min-w-[300px] max-w-[90vw] shadow-lg dark:shadow-lg light:shadow-gray-300/30`}
    >
      {icons[toast.type]}
      <div className="flex-1 text-white dark:text-white light:text-gray-900 text-sm">{toast.message}</div>
      <button
        onClick={onClose}
        className="text-white/60 dark:text-white/60 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors"
      >
        <X size={18} />
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={() => onRemove(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast context/hook for easy usage
let toastIdCounter = 0;
const toastListeners: Array<(toast: Toast) => void> = [];

export const showToast = (message: string, type: ToastType = 'error') => {
  const toast: Toast = {
    id: `toast-${toastIdCounter++}`,
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(toast));
};

export const useToast = () => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
    };
    toastListeners.push(listener);

    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, removeToast };
};

