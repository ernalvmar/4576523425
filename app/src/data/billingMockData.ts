// ============================================================
// MOCK DATA for Billing PDF Report - Enero 2026
// Based on real Excel data provided by client
// ============================================================

// --- GASTOS GENERALES (from "GASTOS GENERALES.xlsx") ---
export interface GeneralExpenseMock {
    fecha: string;
    contenedor: string;
    cantidad: number;
    descripcion: string;
    pedido: string;
    proveedor: string;
}

export const MOCK_GENERAL_EXPENSES: GeneralExpenseMock[] = [
    { fecha: '2026-01-03', contenedor: 'BOLU5911391', cantidad: 1, descripcion: 'BULTO', pedido: '4500283583', proveedor: 'MADECO' },
    { fecha: '2026-01-03', contenedor: 'BOLU5911391', cantidad: 1, descripcion: 'BULTO', pedido: '4500282427', proveedor: 'CAP' },
    { fecha: '2026-01-05', contenedor: 'TLLU4819540', cantidad: 3, descripcion: 'BULTO', pedido: '4500283598', proveedor: 'B&M CONSUMIBLES' },
    { fecha: '2026-01-05', contenedor: 'TLLU1676573', cantidad: 4, descripcion: 'PALLET', pedido: '1849053016', proveedor: 'CESION OVIEDO' },
    { fecha: '2026-01-07', contenedor: 'R-9027-BCT', cantidad: 4, descripcion: 'BULTOS', pedido: '4500283585', proveedor: 'MADERAS DAGANZO' },
    { fecha: '2026-01-08', contenedor: 'BOLU5902337', cantidad: 1, descripcion: 'BULTO', pedido: '4500276851', proveedor: 'TOP FORM' },
    { fecha: '2026-01-09', contenedor: 'CNEU4553550', cantidad: 1, descripcion: 'BULTO', pedido: '4500281835', proveedor: 'IBERCODE' },
    { fecha: '2026-01-09', contenedor: 'CNEU4553550', cantidad: 1, descripcion: 'PALLET', pedido: '4500285874', proveedor: 'IBERCODE' },
];

// --- ALMACENAJE (Storage) MOCK - 10 records ---
export interface StorageBillingMock {
    contenedor: string;
    pedidos: string;
    proveedor: string;
    fecha_entrada: string;
    fecha_inicio_facturacion: string; // entry_date + 10 days
    fecha_salida: string | null;
    procedimiento: string;
    dias_facturables: number;
    coste_dia: number;
    importe: number;
}

