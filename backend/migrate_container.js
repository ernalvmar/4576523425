const { pool } = require('./db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating: Adding container_number column to proformas...');
        await client.query(`
            ALTER TABLE inventario.proformas 
            ADD COLUMN IF NOT EXISTS container_number TEXT;
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
