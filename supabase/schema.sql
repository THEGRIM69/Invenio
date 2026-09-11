-- ==============================================================================
-- INVENIO: SISTEMA INTEGRAL DE CONTROL DE STOCK Y GESTIÓN DE ALMACÉN EN TIEMPO REAL
-- PLATAFORMA: SUPABASE / POSTGRESQL 15+
-- ARQUITECTURA: CIBERSEGURIDAD ZERO-TRUST, ROW LEVEL SECURITY (RLS) Y KARDEX INMUTABLE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONES Y CONFIGURACIÓN INICIAL
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TIPOS PERSONALIZADOS (ENUMS)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('admin', 'supervisor', 'operario', 'auditor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_movimiento AS ENUM ('entrada', 'salida', 'ajuste', 'merma');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. TABLA: perfiles (Extensión de auth.users de Supabase con RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'operario',
    telefono TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.perfiles IS 'Perfiles de usuario extendidos desde Supabase Auth con asignación de roles (admin/operario).';

-- ------------------------------------------------------------------------------
-- 4. TABLA: categorias (Clasificación de productos en almacén)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.categorias IS 'Categorías de almacenamiento (ej. Componentes, Embalajes, Herramientas, EPP).';

-- ------------------------------------------------------------------------------
-- 5. TABLA: productos (Maestro de artículos de inventario)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    codigo_barras TEXT UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    stock_actual NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_minimo NUMERIC(12, 2) NOT NULL DEFAULT 5.00,
    ubicacion_almacen TEXT NOT NULL DEFAULT 'RECEPCIÓN', -- Ej: Pasillo A, Estantería 2, Nivel 1
    unidad_medida TEXT NOT NULL DEFAULT 'UNIDAD',        -- Ej: UNIDAD, KG, LITRO, CAJA, PACK
    precio_unitario NUMERIC(12, 2) DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Integridad a nivel de Base de Datos (Restricciones estrictas)
    CONSTRAINT check_stock_no_negativo CHECK (stock_actual >= 0),
    CONSTRAINT check_stock_minimo_no_negativo CHECK (stock_minimo >= 0),
    CONSTRAINT check_precio_no_negativo CHECK (precio_unitario >= 0)
);

COMMENT ON TABLE public.productos IS 'Maestro de productos de almacén con control estricto de no-negatividad y stock de seguridad.';

