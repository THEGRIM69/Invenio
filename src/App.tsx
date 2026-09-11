import React, { useState } from 'react';
import { Header } from './components/Header';
import { SupabaseBanner } from './components/SupabaseBanner';
import { KpiMetrics } from './components/KpiMetrics';
import { StockList } from './components/StockList';
import { MovementModal } from './components/MovementModal';
import { LoginModal } from './components/LoginModal';
import { ScannerModal } from './components/ScannerModal';
import { ToastContainer } from './components/ToastContainer';
import { Producto } from './types/database';
import { useStock } from './context/StockContext';
import { useAuth } from './context/AuthContext';
import { Barcode, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { recargarDatos, isLoading } = useStock();
  const { rol } = useAuth();

  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#001E21] text-[#EFF5F9] flex flex-col selection:bg-[#03BFB5] selection:text-[#004146]">
      {/* 1. Barra de Navegación */}
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {/* 2. Banner de Información */}
      <SupabaseBanner />

      {/* 3. Contenedor Principal Responsive */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Barra Superior de Operaciones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#EFF5F9] tracking-tight flex items-center gap-2">
                <span>Control de Inventario y Operaciones</span>
              </h2>
              <span className="hidden md:inline-block px-2.5 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#004146] text-[#03BFB5] border border-[#018076] uppercase">
                Rol: {rol}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#949398] mt-0.5">
              Trazabilidad inmutable de almacén sincronizada en tiempo real.
            </p>
          </div>

          {/* Botones de Acción Inmediata */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botón Escanear Código */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#002B2E] hover:bg-[#004146] text-[#03BFB5] text-xs sm:text-sm font-bold border border-[#018076] hover:border-[#03BFB5] transition-all shadow-sm shadow-[#03BFB5]/10"
            >
              <Barcode className="w-4 h-4 text-[#03BFB5]" />
              <span>Escanear Código</span>
            </button>

            {/* Refrescar Datos */}
            <button
              onClick={() => recargarDatos()}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-[#002B2E] hover:bg-[#004146] text-[#949398] hover:text-[#03BFB5] border border-[#018076] transition-colors disabled:opacity-50"
              title="Refrescar inventario"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#03BFB5]' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4. Tarjetas KPI de Estado de Almacén */}
        <KpiMetrics />

        {/* 5. Vista de Productos y Kardex (Responsive Desktop Table / Mobile Touch Cards) */}
        <StockList onSelectProducto={(p) => setSelectedProducto(p)} />
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-[#004146] bg-[#001E21] py-4 px-4 text-center text-xs text-[#949398]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono-code text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#03BFB5]"></span>
            <span className="text-[#EFF5F9] font-bold">Invenio Logistics &bull; PostgreSQL Zero-Trust</span>
          </span>
          <span className="flex items-center gap-2">
            <span>Paleta Oficial:</span>
            <span className="inline-block w-3 h-3 rounded-full bg-[#004146] border border-[#018076]" title="#004146"></span>
            <span className="inline-block w-3 h-3 rounded-full bg-[#018076]" title="#018076"></span>
            <span className="inline-block w-3 h-3 rounded-full bg-[#03BFB5]" title="#03BFB5"></span>
            <span className="inline-block w-3 h-3 rounded-full bg-[#949398]" title="#949398"></span>
            <span className="inline-block w-3 h-3 rounded-full bg-[#EFF5F9] border border-[#949398]" title="#EFF5F9"></span>
          </span>
        </div>
      </footer>

      {/* 7. Modales de Acción y Diálogos */}
      <MovementModal
        producto={selectedProducto}
        onClose={() => setSelectedProducto(null)}
      />

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectProducto={(p) => setSelectedProducto(p)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* 8. Contenedor de Notificaciones en Tiempo Real (Toasts) */}
      <ToastContainer />
    </div>
  );
};
