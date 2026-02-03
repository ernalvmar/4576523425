const { query } = require('./db');

async function setup() {
    try {
        console.log('Enriching database for Pallets and Obramat Providers...');

        // Obramat Providers Table
        await query(`
            CREATE TABLE IF NOT EXISTS inventario.obramat_providers (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('Table obramat_providers checked/created.');

        // Pallet Consumptions Table
        await query(`
            CREATE TABLE IF NOT EXISTS inventario.pallet_consumptions (
                id SERIAL PRIMARY KEY,
                movement_id INTEGER,
                date DATE NOT NULL,
                agency TEXT,
                provider TEXT,
                order_ref TEXT,
                weight NUMERIC,
                num_packages INTEGER,
                resulting_pallets INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('Table pallet_consumptions checked/created.');

        // Seed some initial obramat providers if table is empty
        const count = await query('SELECT COUNT(*) FROM inventario.obramat_providers');
        if (parseInt(count.rows[0].count) === 0) {
            await query(`
                INSERT INTO inventario.obramat_providers (name) VALUES 
                ('AGRUPADOS'), ('BAUHAUS'), ('LEROY MERLIN')
                ON CONFLICT DO NOTHING
            `);
            console.log('Initial obramat providers seeded.');
        }

        console.log('Database enrichment complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error during database enrichment:', err);
        process.exit(1);
    }
}

setup();
