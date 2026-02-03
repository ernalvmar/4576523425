const { pool } = require('./db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating: Adding proformas table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS inventario.proformas (
                id SERIAL PRIMARY KEY,
                invoice_number TEXT NOT NULL,
                date DATE NOT NULL,
                expense_number TEXT,
                provider TEXT,
                weight NUMERIC(10, 2),
                pallets TEXT,
                packages TEXT,
                rolls TEXT,
                merchandise_value NUMERIC(10, 2),
                freight_insurance NUMERIC(10, 2),
                items_json JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
