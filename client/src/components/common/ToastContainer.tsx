import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { removeToast } from '../../store/slices/toastSlice';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const toasts = useAppSelector((state) => state.toast.toasts);
  const dispatch = useAppDispatch();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={(id) => dispatch(removeToast(id))} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: any; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-indigo-400" />,
  };

  const bgStyles = {
    success: 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100',
    error: 'bg-rose-950/80 border-rose-500/30 text-rose-100',
    warning: 'bg-amber-950/80 border-amber-500/30 text-amber-100',
    info: 'bg-indigo-950/80 border-indigo-500/30 text-indigo-100',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-slide-up ${bgStyles[toast.type as 'success' | 'error' | 'warning' | 'info']}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type as 'success' | 'error' | 'warning' | 'info']}</div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
