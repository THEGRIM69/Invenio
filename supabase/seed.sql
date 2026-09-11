-- ==============================================================================
-- INVENIO: DATOS INICIALES (SEED DATA)
-- Inserta categorías base y catálogo de prueba para el almacén
-- ==============================================================================

-- 1. CATEGORÍAS LOGÍSTICAS BASE
INSERT INTO public.categorias (nombre, descripcion)
VALUES 
    ('Componentes Electrónicos', 'Sensores, microcontroladores, cables y placas PCB'),
    ('Herramientas Industriales', 'Herramientas de mano, calibradores y equipo de ajuste'),
    ('Material de Embalaje', 'Cajas de cartón corrugado, precinto, film alveolar y palets'),
    ('Seguridad y EPP', 'Cascos, guantes de nitrilo, chalecos reflectantes y botas')
ON CONFLICT (nombre) DO NOTHING;

-- 2. PRODUCTOS DE EJEMPLO
INSERT INTO public.productos (sku, codigo_barras, nombre, descripcion, categoria_id, stock_actual, stock_minimo, ubicacion_almacen, unidad_medida, precio_unitario)
VALUES
    (
        'ELEC-SENS-01',
        '7501000100018',
        'Sensor Óptico Industrial 24V',
        'Sensor reflectivo de detección de proximidad con alcance de 50cm',
        (SELECT id FROM public.categorias WHERE nombre = 'Componentes Electrónicos' LIMIT 1),
        45.00,
        10.00,
        'Pasillo A - Estantería 1 - Nivel B',
        'UNIDAD',
        38.50
    ),
    (
        'ELEC-MCU-32',
        '7501000100025',
        'Módulo Controlador IoT ESP32',
        'Placa con conectividad WiFi/Bluetooth para telemetría de almacén',
        (SELECT id FROM public.categorias WHERE nombre = 'Componentes Electrónicos' LIMIT 1),
        8.00,
        15.00, -- Estado: STOCK BAJO (alerta visual)
        'Pasillo A - Estantería 2 - Nivel A',
        'UNIDAD',
        12.00
    ),
    (
        'HERR-CAL-DIG',
        '7501000100032',
        'Calibrador Vernier Digital 150mm',
        'Herramienta de medición milimétrica en acero inoxidable con display LCD',
        (SELECT id FROM public.categorias WHERE nombre = 'Herramientas Industriales' LIMIT 1),
        3.00,
        5.00,  -- Estado: STOCK BAJO
        'Pasillo B - Gabinete 1 - Cajón 3',
        'UNIDAD',
        64.00
    ),
    (
        'EMB-CAJA-M',
        '7501000100049',
        'Caja Cartón Doble Canal 40x30x30 cm',
        'Caja resistente para envíos medianos de hasta 20kg',
        (SELECT id FROM public.categorias WHERE nombre = 'Material de Embalaje' LIMIT 1),
        320.00,
        50.00,
        'Área Palets - Posición P-04',
        'UNIDAD',
        1.45
    ),
    (
        'EPP-GUANTE-NIT',
        '7501000100056',
        'Pack x10 Guantes de Nitrilo Talla L',
        'Guantes resistentes a grasas y aceites industriales',
        (SELECT id FROM public.categorias WHERE nombre = 'Seguridad y EPP' LIMIT 1),
        0.00,
        10.00, -- Estado: SIN STOCK (crítico)
        'Pasillo C - Estantería 4 - Nivel C',
        'PACK',
        8.90
    )
ON CONFLICT (sku) DO NOTHING;
