# Invenio 📦 &bull; Portal Logístico de Almacén con Control de Stock en Tiempo Real

Invenio es una solución integral para la gestión, auditoría y control de inventario en almacenes industriales, diseñada con arquitectura de **Ciberseguridad Zero-Trust**, autorización mediante **Row Level Security (RLS)** en **Supabase / PostgreSQL**, y una interfaz responsive construida en **React**, **TypeScript**, **Tailwind CSS v3.4** y **pnpm**.

---

## 🚀 Tecnologías Principales

* **Base de Datos & Backend:** [Supabase](https://supabase.com) (PostgreSQL 15+, Supabase Auth JWT, Realtime WebSockets, Funciones RPC transaccionales ACID).
* **Frontend:** React 18 + TypeScript + Vite.
* **Estilos:** Tailwind CSS v3.4 (Paleta industrial y semántica de estado de inventario).
* **Iconografía:** Lucide React.
* **Gestor de Paquetes:** `pnpm` v11+.

---

## 🛡️ Ciberseguridad de Vanguardia

1. **Row Level Security (RLS) en todas las tablas:**
   * Ningún cliente puede leer ni escribir datos fuera de las políticas definidas en PostgreSQL.
   * El cliente web utiliza únicamente la `anon_key`; los privilegios se derivan criptográficamente del token JWT firmado por Supabase.
2. **Kardex Inmutable (Append-Only):**
   * La tabla `movimientos_stock` prohíbe operaciones de `UPDATE` y `DELETE` a nivel de RLS.
   * Garantiza auditoría legal y trazabilidad inalterable de cada entrada, salida o ajuste.
3. **Transacciones Atómicas ACID (`registrar_movimiento` RPC):**
   * Bloqueo pesimista de fila (`FOR UPDATE`) para evitar condiciones de carrera cuando múltiples operarios registran movimientos al mismo milisegundo.
   * Restricción `CHECK (stock_actual >= 0)` que impide existencias negativas a nivel de base de datos.
4. **Control de Acceso Basado en Roles (RBAC):**
   * `admin`: Gestión total del catálogo, usuarios y auditoría.
   * `operario`: Registro rápido de movimientos, escaneo y consulta de existencias.

---

## 📁 Estructura del Proyecto

```
invenio/
├── supabase/
│   ├── schema.sql           # Esquema SQL completo con RLS, RPC y Realtime
│   └── seed.sql             # Datos iniciales (categorías y catálogo de prueba)
├── src/
│   ├── components/          # Componentes modulares responsive
│   │   ├── Header.tsx       # Navegación, pulso Realtime y conmutador de roles
│   │   ├── KpiMetrics.tsx   # Métricas y filtro de alertas de stock bajo
│   │   ├── StockList.tsx    # Vista dual: Tabla en Desktop y Tarjetas en Mobile
│   │   ├── MovementModal.tsx# Modal para registrar Entrada, Salida, Ajuste y Merma
│   │   ├── ScannerModal.tsx # Escáner de código de barras / SKU
│   │   ├── LoginModal.tsx   # Acceso seguro con tokens JWT
│   │   ├── ToastContainer.tsx # Notificaciones en vivo
│   │   └── SupabaseBanner.tsx # Guía de integración con Supabase
│   ├── context/
│   │   ├── AuthContext.tsx  # Sesión JWT y roles RBAC (Admin / Operario)
│   │   └── StockContext.tsx # Sincronización Realtime (WebSockets) y Kardex
│   ├── lib/
│   │   ├── supabase.ts      # Cliente seguro de Supabase
│   │   └── mockData.ts      # Datos de prueba para modo offline/sandbox
│   ├── types/
│   │   └── database.ts      # Tipos TypeScript sincronizados con PostgreSQL
│   ├── App.tsx              # Shell principal responsive
│   ├── main.tsx             # Punto de entrada de la aplicación
│   └── index.css            # Directivas Tailwind y estilos de código
├── .env.example             # Plantilla de variables de entorno
├── tailwind.config.js       # Configuración de Tailwind CSS v3.4
├── vite.config.ts           # Configuración de Vite
└── package.json             # Dependencias del proyecto
```

---

## ⚡ Puesta en Marcha

### 1. Instalación de dependencias
```bash
pnpm install
```

### 2. Configuración de Base de Datos en Supabase
1. Ingresa a [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Ve al **SQL Editor** en el panel de Supabase.
3. Copia y pega el contenido del archivo [`supabase/schema.sql`](file:///c:/Users/Admin/invenio/Invenio/supabase/schema.sql) y haz clic en **Run**.
4. *(Opcional)* Ejecuta también [`supabase/seed.sql`](file:///c:/Users/Admin/invenio/Invenio/supabase/seed.sql) para cargar datos de prueba iniciales.
5. Copia tus credenciales en el archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

### 3. Iniciar el servidor de desarrollo
```bash
pnpm run dev
```
Abre en tu navegador: `http://localhost:3000` (o el puerto asignado).