-- ------------------------------------------------------------------------------
-- 6. TABLA: movimientos_stock (KARDEX INMUTABLE / AUDITORÍA FORENSE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
    tipo tipo_movimiento NOT NULL,
    cantidad NUMERIC(12, 2) NOT NULL CHECK (cantidad > 0),
    stock_anterior NUMERIC(12, 2) NOT NULL,
    stock_nuevo NUMERIC(12, 2) NOT NULL,
    motivo TEXT NOT NULL,
    referencia_documento TEXT, -- Ej: Factura #1204, Orden de Despacho #884, Guía de Remisión
    creado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.movimientos_stock IS 'Kardex inmutable. Registro histórico auditable de todo movimiento de inventario. NO se permite UPDATE ni DELETE.';

-- ------------------------------------------------------------------------------
-- 7. ÍNDICES DE ALTO RENDIMIENTO
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON public.perfiles(rol);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON public.productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON public.productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_stock_alerta ON public.productos(stock_actual, stock_minimo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON public.movimientos_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON public.movimientos_stock(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_creado_en ON public.movimientos_stock(creado_en DESC);

-- ------------------------------------------------------------------------------
-- 8. VISTAS ANALÍTICAS DE ALMACÉN
-- ------------------------------------------------------------------------------

-- Vista 8.1: Alertas de Stock Crítico y Mínimo
CREATE OR REPLACE VIEW public.vista_alertas_stock AS
SELECT 
    p.id,
    p.sku,
    p.codigo_barras,
    p.nombre,
    c.nombre AS categoria,
    p.ubicacion_almacen,
    p.stock_actual,
    p.stock_minimo,
    p.unidad_medida,
    (p.stock_minimo - p.stock_actual) AS deficit_reabastecimiento,
    CASE 
        WHEN p.stock_actual = 0 THEN 'AGOTADO'
        WHEN p.stock_actual <= p.stock_minimo THEN 'STOCK_BAJO'
        ELSE 'OPTIMO'
    END AS estado_alerta
FROM public.productos p
LEFT JOIN public.categorias c ON p.categoria_id = c.id
WHERE p.activo = true AND p.stock_actual <= p.stock_minimo
ORDER BY p.stock_actual ASC;

-- Vista 8.2: Kardex Detallado con Nombres de Artículos y Operarios
CREATE OR REPLACE VIEW public.vista_kardex_detallado AS
SELECT 
    m.id AS movimiento_id,
    m.creado_en AS fecha_hora,
    m.tipo,
    p.sku,
    p.nombre AS producto_nombre,
    p.unidad_medida,
    m.cantidad,
    m.stock_anterior,
    m.stock_nuevo,
    m.motivo,
    m.referencia_documento,
    u.nombre AS operario_nombre,
    u.email AS operario_email,
    u.rol AS operario_rol
FROM public.movimientos_stock m
JOIN public.productos p ON m.producto_id = p.id
JOIN public.perfiles u ON m.usuario_id = u.id
ORDER BY m.creado_en DESC;

-- ------------------------------------------------------------------------------
-- 9. FUNCIONES DE CIBERSEGURIDAD Y TRIGGERS DE BASE DE DATOS
-- ------------------------------------------------------------------------------

-- 9.1: Validar si el usuario actual posee rol 'admin' (Acceso Total)
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE id = auth.uid() AND rol = 'admin' AND activo = true
    );
END;
$$;

-- 9.2: Validar si el usuario es supervisor o admin
CREATE OR REPLACE FUNCTION public.es_supervisor_o_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE id = auth.uid() AND rol IN ('admin', 'supervisor') AND activo = true
    );
END;
$$;

-- 9.3: Validar si el usuario tiene permiso para mover stock (Admin, Supervisor u Operario; Auditor es Solo Lectura)
CREATE OR REPLACE FUNCTION public.puede_mover_stock()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE id = auth.uid() AND rol IN ('admin', 'supervisor', 'operario') AND activo = true
    );
END;
$$;

-- 9.2: Trigger automático para crear perfil cuando un usuario se registra en auth.users
CREATE OR REPLACE FUNCTION public.manejar_nuevo_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    conteo_usuarios INT;
    rol_asignado rol_usuario;
