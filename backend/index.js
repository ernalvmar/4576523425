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

// POST Sync Loads from n8n
app.post('/api/sync/loads', async (req, res) => {
    const loads = req.body;
    if (!Array.isArray(loads)) return res.status(400).json({ error: 'Payload must be an array' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const load of loads) {
            const { ref_carga, fecha, equipo, matricula, consumos } = load;

            // 1. Upsert Load
            await client.query(`
                INSERT INTO inventario.loads (ref_carga, fecha, equipo, matricula, consumos_json)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (ref_carga) DO UPDATE SET 
                fecha = $2, equipo = $3, matricula = $4, consumos_json = $5
            `, [ref_carga, fecha, equipo, matricula, JSON.stringify(consumos)]);

            // 2. Registrar Movimientos (borramos anteriores de esta carga para evitar duplas en re-sync)
            await client.query('DELETE FROM inventario.movements WHERE ref_operacion = $1', [ref_carga]);

            for (const [sku, qty] of Object.entries(consumos)) {
                if (qty > 0) {
                    await client.query(`
                        INSERT INTO inventario.movements (sku, tipo, cantidad, motivo, periodo, ref_operacion, usuario)
                        VALUES ($1, 'SALIDA', $2, 'Sincronización Google Sheets', $3, $4, 'Sistema n8n')
                    `, [sku, qty, fecha.slice(0, 7), ref_carga]);
                }
            }
        }
        await client.query('COMMIT');
        res.json({ success: true, count: loads.length });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ status: 'error', message: err.message });
    } finally {
        client.release();
    }
});

// GET Dashboard Stats
app.get('/api/stats', async (req, res) => {
    try {
        const mesActual = new Date().toISOString().slice(0, 7);
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
            devengado: parseFloat(devengado.rows[0].total) || 0,
            historico: historico.rows
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.listen(port, () => {
    console.log(`Backend logic running on port ${port}`);
});
