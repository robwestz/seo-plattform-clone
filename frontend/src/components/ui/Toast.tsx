import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className="pointer-events-auto"
          >
            <ToastItem
              {...toast}
              onDismiss={() => removeToast(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastItemProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const styles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      titleColor: 'text-green-900',
      messageColor: 'text-green-700',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      titleColor: 'text-red-900',
      messageColor: 'text-red-700',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      titleColor: 'text-yellow-900',
      messageColor: 'text-yellow-700',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <Info className="h-5 w-5 text-blue-500" />,
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700',
    },
  };

  const style = styles[type];

  return (
    <div
      className={`rounded-lg border shadow-lg p-4 ${style.bg} min-w-[320px] max-w-md`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{style.icon}</div>

        <div className="flex-1 min-w-0">
          <div className={`font-semibold ${style.titleColor}`}>{title}</div>
          {message && (
            <div className={`text-sm mt-1 ${style.messageColor}`}>{message}</div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className="h-1 bg-current opacity-20 rounded-full mt-3"
      />
    </div>
  );
};

export default ToastContainer;
