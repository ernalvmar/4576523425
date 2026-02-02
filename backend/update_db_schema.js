const { query } = require('./db');

async function updateSchema() {
    try {
        console.log('--- Updating Schema ---');
        
        // Add adr_breakdown_json column to loads
        await query(`
            ALTER TABLE inventario.loads 
            ADD COLUMN IF NOT EXISTS adr_breakdown_json JSONB;
        `);
        console.log('Added adr_breakdown_json to loads table.');

        console.log('--- Schema Update Complete ---');
    } catch (err) {
        console.error('Error updating schema:', err);
    }
}

updateSchema();
