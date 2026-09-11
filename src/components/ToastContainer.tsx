import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import { useStock } from '../context/StockContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removerToast } = useStock();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
      {toasts.map((t) => {
        const isSuccess = t.tipo === 'success';
        const isWarning = t.tipo === 'warning';
        const isError = t.tipo === 'error';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 duration-200 bg-[#002B2E]/95 ${
              isSuccess
                ? 'border-[#03BFB5] text-[#EFF5F9] shadow-lg shadow-[#03BFB5]/20'
                : isWarning
                ? 'border-[#018076] text-[#EFF5F9]'
                : isError
                ? 'border-[#004146] text-[#EFF5F9]'
                : 'border-[#018076] text-[#EFF5F9]'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#03BFB5]" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-[#03BFB5]" />}
              {isError && <AlertOctagon className="w-5 h-5 text-[#949398]" />}
              {!isSuccess && !isWarning && !isError && <Info className="w-5 h-5 text-[#03BFB5]" />}
            </div>

            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#03BFB5]">
                {t.titulo}
              </h4>
              <p className="text-xs mt-0.5 text-[#EFF5F9]">{t.mensaje}</p>
            </div>

            <button
              onClick={() => removerToast(t.id)}
              className="opacity-70 hover:opacity-100 transition-opacity p-0.5 text-[#949398] hover:text-[#EFF5F9]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
