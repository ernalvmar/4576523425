require('dotenv').config({ path: __dirname + '/.env' });
const { query } = require('./db');

async function purgeLoads() {
    console.log('--- INICIANDO LIMPIEZA DE DATOS ---');
    try {
        // 1. Borrar movimientos asociados a cargas (los que tienen ref_operacion)
        const resMov = await query("DELETE FROM inventario.movements WHERE ref_operacion IS NOT NULL");
        console.log(`✅ ${resMov.rowCount} movimientos de cargas eliminados.`);

        // 2. Borrar todas las cargas
        const resLoads = await query("TRUNCATE inventario.loads CASCADE");
        console.log('✅ Tabla de cargas (loads) vaciada correctamente.');

        console.log('--- LIMPIEZA COMPLETADA ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error durante la limpieza:', err.message);
        process.exit(1);
    }
}

purgeLoads();
