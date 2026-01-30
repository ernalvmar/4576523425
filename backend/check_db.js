const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkStructure() {
    try {
        console.log('--- SCHEMAS ---');
        const schemas = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'");
        console.log(schemas.rows.map(r => r.schema_name));

        for (const schema of schemas.rows) {
            console.log(`\n--- TABLES IN ${schema.schema_name} ---`);
            const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = $1", [schema.schema_name]);
            console.log(tables.rows.map(r => r.table_name));
        }
    } catch (err) {
        console.error('Error connecting to DB:', err.message);
    } finally {
        await pool.end();
    }
}

checkStructure();
