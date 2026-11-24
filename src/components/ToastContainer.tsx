import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useLaundry } from '../context/LaundryContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useLaundry();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg transition-all ${
            t.tone === 'success'
              ? 'border-emerald-200'
              : t.tone === 'warning'
              ? 'border-amber-200'
              : 'border-blue-200'
          }`}
        >
          {t.tone === 'success' && (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          {t.tone === 'info' && (
            <Info className="h-5 w-5 text-[#1D4ED8] shrink-0 mt-0.5" aria-hidden="true" />
          )}
          {t.tone === 'warning' && (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{t.title}</p>
            {t.description && <p className="text-xs text-slate-600 mt-0.5">{t.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Tutup notifikasi"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
