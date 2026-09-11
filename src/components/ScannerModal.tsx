import React, { useState } from 'react';
import { X, Barcode, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { useStock } from '../context/StockContext';
import { Producto } from '../types/database';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProducto: (producto: Producto) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onSelectProducto }) => {
  const { productos } = useStock();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const query = code.trim().toLowerCase();
    if (!query) return;

    const found = productos.find(
      (p) => p.sku.toLowerCase() === query || (p.codigo_barras && p.codigo_barras.toLowerCase() === query)
    );

    if (found) {
      onSelectProducto(found);
      onClose();
    } else {
      setErrorMsg(`Telemetría: No se localizó ningún artículo con SKU o código "${code}".`);
    }
  };

  const handleQuickCode = (sampleCode: string) => {
    setCode(sampleCode);
    const found = productos.find(
      (p) => p.sku.toLowerCase() === sampleCode.toLowerCase() || p.codigo_barras === sampleCode
    );
    if (found) {
      onSelectProducto(found);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001E21]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#002B2E] border border-[#018076] rounded-2xl shadow-2xl overflow-hidden">
        {/* Borde superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#004146] via-[#018076] to-[#03BFB5]"></div>

        {/* Header */}
        <div className="p-6 border-b border-[#018076]/60 bg-[#001E21]/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#03BFB5]">
            <Barcode className="w-6 h-6" />
            <h2 className="text-lg font-black text-[#EFF5F9] tracking-wide">Escáner de Almacén</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#949398] hover:text-[#EFF5F9] hover:bg-[#004146] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-[#949398]">
            Dispositivos PDA o pistolas láser transmiten lecturas por emulación de teclado. Ingresa o escanea el código del producto.
          </p>

          <form onSubmit={handleScan} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Escanea código de barras o SKU..."
                className="w-full bg-[#001E21] border-2 border-[#03BFB5] rounded-xl px-4 py-3 text-[#EFF5F9] text-base font-mono-code focus:outline-none shadow-md shadow-[#03BFB5]/20 transition-all placeholder:text-[#949398]"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#004146] border border-[#018076] text-[#EFF5F9] text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#03BFB5]" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#03BFB5] hover:bg-[#018076] text-[#004146] hover:text-[#EFF5F9] text-sm font-black shadow-md shadow-[#03BFB5]/30 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Localizar en Inventario</span>
            </button>
          </form>

          {/* Códigos de Prueba Rápidos */}
          <div className="pt-3 border-t border-[#018076]/40">
            <span className="block text-[10px] font-bold text-[#949398] uppercase tracking-widest mb-2">
              Códigos de Telemetría Rápida
            </span>
            <div className="space-y-1.5">
              {productos.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickCode(p.sku)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#001E21] hover:bg-[#004146] border border-[#018076]/60 hover:border-[#03BFB5] text-xs text-left transition-colors group"
                >
                  <div>
                    <span className="font-mono-code font-bold text-[#03BFB5] block">{p.sku}</span>
                    <span className="text-[#EFF5F9] truncate block max-w-[240px] font-medium">{p.nombre}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#949398] group-hover:text-[#03BFB5] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