export const MOCK_STORAGE_BILLING: StorageBillingMock[] = [
    {
        contenedor: 'CNEU4553550', pedidos: '4500281835 / 4500285874', proveedor: 'IBERCODE',
        fecha_entrada: '2025-12-18', fecha_inicio_facturacion: '2025-12-28',
        fecha_salida: '2026-01-15', procedimiento: 'ENVIAR',
        dias_facturables: 18, coste_dia: 0.18, importe: 3.24
    },
    {
        contenedor: 'BOLU5911391', pedidos: '4500283583 / 4500282427', proveedor: 'MADECO / CAP',
        fecha_entrada: '2025-12-20', fecha_inicio_facturacion: '2025-12-30',
        fecha_salida: '2026-01-10', procedimiento: 'RECOGER',
        dias_facturables: 11, coste_dia: 0.18, importe: 1.98
    },
    {
        contenedor: 'TLLU4819540', pedidos: '4500283598', proveedor: 'B&M CONSUMIBLES',
        fecha_entrada: '2025-12-22', fecha_inicio_facturacion: '2026-01-01',
        fecha_salida: '2026-01-20', procedimiento: 'ENVIAR',
        dias_facturables: 19, coste_dia: 0.18, importe: 3.42
    },
    {
        contenedor: 'BOLU5902337', pedidos: '4500276851', proveedor: 'TOP FORM',
        fecha_entrada: '2025-12-27', fecha_inicio_facturacion: '2026-01-06',
        fecha_salida: '2026-01-14', procedimiento: 'RECOGER',
        dias_facturables: 8, coste_dia: 0.18, importe: 1.44
    },
    {
        contenedor: 'TLLU1676573', pedidos: '1849053016', proveedor: 'CESION OVIEDO',
        fecha_entrada: '2026-01-02', fecha_inicio_facturacion: '2026-01-12',
        fecha_salida: '2026-01-25', procedimiento: 'ENVIAR',
        dias_facturables: 13, coste_dia: 0.18, importe: 2.34
    },
    {
        contenedor: 'MSKU8847621', pedidos: '4500290112', proveedor: 'FERRETERIA BEZARES',
        fecha_entrada: '2026-01-03', fecha_inicio_facturacion: '2026-01-13',
        fecha_salida: null, procedimiento: 'DESTRUIR',
        dias_facturables: 12, coste_dia: 0.18, importe: 2.16
    },
    {
        contenedor: 'R-9027-BCT', pedidos: '4500283585', proveedor: 'MADERAS DAGANZO',
        fecha_entrada: '2026-01-04', fecha_inicio_facturacion: '2026-01-14',
        fecha_salida: '2026-01-22', procedimiento: 'RECOGER',
        dias_facturables: 8, coste_dia: 0.18, importe: 1.44
    },
    {
        contenedor: 'TGBU7734892', pedidos: '4500287445 / 4500287511', proveedor: 'SCHNEIDER',
        fecha_entrada: '2026-01-05', fecha_inicio_facturacion: '2026-01-15',
        fecha_salida: '2026-01-23', procedimiento: 'ENVIAR',
        dias_facturables: 8, coste_dia: 0.18, importe: 1.44
    },
    {
        contenedor: 'FSCU9182033', pedidos: '4500291003', proveedor: 'DELTA PLUS',
        fecha_entrada: '2026-01-07', fecha_inicio_facturacion: '2026-01-17',
        fecha_salida: '2026-01-25', procedimiento: 'ENVIAR',
        dias_facturables: 8, coste_dia: 0.18, importe: 1.44
    },
    {
        contenedor: 'SEGU4410576', pedidos: '4500289200', proveedor: 'SNA EUROPE',
        fecha_entrada: '2026-01-10', fecha_inicio_facturacion: '2026-01-20',
        fecha_salida: null, procedimiento: 'ENVIAR',
        dias_facturables: 5, coste_dia: 0.18, importe: 0.90
    },
];

// --- CONSUMO DE PALETS (from "LISTA PROVEEDORES Y PALET.xlsx") ---
export interface PalletConsumptionMock {
    fecha: string;
    agencia: string;
    proveedor: string;
    pedido: string;
    peso: number;
    num_bultos: number;
    palets_resultantes: number;
}

