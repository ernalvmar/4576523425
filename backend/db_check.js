const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        const schemas = await pool.query("SELECT schema_name FROM information_schema.schemata");
        console.log('Schemas:', schemas.rows.map(r => r.schema_name));

        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'inventario'");
        console.log('Tables in inventario:', tables.rows.map(r => r.table_name));

        const articles = await pool.query("SELECT count(*) FROM inventario.articles");
        console.log('Articles count:', articles.rows[0].count);

        const movements = await pool.query("SELECT count(*) FROM inventario.movements");
        console.log('Movements count:', movements.rows[0].count);

        const loads = await pool.query("SELECT count(*) FROM inventario.loads");
        console.log('Loads count:', loads.rows[0].count);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}
check();
