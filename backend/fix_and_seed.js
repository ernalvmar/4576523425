const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function fixAndSeed() {
    try {
        console.log('--- REVISANDO Y CORRIGIENDO TABLA ARTICLES ---');

        // Renombrar columnas si existen con nombres en inglés de la migración anterior
        // O simplemente recrear la tabla para asegurar consistencia
        await pool.query('DROP TABLE IF EXISTS inventario.articles CASCADE');

        await pool.query(`
            CREATE TABLE inventario.articles (
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
                fecha_alta DATE DEFAULT '2026-01-25',
                ultimo_ajuste TIMESTAMP DEFAULT NOW()
            )
        `);

        const items = [
            { sku: 'CIN-N-001', nombre: 'Cincha Nueva', tipo: 'Nuevo', precio: 5.50 },
            { sku: 'CIN-U-001', nombre: 'Cincha Reutilizada', tipo: 'Usado', precio: 1.50 },
            { sku: 'CAR-N-001', nombre: 'Carraca Nueva', tipo: 'Nuevo', precio: 8.75 },
            { sku: 'CAR-U-001', nombre: 'Carraca Reutilizada', tipo: 'Usado', precio: 2.00 },
            { sku: 'LON-N-001', nombre: 'Lona Nueva', tipo: 'Nuevo', precio: 45.00 },
            { sku: 'LON-U-001', nombre: 'Lona Reutilizada', tipo: 'Usado', precio: 12.00 },
            { sku: 'CAN-N-001', nombre: 'Cantonera Nueva', tipo: 'Nuevo', precio: 2.20 },
            { sku: 'CAN-P-001', nombre: 'Cantonera Pequeña', tipo: 'Nuevo', precio: 1.10 },
            { sku: 'CAN-U-001', nombre: 'Cantonera Reutilizada', tipo: 'Usado', precio: 0.50 },
            { sku: 'ADR-P-001', nombre: 'Pegatina ADR', tipo: 'Nuevo', precio: 0.80 },
            { sku: 'AIR-B-001', nombre: 'Airbag', tipo: 'Nuevo', precio: 15.00 }
        ];

        for (const item of items) {
            await pool.query(`
                INSERT INTO inventario.articles (sku, nombre, tipo, precio_venta, unidad, activo, fecha_alta)
                VALUES ($1, $2, $3, $4, 'UN', true, '2026-01-25')
            `, [item.sku, item.nombre, item.tipo, item.precio]);
        }

        console.log('¡Estructura corregida y materiales cargados con éxito!');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

fixAndSeed();
