import React, { useState } from 'react';
import { X, Lock, Mail, Shield, KeyRound, AlertCircle, ShieldAlert, Eye, Wrench, Gauge } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RolUsuario } from '../types/database';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithEmail, isDemoMode, switchDemoUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const res = await loginWithEmail(email, password);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  const handleQuickDemo = (targetRol: RolUsuario) => {
    switchDemoUser(targetRol);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001E21]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#002B2E] border border-[#018076] rounded-2xl shadow-2xl overflow-hidden">
        {/* Borde superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#004146] via-[#018076] to-[#03BFB5]"></div>

        {/* Cabecera */}
        <div className="p-6 border-b border-[#018076]/60 bg-[#001E21]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#03BFB5]">
              <Shield className="w-5 h-5" />
              <span className="text-[11px] font-mono-code font-bold uppercase tracking-widest">Zero-Trust Auth &bull; RBAC</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#949398] hover:text-[#EFF5F9] hover:bg-[#004146] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-black text-[#EFF5F9] mt-2">Acceso a Invenio</h2>
          <p className="text-xs text-[#949398] mt-1">
            Validación de tokens JWT en PostgreSQL con control estricto de roles.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-[#949398] uppercase tracking-widest mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#949398] absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operario@invenio.logistica"
                required
                className="w-full bg-[#001E21] border border-[#018076] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#EFF5F9] focus:outline-none focus:ring-2 focus:ring-[#03BFB5] focus:border-transparent placeholder:text-[#949398] transition-all font-mono-code"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-[#949398] uppercase tracking-widest mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#949398] absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#001E21] border border-[#018076] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#EFF5F9] focus:outline-none focus:ring-2 focus:ring-[#03BFB5] focus:border-transparent placeholder:text-[#949398] transition-all"
              />
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#004146] border border-[#018076] text-[#EFF5F9] text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#03BFB5]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#03BFB5] hover:bg-[#018076] text-[#004146] hover:text-[#EFF5F9] text-sm font-black shadow-md shadow-[#03BFB5]/30 transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isSubmitting ? 'Validando Token...' : 'Iniciar Sesión'}</span>
          </button>

          {/* Selector de los 4 Roles para Modo Sandbox */}
          {isDemoMode && (
            <div className="pt-4 border-t border-[#018076]/40">
              <span className="block text-[10px] font-bold text-[#949398] uppercase tracking-widest text-center mb-2.5">
                Prueba Rápida por Rol (Sandbox RBAC)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#001E21] hover:bg-[#004146] border border-[#03BFB5] text-xs text-[#03BFB5] font-bold transition-all"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[#03BFB5]" />
                  <span>Admin (Total)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('supervisor')}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#001E21] hover:bg-[#018076]/40 border border-[#018076] text-xs text-[#EFF5F9] font-bold transition-all"
                >
                  <Gauge className="w-3.5 h-3.5 text-[#03BFB5]" />
                  <span>Supervisor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('operario')}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#001E21] hover:bg-[#004146] border border-[#018076] text-xs text-[#EFF5F9] font-bold transition-all"
                >
                  <Wrench className="w-3.5 h-3.5 text-[#949398]" />
                  <span>Operario</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('auditor')}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#001E21] hover:bg-[#949398]/20 border border-[#949398] text-xs text-[#949398] font-bold transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-[#949398]" />
                  <span>Auditor (Lectura)</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
