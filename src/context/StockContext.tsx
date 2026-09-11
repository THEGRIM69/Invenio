import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Producto, Categoria, MovimientoStock, RegistrarMovimientoDTO } from '../types/database';
import { mockProductos, mockCategorias, mockMovimientos } from '../lib/mockData';
import { useAuth } from './AuthContext';

export interface ToastNotificacion {
  id: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  titulo: string;
  mensaje: string;
}

interface StockContextType {
  productos: Producto[];
  categorias: Categoria[];
  movimientos: MovimientoStock[];
  isLoading: boolean;
  isRealtimeConnected: boolean;
  categoriaSeleccionada: string;
  setCategoriaSeleccionada: (catId: string) => void;
  busqueda: string;
  setBusqueda: (query: string) => void;
  soloStockBajo: boolean;
  setSoloStockBajo: (val: boolean) => void;
  toasts: ToastNotificacion[];
  removerToast: (id: string) => void;
  registrarMovimiento: (dto: Omit<RegistrarMovimientoDTO, 'p_producto_id'> & { producto_id: string }) => Promise<{ success: boolean; mensaje: string }>;
  recargarDatos: () => Promise<void>;
  // Métricas
  kpis: {
    totalProductos: number;
    stockCritico: number;
    stockBajo: number;
    totalUnidades: number;
    movimientosHoy: number;
  };
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { perfil, isDemoMode } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  
  // Filtros
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState<string>('');
  const [soloStockBajo, setSoloStockBajo] = useState<boolean>(false);

  // Notificaciones Toast en tiempo real
  const [toasts, setToasts] = useState<ToastNotificacion[]>([]);

