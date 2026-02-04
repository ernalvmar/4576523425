const { pool } = require('./db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating: Adding seal_number to proformas table...');

        // 1. Check if seal_number exists
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'inventario' 
            AND table_name = 'proformas' 
            AND column_name = 'seal_number'
        `);

        if (res.rows.length === 0) {
            await client.query(`ALTER TABLE inventario.proformas ADD COLUMN seal_number TEXT;`);
            console.log('Column seal_number added.');
        } else {
            console.log('Column seal_number already exists.');
        }

        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
