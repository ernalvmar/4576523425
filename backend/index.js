const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { query, pool } = require('./db');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// MiddleWare para asegurar el schema (opcional, pero mejor usar prefijos)
// const schema = 'inventario';

// Auth Endpoints
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await query('SELECT * FROM inventario.users WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            delete user.password;
            res.json(user);
        } else {
            res.status(401).json({ status: 'error', message: 'Credenciales incorrectas' });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.post('/api/register', async (req, res) => {
    const { email, nombre, password, rol } = req.body;

    // Validar dominio
    if (!email.toLowerCase().endsWith('@envos.es')) {
        return res.status(400).json({ status: 'error', message: 'Solo se permiten correos @envos.es' });
    }

    try {
        const result = await query(`
            INSERT INTO inventario.users (email, nombre, password, rol)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO NOTHING
            RETURNING id, email, nombre, rol
        `, [email, nombre, password, rol || 'operario']);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(400).json({ status: 'error', message: 'El usuario ya existe' });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const result = await query('SELECT NOW()');
        res.json({ status: 'ok', serverTime: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET Maestro de Artículos
app.get('/api/articles', async (req, res) => {
    try {
        const result = await query('SELECT * FROM inventario.articles ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST upsert de Artículos (para inicialización o edición)
app.post('/api/articles', async (req, res) => {
    const art = req.body;
    try {
        const result = await query(`
            INSERT INTO inventario.articles 
            (sku, nombre, tipo, unidad, stock_seguridad, stock_inicial, proveedor, precio_venta, ultimo_coste, imagen_url, lead_time_dias, activo, fecha_alta)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (sku) DO UPDATE SET
                nombre = $2, tipo = $3, unidad = $4, stock_seguridad = $5, 
                stock_inicial = $6, proveedor = $7, precio_venta = $8, 
                ultimo_coste = $9, imagen_url = $10, lead_time_dias = $11, 
                activo = $12, fecha_alta = $13, ultimo_ajuste = NOW()
            RETURNING *
        `, [
            art.sku, art.nombre, art.tipo, art.unidad, art.stock_seguridad,
            art.stock_inicial, art.proveedor, art.precio_venta, art.ultimo_coste,
            art.imagen_url, art.lead_time_dias, art.activo, art.fecha_alta
        ]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET Movimientos
app.get('/api/movements', async (req, res) => {
    try {
        const result = await query('SELECT * FROM inventario.movements ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST Registrar Movimiento
app.post('/api/movements', async (req, res) => {
    const { sku, tipo, cantidad, motivo, usuario, periodo, ref_operacion } = req.body;
    try {
        const result = await query(`
            INSERT INTO inventario.movements (sku, tipo, cantidad, motivo, usuario, periodo, ref_operacion)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `, [sku, tipo, cantidad, motivo, usuario, periodo || new Date().toISOString().slice(0, 7), ref_operacion]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET Cargas Sincronizadas
app.get('/api/loads', async (req, res) => {
    try {
        const result = await query('SELECT * FROM inventario.loads ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});



// GET Dashboard Stats
app.get('/api/stats', async (req, res) => {
    try {
        const mesActual = calculateBillingPeriod(new Date().toISOString().slice(0, 10));
        const devengado = await query(`
            SELECT SUM(m.cantidad * a.precio_venta) as total 
            FROM inventario.movements m 
            JOIN inventario.articles a ON m.sku = a.sku 
            WHERE m.tipo = 'SALIDA' AND m.periodo = $1
        `, [mesActual]);

        const historico = await query(`
            SELECT periodo, SUM(m.cantidad * a.precio_venta) as total 
            FROM inventario.movements m 
            JOIN inventario.articles a ON m.sku = a.sku 
            WHERE m.tipo = 'SALIDA' 
            GROUP BY periodo ORDER BY periodo DESC
        `);

        res.json({
            periodoActual: mesActual,
            devengado: parseFloat(devengado.rows[0].total) || 0,
            historico: historico.rows
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Trigger Manual n8n Sync
app.post('/api/trigger-sync', async (req, res) => {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error('Missing N8N_WEBHOOK_URL env var');
        return res.status(500).json({ error: 'Sync configuration missing' });
    }

    try {
        console.log('Triggering manual sync via n8n webhook...');
        // Using native fetch (Node 18+)
        const response = await fetch(webhookUrl, { method: 'POST' });
        if (response.ok) {
            res.json({ success: true, message: 'Sync triggered' });
        } else {
            throw new Error(`n8n responded with ${response.status}`);
        }
    } catch (err) {
        console.error('Sync trigger error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DELETE Article (Soft delete or Hard delete based on constraints)
app.delete('/api/articles/:sku', async (req, res) => {
    const { sku } = req.params;
    const { force } = req.query;
    try {
        if (force === 'true') {
            await query('DELETE FROM inventario.movements WHERE sku = $1', [sku]);
            await query('DELETE FROM inventario.articles WHERE sku = $1', [sku]);
            return res.json({ message: 'Material y todo su historial eliminados permanentemente' });
        }

        // Check for movements
        const check = await query('SELECT COUNT(*) FROM inventario.movements WHERE sku = $1', [sku]);
        if (parseInt(check.rows[0].count) > 0) {
            // Soft delete if history exists
            await query('UPDATE inventario.articles SET activo = false WHERE sku = $1', [sku]);
            return res.json({ message: 'Artículo desactivado (tiene historial). Use borrado forzado si desea eliminarlo totalmente.' });
        } else {
            // Hard delete if clean
            await query('DELETE FROM inventario.articles WHERE sku = $1', [sku]);
            return res.json({ message: 'Artículo eliminado permanentemente' });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Helper: Calculate Billing Period (26th to 25th)
const calculateBillingPeriod = (dateStr) => {
    // dateStr format: YYYY-MM-DD
    const [y, m, d] = dateStr.split('-').map(Number);
    if (d >= 26) {
        // Belongs to the NEXT period
        // For Jan 26: y=2026, m=1, d=26. 
        // new Date(2026, 1, 1) -> Feb 1st
        const nextDate = new Date(y, m, 1);
        return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    }
    // Belongs to current period
    return `${y}-${String(m).padStart(2, '0')}`;
};

app.post('/api/sync/loads', async (req, res) => {
    const loads = req.body;
    console.log(`--- SYNC START: Receiving ${Array.isArray(loads) ? loads.length : 0} loads ---`);
    if (!Array.isArray(loads)) return res.status(400).json({ error: 'Payload must be an array' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const load of loads) {
            const { ref_carga, fecha, equipo, matricula, consumos } = load;

            if (!ref_carga) {
                console.warn('Skipping load without ref_carga');
                continue;
            }

            console.log(`Syncing load: ${ref_carga} (${fecha})`);
            const periodo = calculateBillingPeriod(fecha.slice(0, 10));

            // 1. Upsert Load
            await client.query(`
                INSERT INTO inventario.loads (ref_carga, fecha, equipo, matricula, consumos_json, periodo)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (ref_carga) DO UPDATE SET 
                fecha = $2, equipo = $3, matricula = $4, consumos_json = $5,
                periodo = $6, sincronizado_en = NOW()
            `, [ref_carga, fecha, equipo, matricula, JSON.stringify(consumos), periodo]);

            // 2. Refresh Movements (preserve customized ones? No, sync overrides unless we have a specific 'manual' flag. 
            // For now, standard behavior: Delete movements for this load and re-insert base consumptions)
            // EXCEPTION: IF we have adr_breakdown stored locally, we should probably preserve it? 
            // But this is a full sync from source. Source doesn't know about ADR breakdown.
            // If we overwrite, we lose the breakdown.
            // Strategy: Check if load exists and has adr_breakdown_json.
            const existing = await client.query('SELECT adr_breakdown_json FROM inventario.loads WHERE ref_carga = $1', [ref_carga]);
            let adrBreakdown = null;
            if (existing.rows.length > 0) {
                adrBreakdown = existing.rows[0].adr_breakdown_json;
            }

            // Remove all movements for this load
            await client.query('DELETE FROM inventario.movements WHERE ref_operacion = $1', [ref_carga]);

            // Insert standard consumptions
            for (const [sku, qty] of Object.entries(consumos)) {
                if (qty > 0) {
                    // Check if this is the generic ADR tag
                    const isGenericAdr = sku.toLowerCase().includes('pegatina adr') || sku === 'ETIQUETAS ADR';

                    // If it's generic ADR and we have a breakdown, DO NOT insert the generic. Insert the breakdown instead.
                    if (isGenericAdr && adrBreakdown && Object.keys(adrBreakdown).length > 0) {
                        for (const [adrSku, adrQty] of Object.entries(adrBreakdown)) {
                            if (adrQty > 0) {
                                await client.query(`
                                    INSERT INTO inventario.movements (sku, tipo, cantidad, motivo, periodo, ref_operacion, usuario)
                                    VALUES ($1, 'SALIDA', $2, 'Sincronización (ADR Desglosado)', $3, $4, 'Sistema n8n')
                                `, [adrSku, adrQty, periodo, ref_carga]);
                            }
                        }
                    } else {
                        // Insert standard (or generic if no breakdown yet)
                        await client.query(`
                            INSERT INTO inventario.movements (sku, tipo, cantidad, motivo, periodo, ref_operacion, usuario)
                            VALUES ($1, 'SALIDA', $2, 'Sincronización Google Sheets', $3, $4, 'Sistema n8n')
                        `, [sku, qty, periodo, ref_carga]);
                    }
                }
            }
        }
        await client.query('COMMIT');
        console.log('--- SYNC SUCCESS ---');
        res.json({ success: true, count: loads.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('--- SYNC ERROR ---', err);
        res.status(500).json({ status: 'error', message: err.message });
    } finally {
        client.release();
    }
});

// ADR Breakdown Update Endpoint
app.post('/api/loads/:ref/adr', async (req, res) => {
    const { ref } = req.params;
    const { breakdown } = req.body; // { 'ADR-1': 5, 'ADR-2': 10 }

    if (!breakdown) return res.status(400).json({ error: 'No breakdown provided' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get Load Info first
        const loadCheck = await client.query('SELECT fecha FROM inventario.loads WHERE ref_carga = $1', [ref]);
        if (loadCheck.rowCount === 0) throw new Error('Carga no encontrada');

        const fechaCarga = loadCheck.rows[0].fecha;
        let dateStr = typeof fechaCarga === 'string' ? fechaCarga : fechaCarga.toISOString();
        const periodo = calculateBillingPeriod(dateStr.slice(0, 10));

        // 2. Update Load with JSON and calculated period
        await client.query(`
            UPDATE inventario.loads 
            SET adr_breakdown_json = $1, periodo = $2
            WHERE ref_carga = $3
        `, [JSON.stringify(breakdown), periodo, ref]);

        // 2. Fix Movements
        // Delete "Generic" ADR movements for this load OR previously broken down movements?
        // Safest: Delete ANY movement for this load that is an ADR SKU. 
        // But how do we know which are ADR SKUs? 
        // Option A: Delete all movements for this load that match keys in breakdown OR the generic name 'Pegatina ADR'.
        // Better: We know this endpoint is ONLY for ADR. 
        // Let's identify the generic SKU name typically used. 'pegatina adr' or similar.
        // Also remove any existing specific ADR movements to avoid duplicates.

        // Strategy: Get list of ADR SKUs from database to be safe? 
        // Or just trust that we replace anything related to ADR stickers.
        // Let's trying deleting based on SKU pattern 'ADR-%' AND the generic 'ETIQUETAS ADR' / 'Pegatina ADR'.

        await client.query(`
            DELETE FROM inventario.movements 
            WHERE ref_operacion = $1 
            AND (sku ILIKE 'ADR-%' OR sku ILIKE '%ADR%' OR sku ILIKE '%Pegatina%')
        `, [ref]);

        // 3. Insert new movements from breakdown
        for (const [sku, qty] of Object.entries(breakdown)) {
            if (Number(qty) > 0) {
                await client.query(`
                    INSERT INTO inventario.movements (sku, tipo, cantidad, motivo, periodo, ref_operacion, usuario)
                    VALUES ($1, 'SALIDA', $2, 'Desglose Manual ADR', $3, $4, 'Operario')
                `, [sku, Number(qty), periodo, ref]);
            }
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ status: 'error', message: err.message });
    } finally {
        client.release();
    }
});

// GET Closings
app.get('/api/closings', async (req, res) => {
    try {
        const result = await query('SELECT * FROM inventario.closings ORDER BY month DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching closings:', err.message);
        // If table doesn't exist, return empty array instead of error
        if (err.message.includes('does not exist') || err.code === '42P01') {
            res.json([]);
        } else {
            res.status(500).json({ status: 'error', message: err.message });
        }
    }
});

// POST Save Closing
app.post('/api/closings', async (req, res) => {
    const { month, status, closed_by } = req.body;
    try {
        await query(`
            INSERT INTO inventario.closings (month, status, closed_by, closed_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (month) DO UPDATE SET
            status = $2, closed_by = $3, closed_at = NOW()
        `, [month, status, closed_by]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET Distinct Periods (for History)
app.get('/api/periods', async (req, res) => {
    try {
        const result = await query(`
            SELECT DISTINCT periodo 
            FROM inventario.movements 
            WHERE periodo IS NOT NULL 
            ORDER BY periodo DESC
        `);
        res.json(result.rows.map(r => r.periodo));
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.listen(port, () => {
    console.log(`Backend logic running on port ${port}`);
});
