import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SupabaseBanner: React.FC = () => {
  const { isDemoMode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isDemoMode) return null;

  return (
    <div className="bg-[#002528] border-b border-[#018076]/70 text-xs text-[#EFF5F9]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#03BFB5] animate-pulse"></span>
          <span className="font-bold text-[#EFF5F9]">Modo Sandbox Activo:</span>
          <span className="text-[#949398]">
            Probando telemetría y roles RBAC. El script SQL <code className="text-[#03BFB5] bg-[#001E21] px-1.5 py-0.5 rounded font-mono-code border border-[#018076]">supabase/schema.sql</code> está listo.
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-[#03BFB5] hover:text-[#EFF5F9] font-bold transition-colors"
        >
          <span>{isOpen ? 'Ocultar guía Supabase' : 'Ver cómo conectar Supabase'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3.5 border-t border-[#018076]/60 bg-[#001E21] space-y-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#002B2E] border border-[#018076]">
              <span className="font-bold text-[#EFF5F9] block mb-1">1. Crear Proyecto en Supabase</span>
              <p className="text-[#949398]">
                Ve a <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#03BFB5] underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a> y crea tu base de datos PostgreSQL.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#002B2E] border border-[#018076]">
              <span className="font-bold text-[#EFF5F9] block mb-1">2. Ejecutar schema.sql</span>
              <p className="text-[#949398]">
                Abre el <strong>SQL Editor</strong> en Supabase, pega el contenido de <code className="text-[#03BFB5] font-mono-code">supabase/schema.sql</code> y ejecútalo (Run).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#002B2E] border border-[#018076]">
              <span className="font-bold text-[#EFF5F9] block mb-1">3. Configurar .env</span>
              <p className="text-[#949398]">
                Copia tu <code className="text-[#03BFB5] font-mono-code">VITE_SUPABASE_URL</code> y <code className="text-[#03BFB5] font-mono-code">VITE_SUPABASE_ANON_KEY</code> en tu archivo <code className="text-[#EFF5F9]">.env</code> y recarga.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
