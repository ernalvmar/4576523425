const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

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

async function seed() {
    try {
        console.log('Iniciando carga de materiales...');
        for (const item of items) {
            await pool.query(`
                INSERT INTO inventario.articles (sku, nombre, tipo, precio_venta, unidad, activo, fecha_alta)
                VALUES ($1, $2, $3, $4, 'UN', true, '2026-01-25')
                ON CONFLICT (sku) DO UPDATE SET precio_venta = $4
            `, [item.sku, item.nombre, item.tipo, item.precio]);
        }
        console.log('¡Materiales cargados con éxito en Neon!');
    } catch (err) {
        console.error('Error durante la carga:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
