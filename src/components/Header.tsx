import React from 'react';
import { Package, ShieldCheck, Radio, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../context/StockContext';
import { RolUsuario } from '../types/database';

interface HeaderProps {
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin }) => {
  const { perfil, rol, isAdmin, isSupervisor, isOperario, isAuditor, logout, isDemoMode, switchDemoUser } = useAuth();
  const { isRealtimeConnected } = useStock();

  const getRoleBadgeStyle = (currentRol: RolUsuario) => {
    switch (currentRol) {
      case 'admin':
        return 'bg-[#03BFB5] text-[#004146] font-black border-[#03BFB5] shadow-sm shadow-[#03BFB5]/30';
      case 'supervisor':
        return 'bg-[#018076] text-[#EFF5F9] font-bold border-[#03BFB5]/50';
      case 'operario':
        return 'bg-[#004146] text-[#EFF5F9] border-[#018076] font-semibold';
      case 'auditor':
        return 'bg-[#949398]/20 text-[#EFF5F9] border-[#949398]/50 font-medium';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#002B2E]/95 backdrop-blur-md border-b border-[#018076]/60 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Marca & Logo con Colores #004146, #018076, #03BFB5 */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#018076] to-[#03BFB5] rounded-xl blur opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-10 h-10 rounded-xl bg-[#004146] border border-[#03BFB5]/60 flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 text-[#03BFB5]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-wider text-[#EFF5F9] flex items-center gap-1.5">
                <span>INVENIO</span>
                <span className="text-[#03BFB5] font-mono-code font-light text-xs tracking-normal">PETRONAS</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded bg-[#004146] text-[#03BFB5] border border-[#018076]">
                F1 Edition
              </span>
            </div>
            <p className="text-xs text-[#949398] flex items-center gap-1.5">
              <span>Control Logístico</span>
              <span className="text-[#03BFB5]">&bull;</span>
              <span className="text-[#EFF5F9]">Telemetría en Tiempo Real</span>
            </p>
          </div>
        </div>

        {/* Indicadores Centrales: Realtime & Ciberseguridad */}
        <div className="hidden md:flex items-center gap-3">
          {/* Indicador de Tiempo Real */}
          <div className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium border ${
            isRealtimeConnected
              ? 'bg-[#004146] text-[#03BFB5] border-[#03BFB5]/60 shadow-sm shadow-[#03BFB5]/20'
              : 'bg-[#004146] text-[#949398] border-[#949398]/50'
          }`}>
            <span className="relative flex h-2 w-2">
              {isRealtimeConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#03BFB5] opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRealtimeConnected ? 'bg-[#03BFB5]' : 'bg-[#949398]'}`}></span>
            </span>
            <Radio className="w-3.5 h-3.5" />
            <span className="font-mono-code font-bold tracking-wide">
              {isRealtimeConnected ? 'TELEMETRÍA EN VIVO' : 'CONECTANDO...'}
            </span>
          </div>

          {/* Badge de Seguridad RLS */}
          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-[#004146] text-[#EFF5F9] border border-[#018076]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#03BFB5]" />
            <span>RLS Zero-Trust & JWT</span>
          </div>
        </div>

        {/* Perfil & Control de Roles */}
        <div className="flex items-center gap-3">
          {perfil ? (
            <div className="flex items-center gap-2.5">
              {/* Selector de Roles Sandbox */}
              {isDemoMode && (
                <div className="hidden sm:flex items-center bg-[#001E21] rounded-xl p-1 border border-[#018076]/70 text-xs">
                  <button
                    onClick={() => switchDemoUser('admin')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      isAdmin
                        ? 'bg-[#03BFB5] text-[#004146] shadow-md shadow-[#03BFB5]/30'
                        : 'text-[#949398] hover:text-[#EFF5F9]'
                    }`}
                    title="Admin: Acceso Total"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => switchDemoUser('supervisor')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      isSupervisor
                        ? 'bg-[#018076] text-[#EFF5F9] shadow-md shadow-[#018076]/40'
                        : 'text-[#949398] hover:text-[#EFF5F9]'
                    }`}
                    title="Supervisor: Catálogo y Ajustes"
                  >
                    Supervisor
                  </button>
                  <button
                    onClick={() => switchDemoUser('operario')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      isOperario
                        ? 'bg-[#004146] text-[#03BFB5] border border-[#018076]'
                        : 'text-[#949398] hover:text-[#EFF5F9]'
                    }`}
                    title="Operario: Entradas y Salidas"
                  >
                    Operario
                  </button>
                  <button
                    onClick={() => switchDemoUser('auditor')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      isAuditor
                        ? 'bg-[#949398] text-[#001E21]'
                        : 'text-[#949398] hover:text-[#EFF5F9]'
                    }`}
                    title="Auditor: Solo Lectura"
                  >
                    Auditor
                  </button>
                </div>
              )}

              {/* Usuario Info */}
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-sm font-bold text-[#EFF5F9] leading-tight">{perfil.nombre}</span>
                <span className="text-xs font-mono-code flex items-center justify-end gap-1 mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getRoleBadgeStyle(rol)}`}>
                    {rol}
                  </span>
                </span>
              </div>

              {/* Botón Logout */}
              <button
                onClick={logout}
                className="p-2 rounded-xl bg-[#004146] hover:bg-[#018076] text-[#EFF5F9] border border-[#018076] transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 text-[#EFF5F9]" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#03BFB5] hover:bg-[#018076] text-[#004146] hover:text-[#EFF5F9] text-sm font-black transition-all shadow-md shadow-[#03BFB5]/30"
            >
              <User className="w-4 h-4" />
              <span>Acceso</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