  const agregarToast = useCallback((notif: Omit<ToastNotificacion, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...notif, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removerToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Carga inicial de datos
  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    if (isDemoMode) {
      setProductos(mockProductos);
      setCategorias(mockCategorias);
      setMovimientos(mockMovimientos);
      setIsRealtimeConnected(true);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Cargar categorías
      const { data: catData, error: catError } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');

      if (!catError && catData) setCategorias(catData);

      // 2. Cargar productos con su categoría
      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('*, categoria:categorias(*)')
        .eq('activo', true)
        .order('nombre');

      if (!prodError && prodData) setProductos(prodData);

      // 3. Cargar últimos movimientos (Kardex)
      const { data: movData, error: movError } = await supabase
        .from('movimientos_stock')
        .select('*, producto:productos(*), usuario:perfiles(*)')
        .order('creado_en', { ascending: false })
        .limit(50);

      if (!movError && movData) setMovimientos(movData);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      agregarToast({
        tipo: 'error',
        titulo: 'Error de Conexión',
        mensaje: 'No se pudo conectar a la base de datos de Supabase.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode, agregarToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Suscripción en Tiempo Real con Supabase Realtime (WebSockets)
  useEffect(() => {
    if (isDemoMode) {
      setIsRealtimeConnected(true);
      return;
    }

    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productos' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Producto;
            setProductos(prev =>
              prev.map(p => (p.id === updated.id ? { ...p, ...updated } : p))
            );
            agregarToast({
              tipo: updated.stock_actual <= updated.stock_minimo ? 'warning' : 'info',
              titulo: 'Stock Actualizado en Vivo',
              mensaje: `${updated.nombre}: Nuevo stock ${updated.stock_actual} ${updated.unidad_medida}`
            });
          } else if (payload.eventType === 'INSERT') {
            const nuevo = payload.new as Producto;
            setProductos(prev => [nuevo, ...prev]);
            agregarToast({
              tipo: 'success',
              titulo: 'Nuevo Producto en Almacén',
              mensaje: `${nuevo.nombre} (SKU: ${nuevo.sku})`
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'movimientos_stock' },
        (payload) => {
          const nuevoMov = payload.new as MovimientoStock;
          setMovimientos(prev => [nuevoMov, ...prev.slice(0, 49)]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDemoMode, agregarToast]);

  // Registrar movimiento atómico
  const registrarMovimiento = async (
    dto: Omit<RegistrarMovimientoDTO, 'p_producto_id'> & { producto_id: string }
  ): Promise<{ success: boolean; mensaje: string }> => {
    const { producto_id, p_tipo, p_cantidad, p_motivo, p_referencia_documento } = dto;

    if (p_cantidad <= 0) {
      return { success: false, mensaje: 'La cantidad debe ser mayor a 0.' };
    }

    const prod = productos.find(p => p.id === producto_id);
    if (!prod) {
      return { success: false, mensaje: 'Producto no encontrado.' };
    }

    // Modo Demo / Mock
    if (isDemoMode) {
      let nuevoStock = prod.stock_actual;
      if (p_tipo === 'entrada') nuevoStock += p_cantidad;
      else if (p_tipo === 'salida' || p_tipo === 'merma') {
        if (prod.stock_actual < p_cantidad) {
          return { success: false, mensaje: `Stock insuficiente. Disponible: ${prod.stock_actual}` };
        }
        nuevoStock -= p_cantidad;
      } else if (p_tipo === 'ajuste') {
        nuevoStock = p_cantidad;
      }

      // Actualizar producto local
      const productoActualizado: Producto = {
        ...prod,
        stock_actual: nuevoStock,
        actualizado_en: new Date().toISOString()
      };

      setProductos(prev => prev.map(p => p.id === producto_id ? productoActualizado : p));

      // Asentar en Kardex local inmutable
      const nuevoMov: MovimientoStock = {
        id: 'mov-' + Date.now(),
        producto_id,
        producto: productoActualizado,
        usuario_id: perfil?.id || 'usr-anon',
        usuario: perfil || undefined,
        tipo: p_tipo,
        cantidad: p_cantidad,
        stock_anterior: prod.stock_actual,
        stock_nuevo: nuevoStock,
        motivo: p_motivo,
        referencia_documento: p_referencia_documento || undefined,
        creado_en: new Date().toISOString()
      };

      setMovimientos(prev => [nuevoMov, ...prev]);

      agregarToast({
        tipo: 'success',
        titulo: `Movimiento Registrado (${p_tipo.toUpperCase()})`,
        mensaje: `${prod.nombre}: ${prod.stock_actual} ➔ ${nuevoStock} ${prod.unidad_medida}`
      });

      return { success: true, mensaje: 'Movimiento registrado con éxito.' };
    }

    // Modo Producción con Supabase RPC transaccional
    try {
      const { data, error } = await supabase.rpc('registrar_movimiento', {
        p_producto_id: producto_id,
        p_tipo: p_tipo,
        p_cantidad: p_cantidad,
        p_motivo: p_motivo,
        p_referencia_documento: p_referencia_documento || null
      });

      if (error) {
        return { success: false, mensaje: error.message };
      }

      agregarToast({
        tipo: 'success',
        titulo: 'Movimiento Confirmado',
        mensaje: `Kardex actualizado para ${data.producto_nombre}.`
      });

      await cargarDatos();
      return { success: true, mensaje: data.mensaje || 'Movimiento registrado correctamente.' };
    } catch (err: any) {
      return { success: false, mensaje: err.message || 'Error al ejecutar movimiento de stock.' };
    }
  };

  // Métricas calculadas en memoria
  const kpis = {
    totalProductos: productos.length,
    stockCritico: productos.filter(p => p.stock_actual === 0).length,
    stockBajo: productos.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length,
    totalUnidades: productos.reduce((acc, p) => acc + Number(p.stock_actual), 0),
    movimientosHoy: movimientos.length,
  };

  return (
    <StockContext.Provider
      value={{
        productos,
        categorias,
        movimientos,
        isLoading,
        isRealtimeConnected,
        categoriaSeleccionada,
        setCategoriaSeleccionada,
        busqueda,
        setBusqueda,
        soloStockBajo,
        setSoloStockBajo,
        toasts,
        removerToast,
        registrarMovimiento,
        recargarDatos: cargarDatos,
        kpis,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock debe ser utilizado dentro de un StockProvider');
  }
  return context;
};
