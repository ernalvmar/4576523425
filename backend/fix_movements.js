const { query } = require('./db');

async function fixMovements() {
    try {
        console.log('--- Fixing Movements Periods ---');

        // Update movements based on their linked loads
        const result = await query(`
            UPDATE inventario.movements m
            SET periodo = l.periodo
            FROM inventario.loads l
            WHERE m.ref_operacion = l.ref_carga
            AND m.periodo != l.periodo
        `);
        console.log(`Updated ${result.rowCount} movements to match their load periods.`);

        // Also check if any movements have null periodo and fix them based on their own date
        // (for manual movements)
        const calculateBillingPeriod = (dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            if (d >= 26) {
                const date = new Date(y, m, 1);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            return `${y}-${String(m).padStart(2, '0')}`;
        };

        const manualMovements = await query('SELECT id, fecha FROM inventario.movements WHERE ref_operacion IS NULL');
        console.log(`Checking ${manualMovements.rows.length} manual movements...`);
        for (const mov of manualMovements.rows) {
            const dateStr = typeof mov.fecha === 'string' ? mov.fecha : mov.fecha.toISOString().slice(0, 10);
            const period = calculateBillingPeriod(dateStr);
            await query('UPDATE inventario.movements SET periodo = $1 WHERE id = $2', [period, mov.id]);
        }

        console.log('--- Fix Complete ---');
    } catch (err) {
        console.error('Fix failed:', err);
    }
}

fixMovements();
