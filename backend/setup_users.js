require('dotenv').config({ path: __dirname + '/.env' });
const { query } = require('./db');

async function setupUsersTable() {
    console.log('--- CONFIGURANDO TABLA DE USUARIOS ---');
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS inventario.users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                password TEXT NOT NULL,
                rol TEXT NOT NULL DEFAULT 'operario', -- roles: 'operario', 'responsable'
                fecha_alta TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('✅ Tabla inventario.users creada o ya existente.');

        // Insertar un usuario responsable por defecto si no hay usuarios
        const usersCount = await query("SELECT COUNT(*) FROM inventario.users");
        if (parseInt(usersCount.rows[0].count) === 0) {
            await query(`
                INSERT INTO inventario.users (email, nombre, password, rol)
                VALUES ($1, $2, $3, $4)
            `, ['admin@envos.es', 'Administrador Envos', 'envos2026', 'responsable']);
            console.log('✅ Usuario responsable por defecto creado (admin@envos.es / envos2026)');
        }

        console.log('--- PROCESO COMPLETADO ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al configurar usuarios:', err.message);
        process.exit(1);
    }
}

setupUsersTable();
