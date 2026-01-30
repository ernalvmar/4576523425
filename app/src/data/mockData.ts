import { User, Article, OperationalLoad, MonthClosing } from '../types';

export const INITIAL_USERS: User[] = [
    { id: '1', email: 'admin@obramat.es', password: 'admin', name: 'Administrador SVQ', role: 'Admin' },
    { id: '2', email: 'operario@obramat.es', password: '123', name: 'Operario Turno 1', role: 'Operario' }
];

export const INITIAL_ARTICLES: Article[] = [
    {
        sku: 'CIN-N-001',
        nombre: 'Cincha Nueva',
        tipo: 'Nuevo',
        unidad: 'UN',
        stock_seguridad: 200,
        stock_inicial: 1000,
        proveedor: 'Pendiente',
        lead_time_dias: 3,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 5.50
    },
    {
        sku: 'CIN-U-001',
        nombre: 'Cincha Reutilizada',
        tipo: 'Usado',
        unidad: 'UN',
        stock_seguridad: 100,
        stock_inicial: 500,
        proveedor: 'Interno',
        lead_time_dias: 0,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 1.50
    },
    {
        sku: 'CAR-N-001',
        nombre: 'Carraca Nueva',
        tipo: 'Nuevo',
        unidad: 'UN',
        stock_seguridad: 100,
        stock_inicial: 300,
        proveedor: 'Pendiente',
        lead_time_dias: 5,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 8.75
    },
    {
        sku: 'CAR-U-001',
        nombre: 'Carraca Reutilizada',
        tipo: 'Usado',
        unidad: 'UN',
        stock_seguridad: 50,
        stock_inicial: 200,
        proveedor: 'Interno',
        lead_time_dias: 0,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 2.00
    },
    {
        sku: 'LON-N-001',
        nombre: 'Lona Nueva',
        tipo: 'Nuevo',
        unidad: 'UN',
        stock_seguridad: 50,
        stock_inicial: 100,
        proveedor: 'Pendiente',
        lead_time_dias: 7,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 45.00
    },
    {
        sku: 'LON-U-001',
        nombre: 'Lona Reutilizada',
        tipo: 'Usado',
        unidad: 'UN',
        stock_seguridad: 20,
        stock_inicial: 50,
        proveedor: 'Interno',
        lead_time_dias: 0,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 12.00
    },
    {
        sku: 'CAN-N-001',
        nombre: 'Cantonera Nueva',
        tipo: 'Nuevo',
        unidad: 'UN',
        stock_seguridad: 400,
        stock_inicial: 1000,
        proveedor: 'Pendiente',
        lead_time_dias: 3,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 2.20
    },
    {
        sku: 'CAN-P-001',
        nombre: 'Cantonera Pequeña',
        tipo: 'Nuevo',
        unidad: 'UN',
        stock_seguridad: 200,
        stock_inicial: 500,
        proveedor: 'Pendiente',
        lead_time_dias: 3,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 1.10
    },
    {
        sku: 'CAN-U-001',
        nombre: 'Cantonera Reutilizada',
        tipo: 'Usado',
        unidad: 'UN',
        stock_seguridad: 100,
        stock_inicial: 300,
        proveedor: 'Interno',
        lead_time_dias: 0,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 0.50
    },
    {
        sku: 'ADR-P-001',
        nombre: 'Pegatina ADR',
        tipo: 'Nuevo',
        unidad: 'UN',
        stock_seguridad: 50,
        stock_inicial: 200,
        proveedor: 'Pendiente',
        lead_time_dias: 2,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 0.80
    },
    {
        sku: 'AIR-B-001',
        nombre: 'Airbag',
        tipo: 'Nuevo',
        unidad: 'UN',
        stock_seguridad: 40,
        stock_inicial: 100,
        proveedor: 'Pendiente',
        lead_time_dias: 5,
        activo: true,
        fecha_alta: '2024-01-01',
        precio_venta: 15.00
    },
];

export const INITIAL_LOADS: OperationalLoad[] = [];

export const INITIAL_CLOSINGS: MonthClosing[] = [
    { month: new Date().toISOString().slice(0, 7), status: 'OPEN' }
];
