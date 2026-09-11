import React from 'react';
import { Package, AlertTriangle, ArrowUpDown, Boxes, AlertOctagon } from 'lucide-react';
import { useStock } from '../context/StockContext';

export const KpiMetrics: React.FC = () => {
  const { kpis, soloStockBajo, setSoloStockBajo } = useStock();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-6">
      {/* 1. Total SKUs */}
      <div className="bg-[#002B2E]/90 border border-[#018076]/70 hover:border-[#03BFB5] rounded-2xl p-4 lg:p-5 transition-all shadow-lg shadow-[#001E21]/60">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#949398] uppercase tracking-widest">Catálogo SKUs</span>
          <div className="p-2 rounded-xl bg-[#004146] text-[#03BFB5] border border-[#018076]">
            <Package className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl lg:text-3xl font-black font-mono-code text-[#EFF5F9] tracking-tight">
            {kpis.totalProductos}
          </span>
          <p className="text-xs text-[#949398] mt-1">Artículos registrados</p>
        </div>
      </div>

      {/* 2. Unidades Totales en Inventario */}
      <div className="bg-[#002B2E]/90 border border-[#018076]/70 hover:border-[#03BFB5] rounded-2xl p-4 lg:p-5 transition-all shadow-lg shadow-[#001E21]/60">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#949398] uppercase tracking-widest">Unidades Físicas</span>
          <div className="p-2 rounded-xl bg-[#004146] text-[#03BFB5] border border-[#018076]">
            <Boxes className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl lg:text-3xl font-black font-mono-code text-[#03BFB5] tracking-tight">
            {kpis.totalUnidades.toLocaleString()}
          </span>
          <p className="text-xs text-[#949398] mt-1">Existencias en almacén</p>
        </div>
      </div>

      {/* 3. Alertas de Stock */}
      <button
        onClick={() => setSoloStockBajo(!soloStockBajo)}
        className={`text-left rounded-2xl p-4 lg:p-5 border transition-all ${
          soloStockBajo
            ? 'bg-[#004146] border-[#03BFB5] shadow-lg shadow-[#03BFB5]/20 ring-1 ring-[#03BFB5]'
            : 'bg-[#002B2E]/90 border-[#018076]/70 hover:border-[#03BFB5]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#949398] uppercase tracking-widest">Alertas de Stock</span>
          <div className="p-2 rounded-xl bg-[#004146] text-[#03BFB5] border border-[#018076]">
            {kpis.stockCritico > 0 ? (
              <AlertOctagon className="w-4 h-4 lg:w-5 lg:h-5 text-[#03BFB5] animate-pulse" />
            ) : (
              <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-[#03BFB5]" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-black font-mono-code text-[#EFF5F9]">
            {kpis.stockBajo + kpis.stockCritico}
          </span>
          {kpis.stockCritico > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#004146] text-[#03BFB5] border border-[#03BFB5] uppercase tracking-wider">
              {kpis.stockCritico} Agotados
            </span>
          )}
        </div>
        <p className="text-xs text-[#949398] mt-1">
          {soloStockBajo ? '✓ Filtrando alertas (clic para quitar)' : 'Haz clic para filtrar alertas'}
        </p>
      </button>

      {/* 4. Kardex de Operaciones */}
      <div className="bg-[#002B2E]/90 border border-[#018076]/70 hover:border-[#03BFB5] rounded-2xl p-4 lg:p-5 transition-all shadow-lg shadow-[#001E21]/60">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#949398] uppercase tracking-widest">Kardex Inmutable</span>
          <div className="p-2 rounded-xl bg-[#004146] text-[#03BFB5] border border-[#018076]">
            <ArrowUpDown className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl lg:text-3xl font-black font-mono-code text-[#EFF5F9] tracking-tight">
            {kpis.movimientosHoy}
          </span>
          <p className="text-xs text-[#949398] mt-1">Transacciones asentadas</p>
        </div>
      </div>
    </div>
  );
};
