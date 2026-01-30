require('dotenv').config({ path: __dirname + '/.env' });
const { query } = require('./db');

async function recreateLoadsTable() {
    console.log('--- RECREANDO TABLA DE CARGAS (loads) ---');
    try {
        // 1. Crear el esquema si por casualidad no existe (aunque suele existir)
        await query("CREATE SCHEMA IF NOT EXISTS inventario");

        // 2. Crear la tabla loads
        await query(`
            CREATE TABLE IF NOT EXISTS inventario.loads (
                ref_carga TEXT PRIMARY KEY,
                fecha DATE,
                equipo TEXT,
                matricula TEXT,
                consumos_json JSONB,
                sincronizado_en TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('✅ Tabla inventario.loads creada correctamente.');

        // 3. Asegurar que la tabla de movimientos tiene la FK o la referencia de operacion permitida
        // (Esto es solo por seguridad, la tabla movements ya debería existir)

        console.log('--- PROCESO COMPLETADO ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al recrear la tabla:', err.message);
        process.exit(1);
    }
}

recreateLoadsTable();
