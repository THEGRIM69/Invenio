import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Sliders, Trash2, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { Producto, TipoMovimiento } from '../types/database';
import { useStock } from '../context/StockContext';
import { useAuth } from '../context/AuthContext';

interface MovementModalProps {
  producto: Producto | null;
  onClose: () => void;
}

export const MovementModal: React.FC<MovementModalProps> = ({ producto, onClose }) => {
  const { registrarMovimiento } = useStock();
  const { canAdjustStock, canMoveStock } = useAuth();
  const [tipo, setTipo] = useState<TipoMovimiento>('entrada');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [referencia, setReferencia] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!producto || !canMoveStock) return null;

  // Cálculo proyectado
  const numCantidad = Number(cantidad) || 0;
  let projectedStock = producto.stock_actual;
  if (tipo === 'entrada') projectedStock += numCantidad;
  else if (tipo === 'salida' || tipo === 'merma') projectedStock -= numCantidad;
  else if (tipo === 'ajuste') projectedStock = numCantidad;

  const isInsufficient = (tipo === 'salida' || tipo === 'merma') && numCantidad > producto.stock_actual;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (numCantidad <= 0) {
      setErrorMsg('La cantidad debe ser mayor a cero.');
      return;
    }

    if (isInsufficient) {
      setErrorMsg(`Telemetría: Stock insuficiente. Existencias: ${producto.stock_actual} ${producto.unidad_medida}`);
      return;
    }

    if (tipo === 'ajuste' && !canAdjustStock) {
      setErrorMsg('Permisos insuficientes: Solo Administradores y Supervisores pueden realizar ajustes directos.');
      return;
    }

    if (!motivo.trim()) {
      setErrorMsg('Debes especificar un motivo obligatorio para el Kardex.');
      return;
    }

    setIsSubmitting(true);
    const res = await registrarMovimiento({
      producto_id: producto.id,
      p_tipo: tipo,
      p_cantidad: numCantidad,
      p_motivo: motivo.trim(),
      p_referencia_documento: referencia.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.mensaje);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001E21]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#002B2E] border border-[#018076] rounded-2xl shadow-2xl overflow-hidden">
        {/* Barra superior con gradiente de los colores oficiales */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#004146] via-[#018076] to-[#03BFB5]"></div>

        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#018076]/60 bg-[#001E21]/60">
          <div>
            <h2 className="text-lg font-black text-[#EFF5F9] flex items-center gap-2">
              <span>Operación de Almacén</span>
              <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded bg-[#004146] text-[#03BFB5] border border-[#018076] uppercase">
                Pit Stop
              </span>
            </h2>
            <p className="text-xs text-[#949398] font-mono-code mt-0.5">
              SKU: <strong className="text-[#03BFB5]">{producto.sku}</strong> &bull; <span className="text-[#EFF5F9]">{producto.nombre}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#949398] hover:text-[#EFF5F9] hover:bg-[#004146] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Selector de Tipo de Movimiento */}
          <div>
            <label className="block text-[11px] font-bold text-[#949398] uppercase tracking-widest mb-2">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Entrada */}
              <button
                type="button"
                onClick={() => setTipo('entrada')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                  tipo === 'entrada'
                    ? 'bg-[#004146] border-[#03BFB5] text-[#03BFB5] shadow-sm shadow-[#03BFB5]/30'
                    : 'bg-[#001E21] border-[#018076]/60 text-[#949398] hover:text-[#EFF5F9]'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-[#03BFB5]" />
                <span>Entrada</span>
              </button>

              {/* Salida */}
              <button
                type="button"
                onClick={() => setTipo('salida')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                  tipo === 'salida'
                    ? 'bg-[#018076] border-[#03BFB5] text-[#EFF5F9] shadow-sm'
                    : 'bg-[#001E21] border-[#018076]/60 text-[#949398] hover:text-[#EFF5F9]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-[#03BFB5]" />
                <span>Salida</span>
              </button>

              {/* Ajuste (Restringido a Admin y Supervisor) */}
              <button
                type="button"
                onClick={() => canAdjustStock && setTipo('ajuste')}
                disabled={!canAdjustStock}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                  !canAdjustStock
                    ? 'opacity-40 cursor-not-allowed bg-[#001E21] border-[#004146] text-[#949398]'
                    : tipo === 'ajuste'
                    ? 'bg-[#004146] border-[#018076] text-[#EFF5F9] shadow-sm'
                    : 'bg-[#001E21] border-[#018076]/60 text-[#949398] hover:text-[#EFF5F9]'
                }`}
                title={!canAdjustStock ? 'Solo Administradores y Supervisores pueden ajustar stock' : ''}
              >
                {!canAdjustStock && (
                  <Lock className="w-3 h-3 text-[#949398] absolute top-1.5 right-1.5" />
                )}
                <Sliders className="w-4 h-4 text-[#03BFB5]" />
                <span>Ajuste</span>
              </button>

              {/* Merma */}
              <button
                type="button"
                onClick={() => setTipo('merma')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                  tipo === 'merma'
                    ? 'bg-[#004146] border-[#949398] text-[#EFF5F9]'
                    : 'bg-[#001E21] border-[#018076]/60 text-[#949398] hover:text-[#EFF5F9]'
                }`}
              >
                <Trash2 className="w-4 h-4 text-[#949398]" />
                <span>Merma</span>
              </button>
            </div>
          </div>

          {/* Comparativa Visual de Stock */}
          <div className="bg-[#001E21] border border-[#018076] rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-[#949398] block text-[10px] uppercase font-bold tracking-wider">Existencias Actuales</span>
              <span className="text-base font-extrabold font-mono-code text-[#EFF5F9]">
                {producto.stock_actual} {producto.unidad_medida}
              </span>
            </div>
            <div className="text-[#03BFB5] font-bold font-mono-code text-base">➔</div>
            <div className="text-right">
              <span className="text-[#949398] block text-[10px] uppercase font-bold tracking-wider">
                {tipo === 'ajuste' ? 'Nuevo Saldo Físico' : 'Saldo Resultante'}
              </span>
              <span className={`text-base font-extrabold font-mono-code ${
                projectedStock < 0 || isInsufficient ? 'text-[#949398]' : 'text-[#03BFB5]'
              }`}>
                {projectedStock} {producto.unidad_medida}
              </span>
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-[11px] font-bold text-[#949398] uppercase tracking-widest mb-1.5">
              {tipo === 'ajuste' ? 'Cantidad de Conteo Físico' : 'Cantidad a Desplazar'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="any"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder={`0.00 (${producto.unidad_medida})`}
                required
                className="w-full bg-[#001E21] border border-[#018076] rounded-xl px-4 py-3 text-[#EFF5F9] text-base font-mono-code focus:outline-none focus:ring-2 focus:ring-[#03BFB5] focus:border-transparent transition-all"
              />
              <span className="absolute right-4 top-3.5 text-xs text-[#949398] font-bold uppercase font-mono-code">
                {producto.unidad_medida}
              </span>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-[11px] font-bold text-[#949398] uppercase tracking-widest mb-1.5">
              Motivo de Operación <span className="text-[#03BFB5]">*</span>
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Recepción proveedor, Despacho a línea, Conteo mensual..."
              required
              className="w-full bg-[#001E21] border border-[#018076] rounded-xl px-4 py-2.5 text-sm text-[#EFF5F9] focus:outline-none focus:ring-2 focus:ring-[#03BFB5] focus:border-transparent transition-all placeholder:text-[#949398]"
            />
          </div>

          {/* Referencia de Documento */}
          <div>
            <label className="block text-[11px] font-bold text-[#949398] uppercase tracking-widest mb-1.5">
              Referencia / Documento (Opcional)
            </label>
            <input
              type="text"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: FAC-9902, GUIA-104, REM-881"
              className="w-full bg-[#001E21] border border-[#018076] rounded-xl px-4 py-2.5 text-sm text-[#EFF5F9] focus:outline-none focus:ring-2 focus:ring-[#03BFB5] focus:border-transparent transition-all placeholder:text-[#949398]"
            />
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#004146] border border-[#018076] text-[#EFF5F9] text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#03BFB5]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#018076] text-[#949398] hover:text-[#EFF5F9] hover:bg-[#004146] text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInsufficient || numCantidad <= 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#03BFB5] hover:bg-[#018076] disabled:opacity-40 disabled:cursor-not-allowed text-[#004146] hover:text-[#EFF5F9] text-sm font-black shadow-md shadow-[#03BFB5]/30 transition-all tracking-wide"
            >
              {isSubmitting ? (
                <span>Asentando Kardex...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirmar Movimiento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
