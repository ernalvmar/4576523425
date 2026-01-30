-- Configuración de Base de Datos para Obramat - Sistema de Inventario
-- Schema: inventario

CREATE SCHEMA IF NOT EXISTS inventario;

-- 1. Tabla de Artículos (Maestro)
CREATE TABLE IF NOT EXISTS inventario.articles (
    sku TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('Nuevo', 'Usado')),
    unidad TEXT DEFAULT 'UN',
    stock_seguridad INTEGER DEFAULT 0,
    stock_inicial INTEGER DEFAULT 0,
    proveedor TEXT,
    precio_venta NUMERIC(10, 2) DEFAULT 0,
    ultimo_coste NUMERIC(10, 2) DEFAULT 0,
    imagen_url TEXT,
    lead_time_dias INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_alta DATE DEFAULT CURRENT_DATE,
    ultimo_ajuste TIMESTAMP DEFAULT NOW()
);

-- 2. Tabla de Movimientos de Stock
CREATE TABLE IF NOT EXISTS inventario.movements (
    id SERIAL PRIMARY KEY,
    sku TEXT REFERENCES inventario.articles(sku),
    tipo TEXT CHECK (tipo IN ('ENTRADA', 'SALIDA')),
    cantidad INTEGER NOT NULL,
    motivo TEXT,
    usuario TEXT,
    fecha TIMESTAMP DEFAULT NOW(),
    periodo TEXT, -- Formato YYYY-MM para facturacion
    ref_operacion TEXT -- Para vincular con cargas de Google Sheets
);

-- 3. Tabla de Cargas Sincronizadas (Google Sheets)
CREATE TABLE IF NOT EXISTS inventario.loads (
    ref_carga TEXT PRIMARY KEY,
    fecha DATE NOT NULL,
    equipo TEXT,
    matricula TEXT,
    consumos_json JSONB, -- Backup del desglose original de la hoja
    sincronizado_en TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_movements_sku ON inventario.movements(sku);
CREATE INDEX IF NOT EXISTS idx_movements_periodo ON inventario.movements(periodo);
CREATE INDEX IF NOT EXISTS idx_loads_fecha ON inventario.loads(fecha);
