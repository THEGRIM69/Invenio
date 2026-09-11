import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  ArrowUpDown, 
  AlertTriangle, 
  CheckCircle2, 
  Barcode, 
  History,
  Boxes,
  Clock,
  UserCheck,
  Lock,
  Eye
} from 'lucide-react';
import { Producto } from '../types/database';
import { useStock } from '../context/StockContext';
import { useAuth } from '../context/AuthContext';

interface StockListProps {
  onSelectProducto: (producto: Producto) => void;
}

export const StockList: React.FC<StockListProps> = ({ onSelectProducto }) => {
  const { 
    productos, 
    categorias, 
    movimientos, 
    categoriaSeleccionada, 
    setCategoriaSeleccionada, 
    busqueda, 
    setBusqueda, 
    soloStockBajo
  } = useStock();
  const { canMoveStock, isAuditor } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalogo' | 'kardex'>('catalogo');

  // Filtrado de productos
  const productosFiltrados = productos.filter((p) => {
    const coincideCategoria = categoriaSeleccionada === 'todas' || p.categoria_id === categoriaSeleccionada;
    const query = busqueda.toLowerCase().trim();
    const coincideBusqueda = 
      !query ||
      p.sku.toLowerCase().includes(query) ||
      p.nombre.toLowerCase().includes(query) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(query)) ||
      p.ubicacion_almacen.toLowerCase().includes(query);
    const coincideAlerta = !soloStockBajo || p.stock_actual <= p.stock_minimo;

    return coincideCategoria && coincideBusqueda && coincideAlerta;
  });

  return (
    <div className="bg-[#002B2E]/90 border border-[#018076]/70 rounded-2xl overflow-hidden shadow-2xl">
      {/* Banner de Auditor */}
      {isAuditor && (
        <div className="bg-[#004146] border-b border-[#018076] px-4 py-2 flex items-center gap-2 text-xs text-[#EFF5F9] font-medium">
          <Eye className="w-4 h-4 text-[#03BFB5]" />
          <span>Perfil Activo: <strong className="text-[#03BFB5]">Auditor de Calidad</strong>. Dispones de visualización y trazabilidad completa del Kardex (Solo Lectura). Las operaciones de movimiento están bloqueadas.</span>
        </div>
      )}

      {/* Barra de Pestañas & Filtros */}
      <div className="p-4 lg:p-6 border-b border-[#018076]/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#001E21]/60">
        {/* Pestañas de Vista */}
        <div className="flex items-center bg-[#001E21] p-1 rounded-xl border border-[#018076]/50">
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'catalogo'
                ? 'bg-[#03BFB5] text-[#004146] shadow-md shadow-[#03BFB5]/30'
                : 'text-[#949398] hover:text-[#EFF5F9]'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Inventario ({productosFiltrados.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kardex')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'kardex'
                ? 'bg-[#03BFB5] text-[#004146] shadow-md shadow-[#03BFB5]/30'
                : 'text-[#949398] hover:text-[#EFF5F9]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Kardex Inmutable ({movimientos.length})</span>
          </button>
        </div>

        {/* Búsqueda y Filtros Rápidos (Solo en vista de catálogo) */}
        {activeTab === 'catalogo' && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Input de Búsqueda */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#949398] absolute left-3 top-3" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar SKU, código o ubicación..."
                className="w-full bg-[#001E21] border border-[#018076] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#EFF5F9] focus:outline-none focus:ring-2 focus:ring-[#03BFB5] focus:border-transparent placeholder:text-[#949398] font-mono-code transition-all"
              />
            </div>

            {/* Selector de Categoría */}
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="bg-[#001E21] border border-[#018076] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#EFF5F9] focus:outline-none focus:ring-2 focus:ring-[#03BFB5]"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ================= CONTENIDO: TAB 1 CATÁLOGO ================= */}
      {activeTab === 'catalogo' && (
        <>
          {/* VISTA DESKTOP: Tabla de Datos */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#001E21]/80 text-[#949398] text-[11px] font-bold uppercase tracking-widest border-b border-[#018076]/60">
                <tr>
                  <th className="px-6 py-3.5">SKU / Producto</th>
                  <th className="px-6 py-3.5">Categoría</th>
                  <th className="px-6 py-3.5">Ubicación</th>
                  <th className="px-6 py-3.5 text-center">Stock Actual</th>
                  <th className="px-6 py-3.5 text-center">Estado</th>
                  <th className="px-6 py-3.5 text-right">Operación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#004146]">
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#949398]">
                      No se encontraron artículos con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((producto) => {
                    const isZero = producto.stock_actual === 0;
                    const isLow = producto.stock_actual > 0 && producto.stock_actual <= producto.stock_minimo;

                    return (
                      <tr key={producto.id} className="hover:bg-[#004146]/50 transition-colors">
                        {/* SKU y Nombre */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono-code font-bold text-[#03BFB5] text-xs sm:text-sm">
                              {producto.sku}
                            </span>
                            <span className="font-semibold text-[#EFF5F9] text-sm">
                              {producto.nombre}
                            </span>
                            {producto.codigo_barras && (
                              <span className="flex items-center gap-1 text-[11px] text-[#949398] font-mono-code">
                                <Barcode className="w-3 h-3 text-[#949398]" />
                                {producto.codigo_barras}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="px-6 py-4 text-[#EFF5F9] text-xs">
                          <span className="px-2.5 py-1 rounded-md bg-[#004146] border border-[#018076] text-[#EFF5F9] font-medium">
                            {producto.categoria?.nombre || 'General'}
                          </span>
                        </td>

                        {/* Ubicación */}
                        <td className="px-6 py-4 text-[#EFF5F9] text-xs">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#03BFB5]" />
                            <span>{producto.ubicacion_almacen}</span>
                          </div>
                        </td>

                        {/* Stock Numérico */}
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono-code font-bold text-base text-[#EFF5F9]">
                            {producto.stock_actual}
                          </span>
                          <span className="text-xs text-[#949398] ml-1">
                            {producto.unidad_medida}
                          </span>
                          <div className="text-[11px] text-[#949398] font-mono-code">
                            Mín: {producto.stock_minimo}
                          </div>
                        </td>

                        {/* Badge de Estado con los Colores Oficiales */}
                        <td className="px-6 py-4 text-center">
                          {isZero ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#004146] text-[#949398] border border-[#949398]">
                              <AlertTriangle className="w-3 h-3 text-[#949398]" /> Agotado
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#018076]/40 text-[#EFF5F9] border border-[#018076]">
                              <AlertTriangle className="w-3 h-3 text-[#03BFB5]" /> Stock Bajo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#004146] text-[#03BFB5] border border-[#03BFB5]">
                              <CheckCircle2 className="w-3 h-3 text-[#03BFB5]" /> Óptimo
                            </span>
                          )}
                        </td>

                        {/* Botón de Operación */}
                        <td className="px-6 py-4 text-right">
                          {canMoveStock ? (
                            <button
                              onClick={() => onSelectProducto(producto)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#018076] hover:bg-[#03BFB5] text-[#EFF5F9] hover:text-[#004146] text-xs font-bold border border-[#03BFB5]/50 transition-all shadow-sm"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                              <span>Mover Stock</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-[#949398] italic">
                              <Lock className="w-3 h-3" /> Solo lectura
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* VISTA MOBILE / TABLET: Tarjetas */}
          <div className="lg:hidden divide-y divide-[#004146]">
            {productosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-[#949398] text-sm">
                No se encontraron artículos con los filtros aplicados.
              </div>
            ) : (
              productosFiltrados.map((producto) => {
                const isZero = producto.stock_actual === 0;
                const isLow = producto.stock_actual > 0 && producto.stock_actual <= producto.stock_minimo;

                return (
                  <div key={producto.id} className="p-4 space-y-3 bg-[#002B2E]/60 hover:bg-[#002B2E] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono-code font-bold text-[#03BFB5] text-xs block">
                          {producto.sku}
                        </span>
                        <h3 className="font-bold text-[#EFF5F9] text-base leading-snug">
                          {producto.nombre}
                        </h3>
                      </div>

                      {/* Estado */}
                      {isZero ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#004146] text-[#949398] border border-[#949398] uppercase">
                          Agotado
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#018076]/40 text-[#EFF5F9] border border-[#018076] uppercase">
                          Bajo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#004146] text-[#03BFB5] border border-[#03BFB5] uppercase">
                          Óptimo
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#949398]">
                      <span className="flex items-center gap-1 bg-[#001E21] px-2 py-1 rounded-md border border-[#018076] text-[#EFF5F9]">
                        <MapPin className="w-3 h-3 text-[#03BFB5]" />
                        {producto.ubicacion_almacen}
                      </span>
                      <span className="bg-[#001E21] px-2 py-1 rounded-md border border-[#018076] text-[#EFF5F9]">
                        {producto.categoria?.nombre || 'General'}
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-4 border-t border-[#004146]">
                      <div>
                        <span className="text-[10px] text-[#949398] uppercase tracking-widest block">Existencias</span>
                        <span className="text-xl font-bold font-mono-code text-[#EFF5F9]">
                          {producto.stock_actual}
                        </span>
                        <span className="text-xs text-[#949398] ml-1">
                          {producto.unidad_medida} (Mín: {producto.stock_minimo})
                        </span>
                      </div>

                      {canMoveStock ? (
                        <button
                          onClick={() => onSelectProducto(producto)}
                          className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#03BFB5] hover:bg-[#018076] text-[#004146] hover:text-[#EFF5F9] text-sm font-black shadow-md shadow-[#03BFB5]/30 transition-all"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                          <span>Mover Stock</span>
                        </button>
                      ) : (
                        <span className="text-xs text-[#949398] flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Modo Auditor
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ================= CONTENIDO: TAB 2 KARDEX INMUTABLE ================= */}
      {activeTab === 'kardex' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#001E21]/80 text-[#949398] text-[11px] font-bold uppercase tracking-widest border-b border-[#018076]/60">
              <tr>
                <th className="px-6 py-3.5">Fecha / Hora</th>
                <th className="px-6 py-3.5">Tipo</th>
                <th className="px-6 py-3.5">Artículo</th>
                <th className="px-6 py-3.5 text-center">Cantidad</th>
                <th className="px-6 py-3.5 text-center">Balance Stock</th>
                <th className="px-6 py-3.5">Motivo / Ref</th>
                <th className="px-6 py-3.5">Operario / Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#004146]">
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#949398]">
                    No se han registrado movimientos de inventario todavía.
                  </td>
                </tr>
              ) : (
                movimientos.map((mov) => {
                  const esEntrada = mov.tipo === 'entrada';
                  const esSalida = mov.tipo === 'salida' || mov.tipo === 'merma';

                  return (
                    <tr key={mov.id} className="hover:bg-[#004146]/50 transition-colors">
                      <td className="px-6 py-4 font-mono-code text-xs text-[#949398] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#03BFB5]" />
                          {new Date(mov.creado_en).toLocaleString('es-ES', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                          esEntrada
                            ? 'bg-[#004146] text-[#03BFB5] border border-[#03BFB5]'
                            : esSalida
                            ? 'bg-[#018076]/40 text-[#EFF5F9] border border-[#018076]'
                            : 'bg-[#949398]/20 text-[#EFF5F9] border border-[#949398]'
                        }`}>
                          {mov.tipo}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#EFF5F9] text-sm">
                          {mov.producto?.nombre || 'Artículo de Almacén'}
                        </div>
                        <div className="font-mono-code text-xs text-[#03BFB5]">
                          {mov.producto?.sku}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center font-mono-code font-bold text-sm">
                        <span className={esEntrada ? 'text-[#03BFB5]' : 'text-[#EFF5F9]'}>
                          {esEntrada ? '+' : esSalida ? '-' : ''}{mov.cantidad}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center font-mono-code text-xs text-[#EFF5F9] whitespace-nowrap">
                        <span className="text-[#949398]">{mov.stock_anterior}</span>
                        <span className="mx-1 text-[#03BFB5]">&bull;</span>
                        <strong className="text-[#03BFB5] font-bold">{mov.stock_nuevo}</strong>
                      </td>

                      <td className="px-6 py-4 text-xs text-[#EFF5F9] max-w-xs">
                        <p className="truncate font-medium">{mov.motivo}</p>
                        {mov.referencia_documento && (
                          <span className="font-mono-code text-[#949398] text-[11px] block">
                            Ref: {mov.referencia_documento}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-[#949398] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#03BFB5]" />
                          <span className="text-[#EFF5F9] font-medium">{mov.usuario?.nombre || 'Operador'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
