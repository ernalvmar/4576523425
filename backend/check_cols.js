const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkColumns() {
    try {
        const tables = [
            { s: 'public', t: 'stock' },
            { s: 'public', t: 'movimientos' },
            { s: 'inventario', t: 'articles' },
            { s: 'inventario', t: 'operational_loads' }
        ];

        for (const table of tables) {
            console.log(`\n--- COLUMNS IN ${table.s}.${table.t} ---`);
            const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2", [table.s, table.t]);
            console.log(cols.rows.map(r => `${r.column_name} (${r.data_type})`));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkColumns();
