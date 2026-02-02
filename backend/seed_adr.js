const { query } = require('./db');

// List of ADR Stickers to seed
const adrStickers = [
    { sku: 'ADR-2.1-R', nombre: 'Pegatina ADR 2.1 (Roja)', tipo: 'Nuevo', unidad: 'UN', precio: 0.15 },
    { sku: 'ADR-2.1-V', nombre: 'Pegatina ADR 2.1 (Verde)', tipo: 'Nuevo', unidad: 'UN', precio: 0.15 },
    { sku: 'ADR-3', nombre: 'Pegatina ADR Clase 3 (Inflamable)', tipo: 'Nuevo', unidad: 'UN', precio: 0.15 },
    { sku: 'ADR-4.3', nombre: 'Pegatina ADR Clase 4.3 (Azul)', tipo: 'Nuevo', unidad: 'UN', precio: 0.15 },
    { sku: 'ADR-4.1', nombre: 'Pegatina ADR Clase 4.1 (Rayas)', tipo: 'Nuevo', unidad: 'UN', precio: 0.15 },
    { sku: 'ADR-5.1', nombre: 'Pegatina ADR Clase 5.1 (Amarilla)', tipo: 'Nuevo', unidad: 'UN', precio: 0.15 },
    { sku: 'ADR-8', nombre: 'Pegatina ADR Clase 8.0 (Corrosivo)', tipo: 'Nuevo', unidad: 'UN', precio: 0.15 },
    { sku: 'ADR-9', nombre: 'Pegatina ADR Clase 9 (Misceláneo)', tipo: 'Nuevo', unidad: 'UN', precio: 0.15 },
    { sku: 'ADR-LQ', nombre: 'Pegatina ADR LQ (Cantidades Limitadas)', tipo: 'Nuevo', unidad: 'UN', precio: 0.15 },
    { sku: 'ADR-ENV', nombre: 'Pegatina ADR Peligro Medio Ambiente', tipo: 'Nuevo', unidad: 'UN', precio: 0.15 }
];

async function seedADR() {
    console.log('--- Seeding ADR Stickers ---');
    try {
        for (const adr of adrStickers) {
            await query(`
                INSERT INTO inventario.articles (sku, nombre, tipo, unidad, stock_seguridad, stock_inicial, proveedor, precio_venta, activo)
                VALUES ($1, $2, $3, $4, 100, 0, 'Proveedor ADR', $5, true)
                ON CONFLICT (sku) DO NOTHING
            `, [adr.sku, adr.nombre, adr.tipo, adr.unidad, adr.precio]);
            console.log(`Seeded: ${adr.sku}`);
        }
        console.log('--- ADR Seeding Complete ---');
    } catch (err) {
        console.error('Error seeding ADR:', err);
    }
}

seedADR();
