export type RolUsuario = 'admin' | 'supervisor' | 'operario' | 'auditor';

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste' | 'merma';

export interface Perfil {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  creado_en: string;
}

export interface Producto {
  id: string;
  sku: string;
  codigo_barras?: string;
  nombre: string;
  descripcion?: string;
  categoria_id?: string;
  categoria?: Categoria;
  stock_actual: number;
  stock_minimo: number;
  ubicacion_almacen: string;
  unidad_medida: string;
  precio_unitario?: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface MovimientoStock {
  id: string;
  producto_id: string;
  producto?: Producto;
  usuario_id: string;
  usuario?: Perfil;
  tipo: TipoMovimiento;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string;
  referencia_documento?: string;
  creado_en: string;
}

export interface RegistrarMovimientoDTO {
  p_producto_id: string;
  p_tipo: TipoMovimiento;
  p_cantidad: number;
  p_motivo: string;
  p_referencia_documento?: string;
}

export interface ResultadoMovimientoRPC {
  success: boolean;
  movimiento_id: string;
  producto_id: string;
  producto_nombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  mensaje: string;
}
