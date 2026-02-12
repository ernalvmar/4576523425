const { query } = require('./db');

// Período contable: del 26 del mes anterior al 25 del mes actual
const calculateBillingPeriod = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);

    if (d >= 26) {
        // Si el día es >= 26, pertenece al período del MES SIGUIENTE
        const nextMonth = m + 1;
        if (nextMonth > 12) {
            return `${y + 1}-01`;
        }
        return `${y}-${String(nextMonth).padStart(2, '0')}`;
    } else {
        // Si el día es < 26, pertenece al período del MES ACTUAL
        return `${y}-${String(m).padStart(2, '0')}`;
    }
};

async function migrate() {
    try {
        console.log('--- Starting Migration ---');

        // 1. Add periodo column to inventario.loads
        await query(`
            ALTER TABLE inventario.loads 
            ADD COLUMN IF NOT EXISTS periodo TEXT;
        `);
        console.log('Added periodo column to loads table.');

        // 2. Update existing loads
        const loads = await query('SELECT ref_carga, fecha FROM inventario.loads');
        console.log(`Updating ${loads.rows.length} loads...`);
        for (const load of loads.rows) {
            const dateStr = typeof load.fecha === 'string' ? load.fecha : load.fecha.toISOString().slice(0, 10);
            const period = calculateBillingPeriod(dateStr);
            await query('UPDATE inventario.loads SET periodo = $1 WHERE ref_carga = $2', [period, load.ref_carga]);
        }
        console.log('Finished updating loads.');

        // 3. Update existing movements (just to be sure)
        const movements = await query('SELECT id, fecha FROM inventario.movements WHERE periodo IS NULL OR length(periodo) = 7');
        // Actually, some periods might be wrong (calendar based). Let's recalculate all.
        const allMovements = await query('SELECT id, fecha FROM inventario.movements');
        console.log(`Recalculating periods for ${allMovements.rows.length} movements...`);
        for (const mov of allMovements.rows) {
            const dateStr = typeof mov.fecha === 'string' ? mov.fecha : mov.fecha.toISOString().slice(0, 10);
            const period = calculateBillingPeriod(dateStr);
            await query('UPDATE inventario.movements SET periodo = $1 WHERE id = $2', [period, mov.id]);
        }
        console.log('Finished updating movements.');

        console.log('--- Migration Complete ---');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