export const MOCK_PALLET_CONSUMPTIONS: PalletConsumptionMock[] = [
    { fecha: '2026-01-02', agencia: 'TSB', proveedor: 'ARTARAZ', pedido: '1804352474', peso: 73, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-02', agencia: 'DACHSER', proveedor: 'PEYGRAN', pedido: '1804367003', peso: 88, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-02', agencia: 'DACHSER', proveedor: 'VISIOTECH', pedido: '1804328014', peso: 81, num_bultos: 8, palets_resultantes: 1 },
    { fecha: '2026-01-02', agencia: 'NTL', proveedor: 'SOLERA', pedido: '1804335031', peso: 63, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-02', agencia: 'DHL', proveedor: 'HIDRAHIDROLOGIC', pedido: '1804347566', peso: 38, num_bultos: 3, palets_resultantes: 1 },
    { fecha: '2026-01-02', agencia: 'REDUR', proveedor: 'BRESME', pedido: '1804210348', peso: 40, num_bultos: 11, palets_resultantes: 1 },
    { fecha: '2026-01-02', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 3 },
    { fecha: '2026-01-05', agencia: 'DACHSER', proveedor: 'M. PASCUAL', pedido: '1804347670', peso: 54, num_bultos: 2, palets_resultantes: 1 },
    { fecha: '2026-01-05', agencia: 'NTL', proveedor: 'SOLERA', pedido: '1804335050', peso: 37, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-05', agencia: 'NTL', proveedor: 'ALMESA', pedido: '1804343400', peso: 99, num_bultos: 4, palets_resultantes: 1 },
    { fecha: '2026-01-05', agencia: 'TDN', proveedor: 'LUMSEVI', pedido: '1804352382', peso: 155, num_bultos: 13, palets_resultantes: 1 },
    { fecha: '2026-01-05', agencia: 'DHL', proveedor: 'MICEL-VEGA', pedido: '1804352605', peso: 40, num_bultos: 4, palets_resultantes: 1 },
    { fecha: '2026-01-05', agencia: 'DHL', proveedor: 'MICEL-VEGA', pedido: '1804221845', peso: 63, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-05', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804334975', peso: 47, num_bultos: 16, palets_resultantes: 1 },
    { fecha: '2026-01-05', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804339571', peso: 85, num_bultos: 9, palets_resultantes: 1 },
    { fecha: '2026-01-05', agencia: 'DHL', proveedor: 'SNA', pedido: '1804343276', peso: 68, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-05', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 3 },
    { fecha: '2026-01-07', agencia: 'CBL', proveedor: 'UGROUP', pedido: '1804343278', peso: 53.6, num_bultos: 4, palets_resultantes: 1 },
    { fecha: '2026-01-07', agencia: 'CBL', proveedor: 'UGROUP', pedido: '1804204057', peso: 20.08, num_bultos: 3, palets_resultantes: 1 },
    { fecha: '2026-01-07', agencia: 'DACHSER', proveedor: 'DELTA PLUS', pedido: '1804266378', peso: 185, num_bultos: 12, palets_resultantes: 1 },
    { fecha: '2026-01-07', agencia: 'DACHSER', proveedor: 'DELTA PLUS', pedido: '1804344005', peso: 52, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-07', agencia: 'DACHSER', proveedor: 'VELILLA', pedido: '1804352499', peso: 76, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-07', agencia: 'PALMACARGO', proveedor: 'VIRUTEX', pedido: '1804335129', peso: 49, num_bultos: 2, palets_resultantes: 1 },
    { fecha: '2026-01-07', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804356728', peso: 151, num_bultos: 25, palets_resultantes: 1 },
    { fecha: '2026-01-07', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 2 },
    { fecha: '2026-01-08', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804343343', peso: 88, num_bultos: 9, palets_resultantes: 1 },
    { fecha: '2026-01-08', agencia: 'DHL', proveedor: 'TRES COMERCIAL', pedido: '1804339740', peso: 49, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-08', agencia: 'DSV', proveedor: 'CROMADOS MODERNOS', pedido: '1804343050', peso: 75, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-08', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 2 },
    { fecha: '2026-01-09', agencia: 'DHL', proveedor: 'MICEL VEGA', pedido: '1804221826', peso: 54, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-09', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 2 },
    { fecha: '2026-01-12', agencia: 'DACHSER', proveedor: 'GEWISS', pedido: '1804339696', peso: 38, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-12', agencia: 'DHL', proveedor: 'JUBA', pedido: '1804356756', peso: 101, num_bultos: 15, palets_resultantes: 1 },
    { fecha: '2026-01-12', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804352394', peso: 91, num_bultos: 10, palets_resultantes: 1 },
    { fecha: '2026-01-12', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804347596', peso: 108, num_bultos: 13, palets_resultantes: 1 },
    { fecha: '2026-01-12', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804343310', peso: 132, num_bultos: 30, palets_resultantes: 1 },
    { fecha: '2026-01-12', agencia: 'SCHENKER', proveedor: 'CROMADOS MODERNOS', pedido: '1804221803', peso: 70, num_bultos: 4, palets_resultantes: 1 },
    { fecha: '2026-01-12', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804356748', peso: 56, num_bultos: 7, palets_resultantes: 1 },
    { fecha: '2026-01-12', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 2 },
    { fecha: '2026-01-13', agencia: 'DACHSER', proveedor: 'VELILLA', pedido: '1804378003', peso: 71, num_bultos: 4, palets_resultantes: 1 },
    { fecha: '2026-01-13', agencia: 'DACHSER', proveedor: 'VELILLA', pedido: '1804383268', peso: 46, num_bultos: 3, palets_resultantes: 1 },
    { fecha: '2026-01-13', agencia: 'DACHSER', proveedor: 'LONG XIAN', pedido: '1804323016', peso: 94, num_bultos: 8, palets_resultantes: 1 },
    { fecha: '2026-01-13', agencia: 'DACHSER', proveedor: 'LONG XIAN', pedido: '1804352400', peso: 127, num_bultos: 9, palets_resultantes: 1 },
    { fecha: '2026-01-13', agencia: 'DACHSER', proveedor: 'PEYGRAN', pedido: '1804380061', peso: 87, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-13', agencia: 'REDUR', proveedor: 'SOLERA', pedido: '1804356802', peso: 74, num_bultos: 7, palets_resultantes: 1 },
    { fecha: '2026-01-13', agencia: 'DSV', proveedor: 'CROMADOS MODERNOS', pedido: '1804361148', peso: 90, num_bultos: 8, palets_resultantes: 1 },
    { fecha: '2026-01-13', agencia: 'DHL', proveedor: 'JUBA', pedido: '1804377983', peso: 70, num_bultos: 13, palets_resultantes: 1 },
    { fecha: '2026-01-13', agencia: 'DHL', proveedor: 'JUBA', pedido: '1804373611', peso: 82, num_bultos: 9, palets_resultantes: 1 },
    { fecha: '2026-01-13', agencia: 'TSB', proveedor: 'LAZ', pedido: '1804356753', peso: 61, num_bultos: 1, palets_resultantes: 1 },
    { fecha: '2026-01-13', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 2 },
    { fecha: '2026-01-14', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 1 },
    { fecha: '2026-01-14', agencia: 'NTL', proveedor: 'SOLERA', pedido: '1804303252', peso: 74, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-14', agencia: 'DACHSER', proveedor: 'PEYGRAN', pedido: '1804373536', peso: 102, num_bultos: 7, palets_resultantes: 1 },
    { fecha: '2026-01-14', agencia: 'DACHSER', proveedor: 'PEYGRAN', pedido: '1804373461', peso: 102, num_bultos: 7, palets_resultantes: 1 },
    { fecha: '2026-01-14', agencia: 'DACHSER', proveedor: 'M PASCUAL', pedido: '1804380156', peso: 66, num_bultos: 2, palets_resultantes: 1 },
    { fecha: '2026-01-14', agencia: 'DACHSER', proveedor: 'GEWISS', pedido: '1804373718', peso: 33, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-14', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 2 },
    { fecha: '2026-01-15', agencia: 'CBL', proveedor: 'GALOCANTA', pedido: '1804393720', peso: 79.6, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-15', agencia: 'TDN', proveedor: 'SIMON BRICO', pedido: '1804328159', peso: 34, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-15', agencia: 'DHL', proveedor: 'MEDICLINICS', pedido: '1804393460', peso: 45, num_bultos: 3, palets_resultantes: 1 },
    { fecha: '2026-01-15', agencia: 'DHL', proveedor: 'SNA', pedido: '1804390602', peso: 156, num_bultos: 10, palets_resultantes: 1 },
    { fecha: '2026-01-15', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804364039', peso: 122, num_bultos: 26, palets_resultantes: 1 },
    { fecha: '2026-01-15', agencia: 'TXT', proveedor: 'SOUDAL', pedido: '1804390711', peso: 44, num_bultos: 7, palets_resultantes: 1 },
    { fecha: '2026-01-15', agencia: 'REDUR', proveedor: 'SOLERA', pedido: '1804373621', peso: 112, num_bultos: 7, palets_resultantes: 1 },
    { fecha: '2026-01-15', agencia: 'DACHSER', proveedor: 'VELILLA', pedido: '1804393649', peso: 91, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-15', agencia: 'DACHSER', proveedor: 'GEWISS', pedido: '1804361100', peso: 46, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-15', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 1 },
    { fecha: '2026-01-16', agencia: 'DACHSER', proveedor: 'DELTA PLUS', pedido: '1804394580', peso: 70, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-16', agencia: 'DACHSER', proveedor: 'VELILLA', pedido: '1804383284', peso: 94, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-16', agencia: 'DACHSER', proveedor: 'VELILLA', pedido: '1804393613', peso: 96, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-16', agencia: 'DACHSER', proveedor: 'PEYGRAN', pedido: '1804386081', peso: 72, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-16', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 1 },
    { fecha: '2026-01-19', agencia: 'REDUR', proveedor: 'SPAX', pedido: '1804386244', peso: 110.8, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-19', agencia: 'REDUR', proveedor: 'SOLERA', pedido: '1804380103', peso: 50, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-19', agencia: 'DHL', proveedor: 'MAYDISA', pedido: '1804386264', peso: 166, num_bultos: 7, palets_resultantes: 1 },
    { fecha: '2026-01-19', agencia: 'DHL', proveedor: 'JUBA', pedido: '1804399015', peso: 79, num_bultos: 14, palets_resultantes: 1 },
    { fecha: '2026-01-19', agencia: 'REDUR', proveedor: 'SOLERA', pedido: '1804373647', peso: 102, num_bultos: 7, palets_resultantes: 1 },
    { fecha: '2026-01-19', agencia: 'DACHSER', proveedor: 'ROMBULL', pedido: '1804399094', peso: 92, num_bultos: 1, palets_resultantes: 1 },
    { fecha: '2026-01-19', agencia: 'DACHSER', proveedor: 'ALIAXIS', pedido: '1804393671', peso: 34, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-19', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804390610', peso: 46, num_bultos: 9, palets_resultantes: 1 },
    { fecha: '2026-01-19', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 3 },
    { fecha: '2026-01-20', agencia: 'DHL', proveedor: 'LUCECO', pedido: '1804393662', peso: 72, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-20', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 2 },
    { fecha: '2026-01-21', agencia: 'DHL', proveedor: 'JUBA', pedido: '1804386141', peso: 45, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-21', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804393499', peso: 60, num_bultos: 14, palets_resultantes: 1 },
    { fecha: '2026-01-21', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 2 },
    { fecha: '2026-01-21', agencia: 'DHL', proveedor: 'FISCHER', pedido: '1804413705', peso: 106, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-21', agencia: 'DHL', proveedor: 'ARREGUI', pedido: '1804409028', peso: 71, num_bultos: 8, palets_resultantes: 1 },
    { fecha: '2026-01-22', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804398975', peso: 37, num_bultos: 10, palets_resultantes: 1 },
    { fecha: '2026-01-22', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 2 },
    { fecha: '2026-01-22', agencia: 'REDUR', proveedor: 'BRESME', pedido: '1804413610', peso: 313, num_bultos: 14, palets_resultantes: 1 },
    { fecha: '2026-01-22', agencia: 'REDUR', proveedor: 'SOLERA', pedido: '1804393617', peso: 66, num_bultos: 4, palets_resultantes: 1 },
    { fecha: '2026-01-22', agencia: 'REDUR', proveedor: 'SOLERA', pedido: '1804393596', peso: 114, num_bultos: 9, palets_resultantes: 1 },
    { fecha: '2026-01-22', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 2 },
    { fecha: '2026-01-23', agencia: 'REDUR', proveedor: 'ACCESORIOS Y RESORTES', pedido: '1804399541', peso: 85.6, num_bultos: 10, palets_resultantes: 1 },
    { fecha: '2026-01-23', agencia: 'DHL', proveedor: 'LUCECO', pedido: '1804399547', peso: 68, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-23', agencia: 'DHL', proveedor: 'NILFISK', pedido: '1804347582', peso: 64, num_bultos: 3, palets_resultantes: 1 },
    { fecha: '2026-01-23', agencia: 'DACHSER', proveedor: 'M PASCUAL', pedido: '1804393705', peso: 37, num_bultos: 2, palets_resultantes: 1 },
    { fecha: '2026-01-23', agencia: 'DACHSER', proveedor: 'PEYGRAN', pedido: '1804422225', peso: 88, num_bultos: 6, palets_resultantes: 1 },
    { fecha: '2026-01-23', agencia: 'REDUR', proveedor: '3M', pedido: '1804413600', peso: 23.4, num_bultos: 12, palets_resultantes: 1 },
    { fecha: '2026-01-23', agencia: 'REDUR', proveedor: 'BRESME', pedido: '1804409013', peso: 613, num_bultos: 10, palets_resultantes: 1 },
    { fecha: '2026-01-23', agencia: 'AGRUPADOS', proveedor: 'AGRUPADOS', pedido: '', peso: 0, num_bultos: 0, palets_resultantes: 4 },
    { fecha: '2026-01-26', agencia: 'DACHSER', proveedor: 'VELILLA', pedido: '1804405478', peso: 67, num_bultos: 5, palets_resultantes: 1 },
    { fecha: '2026-01-26', agencia: 'DHL', proveedor: 'SCHNEIDER', pedido: '1804405353', peso: 38, num_bultos: 6, palets_resultantes: 1 },
];

// Computed totals for the report
export const computePalletTotals = (data: PalletConsumptionMock[]) => {
    const totalPalets = data.reduce((sum, d) => sum + d.palets_resultantes, 0);
    const totalPeso = data.reduce((sum, d) => sum + d.peso, 0);
    const totalBultos = data.reduce((sum, d) => sum + d.num_bultos, 0);
    return { totalPalets, totalPeso, totalBultos };
};

export const computeStorageTotals = (data: StorageBillingMock[]) => {
    const totalDias = data.reduce((sum, d) => sum + d.dias_facturables, 0);
    const totalImporte = data.reduce((sum, d) => sum + d.importe, 0);
    return { totalDias, totalImporte };
};
