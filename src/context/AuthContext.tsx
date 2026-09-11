import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Perfil, RolUsuario } from '../types/database';
import { mockUsuarios } from '../lib/mockData';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  perfil: Perfil | null;
  rol: RolUsuario;
  isAdmin: boolean;
  isSupervisor: boolean;
  isOperario: boolean;
  isAuditor: boolean;
  canManageUsers: boolean;
  canManageProducts: boolean;
  canMoveStock: boolean;
  canAdjustStock: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, nombre: string, rol: RolUsuario) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  // Modo demo/offline para probar roles de inmediato
  isDemoMode: boolean;
  switchDemoUser: (targetRole: RolUsuario) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode] = useState(!isSupabaseConfigured);

  // Inicializar o escuchar cambios de sesión en Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Usar usuario demo admin por defecto para desarrollo visual
      setPerfil(mockUsuarios[0]);
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await fetchPerfil(initialSession.user.id);
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchPerfil(newSession.user.id);
      } else {
        setPerfil(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('No se encontró perfil para el usuario:', error.message);
        return;
      }
      if (data) {
        setPerfil(data as Perfil);
      }
    } catch (err) {
      console.error('Error fetching perfil:', err);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (isDemoMode) {
      const found = mockUsuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setPerfil(found);
        return { error: null };
      }
      return { error: 'En modo demo, usa admin@invenio.logistica o operario@invenio.logistica' };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err?.message || 'Error al iniciar sesión' };
    }
  };

  const signUpWithEmail = async (email: string, password: string, nombre: string, rol: RolUsuario) => {
    if (isDemoMode) {
      return { error: 'El registro está disponible una vez conectes tu proyecto de Supabase en .env' };
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            rol,
          },
        },
      });
      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err?.message || 'Error al registrar usuario' };
    }
  };

  const logout = async () => {
    if (isDemoMode) {
      // Reinicia a operario o perfil vacío
      setPerfil(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPerfil(null);
  };

  const switchDemoUser = (targetRole: RolUsuario) => {
    const target = mockUsuarios.find(u => u.rol === targetRole);
    if (target) {
      setPerfil(target);
    }
  };

  const rol: RolUsuario = perfil?.rol || 'operario';
  const isAdmin = rol === 'admin';
  const isSupervisor = rol === 'supervisor';
  const isOperario = rol === 'operario';
  const isAuditor = rol === 'auditor';

  // Regla clave: Solo el Admin tiene acceso total absoluto (gestión de usuarios, auditoría forense y borrado)
  const canManageUsers = isAdmin;
  const canManageProducts = isAdmin || isSupervisor;
  const canMoveStock = isAdmin || isSupervisor || isOperario; // Auditor es 100% de solo lectura
  const canAdjustStock = isAdmin || isSupervisor; // Ajustes directos de inventario restringidos a Admin y Supervisor

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        perfil,
        rol,
        isAdmin,
        isSupervisor,
        isOperario,
        isAuditor,
        canManageUsers,
        canManageProducts,
        canMoveStock,
        canAdjustStock,
        isLoading,
        loginWithEmail,
        signUpWithEmail,
        logout,
        isDemoMode,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