BEGIN
    -- Si es el primer usuario registrado en todo el sistema, asignarle rol 'admin' automáticamente
    SELECT COUNT(*) INTO conteo_usuarios FROM public.perfiles;
    IF conteo_usuarios = 0 THEN
        rol_asignado := 'admin';
    ELSE
        rol_asignado := COALESCE(
            (NEW.raw_user_meta_data->>'rol')::rol_usuario,
            'operario'
        );
    END IF;

    INSERT INTO public.perfiles (id, nombre, email, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        NEW.email,
        rol_asignado
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;
CREATE TRIGGER tr_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.manejar_nuevo_usuario();

-- 9.3: Actualización automática de timestamp 'actualizado_en'
CREATE OR REPLACE FUNCTION public.actualizar_timestamp_modificado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.actualizado_en = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_productos_timestamp ON public.productos;
CREATE TRIGGER tr_productos_timestamp
    BEFORE UPDATE ON public.productos
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_timestamp_modificado();

DROP TRIGGER IF EXISTS tr_perfiles_timestamp ON public.perfiles;
CREATE TRIGGER tr_perfiles_timestamp
    BEFORE UPDATE ON public.perfiles
    FOR EACH ROW
    EXECUTE FUNCTION public.actualizar_timestamp_modificado();

-- ------------------------------------------------------------------------------
-- 10. PROCEDIMIENTO ATÓMICO TRANSACCIONAL ACID (RPC: registrar_movimiento)
-- ------------------------------------------------------------------------------
-- Bloquea la fila del producto (FOR UPDATE) eliminando cualquier condición de carrera (Race Condition)
CREATE OR REPLACE FUNCTION public.registrar_movimiento(
    p_producto_id UUID,
    p_tipo tipo_movimiento,
    p_cantidad NUMERIC,
    p_motivo TEXT,
    p_referencia_documento TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario_id UUID;
    v_stock_anterior NUMERIC(12, 2);
    v_stock_nuevo NUMERIC(12, 2);
    v_movimiento_id UUID;
    v_producto_nombre TEXT;
    v_activo BOOLEAN;
BEGIN
    -- 1. Validar autenticación con token JWT y permiso de rol
    v_usuario_id := auth.uid();
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado: Se requiere un token JWT de usuario autenticado.' USING ERRCODE = '42501';
    END IF;

    IF NOT public.puede_mover_stock() THEN
        RAISE EXCEPTION 'Acceso denegado: Tu rol actual (ej. Auditor) no tiene autorización para asentar movimientos de stock.' USING ERRCODE = '42501';
    END IF;

    -- 2. Validar que solo Admin o Supervisor puedan realizar ajustes de inventario
    IF p_tipo = 'ajuste' AND NOT public.es_supervisor_o_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: Solo Administradores y Supervisores pueden realizar ajustes directos de inventario.' USING ERRCODE = '42501';
    END IF;

    -- 3. Validar cantidad mayor a cero
    IF p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser un valor numérico estrictamente positivo.' USING ERRCODE = '22003';
    END IF;

    -- 3. Validar motivo obligatorio por auditoría
    IF p_motivo IS NULL OR trim(p_motivo) = '' THEN
        RAISE EXCEPTION 'Es obligatorio especificar un motivo para registrar el movimiento en el Kardex.' USING ERRCODE = '23502';
    END IF;

    -- 4. Bloqueo pesimista de fila para asegurar atomicidad ACID (FOR UPDATE)
    SELECT nombre, stock_actual, activo
    INTO v_producto_nombre, v_stock_anterior, v_activo
    FROM public.productos
    WHERE id = p_producto_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El producto solicitado no existe en el catálogo.' USING ERRCODE = 'P0002';
    END IF;

    IF v_activo IS FALSE THEN
        RAISE EXCEPTION 'No se pueden registrar movimientos en un producto desactivado.' USING ERRCODE = '22000';
    END IF;

    -- 5. Cálculo del nuevo saldo de stock
    IF p_tipo = 'entrada' THEN
        v_stock_nuevo := v_stock_anterior + p_cantidad;
    ELSIF p_tipo IN ('salida', 'merma') THEN
        IF v_stock_anterior < p_cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para % (Artículo: %). Stock actual disponible: %, Solicitado: %',
                p_tipo, v_producto_nombre, v_stock_anterior, p_cantidad
                USING ERRCODE = '23514';
        END IF;
        v_stock_nuevo := v_stock_anterior - p_cantidad;
    ELSIF p_tipo = 'ajuste' THEN
        v_stock_nuevo := p_cantidad;
    ELSE
        RAISE EXCEPTION 'Tipo de movimiento no reconocido: %', p_tipo USING ERRCODE = '22023';
    END IF;

    -- 6. Actualizar stock del producto
    UPDATE public.productos
    SET stock_actual = v_stock_nuevo
    WHERE id = p_producto_id;

    -- 7. Asentar registro inmutable en el Kardex
    INSERT INTO public.movimientos_stock (
        producto_id,
        usuario_id,
        tipo,
        cantidad,
        stock_anterior,
        stock_nuevo,
        motivo,
        referencia_documento
    )
    VALUES (
        p_producto_id,
        v_usuario_id,
        p_tipo,
        p_cantidad,
        v_stock_anterior,
        v_stock_nuevo,
        trim(p_motivo),
        nullif(trim(p_referencia_documento), '')
    )
    RETURNING id INTO v_movimiento_id;

    -- 8. Retornar confirmación
    RETURN jsonb_build_object(
        'success', true,
        'movimiento_id', v_movimiento_id,
        'producto_id', p_producto_id,
        'producto_nombre', v_producto_nombre,
        'tipo', p_tipo,
        'cantidad', p_cantidad,
        'stock_anterior', v_stock_anterior,
        'stock_nuevo', v_stock_nuevo,
        'mensaje', 'Movimiento registrado con éxito en el Kardex.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. FUNCIÓN ANALÍTICA DE RESUMEN DE ALMACÉN (RPC: obtener_resumen_kpis)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obtener_resumen_kpis()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_skus INT;
    v_total_unidades NUMERIC(14, 2);
    v_stock_critico INT;
    v_stock_bajo INT;
    v_movimientos_hoy INT;
BEGIN
    SELECT COUNT(*), COALESCE(SUM(stock_actual), 0)
    INTO v_total_skus, v_total_unidades
    FROM public.productos
    WHERE activo = true;

    SELECT COUNT(*) INTO v_stock_critico
    FROM public.productos
    WHERE activo = true AND stock_actual = 0;

    SELECT COUNT(*) INTO v_stock_bajo
    FROM public.productos
    WHERE activo = true AND stock_actual > 0 AND stock_actual <= stock_minimo;

    SELECT COUNT(*) INTO v_movimientos_hoy
    FROM public.movimientos_stock
    WHERE creado_en >= date_trunc('day', timezone('utc'::text, now()));

    RETURN jsonb_build_object(
        'total_skus', v_total_skus,
        'total_unidades', v_total_unidades,
        'stock_critico', v_stock_critico,
        'stock_bajo', v_stock_bajo,
        'movimientos_hoy', v_movimientos_hoy
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 12. CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS) ZERO-TRUST
-- ------------------------------------------------------------------------------

-- Habilitar RLS en el 100% de las tablas
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;

-- 12.1: Políticas para perfiles
CREATE POLICY "perfiles_select_propio_o_admin"
    ON public.perfiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.es_admin());

CREATE POLICY "perfiles_update_propio"
    ON public.perfiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.es_admin())
    WITH CHECK (
        CASE
            WHEN public.es_admin() THEN true
            ELSE (id = auth.uid() AND rol = (SELECT rol FROM public.perfiles WHERE id = auth.uid()))
        END
    );

-- 12.2: Políticas para categorias
CREATE POLICY "categorias_select_autenticado"
    ON public.categorias
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "categorias_insert_admin"
    ON public.categorias
    FOR INSERT
    TO authenticated
    WITH CHECK (public.es_admin());

CREATE POLICY "categorias_update_admin"
    ON public.categorias
    FOR UPDATE
    TO authenticated
    USING (public.es_admin());

CREATE POLICY "categorias_delete_admin"
    ON public.categorias
    FOR DELETE
    TO authenticated
    USING (public.es_admin());

-- 12.3: Políticas para productos
CREATE POLICY "productos_select_autenticado"
    ON public.productos
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "productos_insert_admin"
    ON public.productos
    FOR INSERT
    TO authenticated
    WITH CHECK (public.es_admin());

CREATE POLICY "productos_update_admin"
    ON public.productos
    FOR UPDATE
    TO authenticated
    USING (public.es_admin());

CREATE POLICY "productos_delete_admin"
    ON public.productos
    FOR DELETE
    TO authenticated
    USING (public.es_admin());

-- 12.4: Políticas para movimientos_stock (KARDEX INMUTABLE)
CREATE POLICY "movimientos_select_autenticado"
    ON public.movimientos_stock
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "movimientos_insert_autenticado"
    ON public.movimientos_stock
    FOR INSERT
    TO authenticated
    WITH CHECK (usuario_id = auth.uid() AND public.puede_mover_stock());

-- NOTA CRÍTICA DE CIBERSEGURIDAD / AUDITORÍA:
-- NO EXISTEN POLÍTICAS DE 'UPDATE' NI 'DELETE' PARA movimientos_stock.
-- De esta forma, el motor PostgreSQL rechaza absolutamente cualquier intento de alterar o borrar un registro histórico del Kardex.

-- ------------------------------------------------------------------------------
-- 13. CONCESIÓN DE PERMISOS (GRANTS) PARA USUARIOS AUTENTICADOS
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ------------------------------------------------------------------------------
-- 14. TIEMPO REAL: HABILITAR PUBLICACIÓN SUPABASE REALTIME
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.movimientos_stock;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- FIN DEL ESQUEMA INVENIO SUPABASE
-- ==============================================================================
