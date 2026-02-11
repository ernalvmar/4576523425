/**
 * Billing Report Generator — HTML-based DIN-A4 Report
 * Opens a professional, printable report in a new window/tab
 * with Export PDF (print) and Export Excel (multi-sheet XML) capabilities.
 */

import { formatMonth } from './helpers';
import {
    MOCK_GENERAL_EXPENSES,
    MOCK_STORAGE_BILLING,
    MOCK_PALLET_CONSUMPTIONS,
    computePalletTotals,
    computeStorageTotals
} from '../data/billingMockData';
import * as XLSX from 'xlsx';

interface BillingLine {
    id: string;
    load_ref: string;
    date: string;
    sku_real: string;
    sku_name: string;
    qty_real: number;
    qty_bill: number;
    is_modified: boolean;
    price: number;
    type: string;
    is_meters?: boolean;
    item_amount?: number;
}

interface ReportParams {
    billingLines: BillingLine[];
    viewMonth: string;
    currentUser: { nombre?: string; email?: string };
}

// ─── CSS — Clean, light, legible design ───────────────────────────────
function getReportCSS(): string {
    return `
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
        color: #334155;
        background: #f8fafc;
        font-size: 13px;
        line-height: 1.5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    @page {
        size: A4;
        margin: 12mm 14mm;
    }

    @media print {
        body { background: white; }
        .no-print { display: none !important; }
        .page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
            min-height: auto;
        }
        .page:last-child { page-break-after: auto; }
    }

    /* ─── Toolbar (no-print) ─── */
    .toolbar {
        position: sticky; top: 0; z-index: 100;
        background: #1e293b;
        padding: 10px 24px;
        display: flex; align-items: center; justify-content: space-between;
    }
    .toolbar-title {
        color: #e2e8f0; font-size: 13px; font-weight: 500;
        letter-spacing: 0.03em;
    }
    .toolbar-buttons { display: flex; gap: 8px; }
    .toolbar-btn {
        padding: 7px 18px; border: none; border-radius: 6px;
        font-size: 12px; font-weight: 500; cursor: pointer;
        letter-spacing: 0.02em; transition: all 0.15s;
    }
    .btn-pdf {
        background: #6366f1; color: white;
    }
    .btn-pdf:hover { background: #4f46e5; }
    .btn-excel {
        background: transparent; color: #94a3b8;
        border: 1px solid #475569 !important;
    }
    .btn-excel:hover { background: #334155; color: #e2e8f0; }

    /* ─── Page container ─── */
    .page {
        width: 210mm;
        min-height: 297mm;
        margin: 16px auto;
        padding: 16mm 18mm;
        background: white;
        box-shadow: 0 1px 8px rgba(0,0,0,0.06);
        position: relative;
    }

    /* ─── Cover header ─── */
    .cover-header {
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 16px;
        margin-bottom: 20px;
    }
    .cover-title {
        font-size: 22px; font-weight: 600;
        color: #1e293b; margin-bottom: 4px;
    }
    .cover-subtitle {
        font-size: 13px; color: #64748b;
    }
    .cover-meta {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 12px 18px;
        margin-bottom: 24px;
        display: flex; gap: 32px;
        font-size: 12px; color: #64748b;
    }
    .cover-meta strong { color: #334155; font-weight: 500; }

    /* ─── Internal page header ─── */
    .page-header {
        display: flex; align-items: baseline; justify-content: space-between;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 8px; margin-bottom: 12px;
    }
    .page-header-title {
        font-size: 15px; font-weight: 600;
        color: #1e293b;
    }
    .page-header-right {
        font-size: 11px; color: #94a3b8;
    }
    .page-header-subtitle {
        font-size: 11px; color: #64748b;
        margin-bottom: 14px; line-height: 1.6;
    }

    /* ─── Section titles ─── */
    .section-title {
        font-size: 14px; font-weight: 600;
        color: #1e293b;
        margin: 20px 0 10px;
    }

    /* ─── Tables — clean and legible ─── */
    table {
        width: 100%; border-collapse: collapse;
        font-size: 11px; margin-bottom: 14px;
    }
    thead th {
        background: #f1f5f9;
        color: #475569;
        padding: 8px 10px;
        text-align: left;
        font-weight: 500;
        font-size: 10.5px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 2px solid #e2e8f0;
    }
    tbody td {
        padding: 7px 10px;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
    }
    tbody tr:hover { background: #fafbfd; }
    tfoot td {
        padding: 8px 10px;
        font-weight: 600;
        background: #f8fafc;
        color: #1e293b;
        border-top: 2px solid #e2e8f0;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-bold { font-weight: 600; }
    .text-muted { color: #94a3b8; }
    .text-meters { color: #0d9488; font-style: italic; }

    /* Per-section header color accents (subtle left border) */
    .section-accent-violet { border-left: 3px solid #8b5cf6; padding-left: 10px; }
    .section-accent-orange { border-left: 3px solid #f59e0b; padding-left: 10px; }
    .section-accent-indigo { border-left: 3px solid #6366f1; padding-left: 10px; }

    /* Table header color variants */
    .th-violet { background: #f5f3ff !important; color: #6d28d9 !important; border-bottom-color: #c4b5fd !important; }
    .th-orange { background: #fffbeb !important; color: #b45309 !important; border-bottom-color: #fcd34d !important; }
    .th-indigo { background: #eef2ff !important; color: #4338ca !important; border-bottom-color: #a5b4fc !important; }

    .tf-violet { background: #f5f3ff !important; color: #6d28d9 !important; border-top-color: #c4b5fd !important; }
    .tf-orange { background: #fffbeb !important; color: #b45309 !important; border-top-color: #fcd34d !important; }
    .tf-indigo { background: #eef2ff !important; color: #4338ca !important; border-top-color: #a5b4fc !important; }

    /* ─── Info boxes ─── */
    .info-box {
        border-radius: 6px; padding: 10px 14px;
        font-size: 11px; line-height: 1.7;
        margin-top: 10px;
    }
    .info-orange {
        background: #fffbeb; border-left: 3px solid #f59e0b;
        color: #92400e;
    }
    .info-indigo {
        background: #eef2ff; border-left: 3px solid #6366f1;
        color: #3730a3;
    }

    .summary-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 12px 16px;
        margin-top: 12px;
        font-size: 12px;
    }
    .summary-card strong { color: #1e293b; }
    .summary-card span { color: #64748b; }

    /* ─── Footer ─── */
    .page-footer {
        position: absolute; bottom: 12mm; left: 18mm; right: 18mm;
        text-align: center; font-size: 9px; color: #cbd5e1;
        border-top: 1px solid #f1f5f9; padding-top: 6px;
    }
    `;
}

// ─── Build Summary by Article ─────────────────────────────────────────
function buildSummary(billingLines: BillingLine[]) {
    const summaryByArticle = billingLines.reduce((acc: Record<string, any>, line) => {
        const isAdr = line.sku_real.toLowerCase().includes('adr') ||
            (line.sku_name && line.sku_name.toLowerCase().includes('pegatina'));
        const isStorage = line.type === 'STORAGE';
        const summarySku = isStorage ? 'ALMACENAJE' : (isAdr ? 'PEGATINA-ADR-SUM' : line.sku_real);
        const summaryName = isStorage ? 'Servicio de Almacenaje' : (isAdr ? 'Pegatinas ADR (Agrupado)' : line.sku_name);
        if (!acc[summarySku]) {
            acc[summarySku] = { name: summaryName, qty: 0, subtotal: 0, price: line.price, is_meters: line.is_meters };
        }
        acc[summarySku].qty += line.qty_bill;
        acc[summarySku].subtotal += (line.qty_bill * line.price);
        return acc;
    }, {});
    return summaryByArticle;
}

// ─── Internal page header ─────────────────────────────────────────────
function pageHeader(title: string, pageNum: number, totalPages: number, monthLabel: string): string {
    return `
    <div class="page-header">
        <div class="page-header-title">${title}</div>
        <div class="page-header-right">
            Pág. ${pageNum}/${totalPages} · ${monthLabel}
        </div>
    </div>`;
}

function pageFooter(pageNum: number, totalPages: number): string {
    return `<div class="page-footer">ENVOS Logistics — Documento generado automáticamente — Pág. ${pageNum}/${totalPages}</div>`;
}

// ─── XML helper: escape text for XML content ──────────────────────────
function xmlEscape(str: string): string {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Generate Full HTML ───────────────────────────────────────────────
function generateReportHTML(params: ReportParams): string {
    const { billingLines, viewMonth, currentUser } = params;
    const monthLabel = formatMonth(viewMonth);
    const timestamp = new Date().toLocaleString('es-ES');
    const userName = currentUser.nombre || currentUser.email || 'Usuario';
    const TOTAL_PAGES = 5;

    const summary = buildSummary(billingLines);
    const totalAmount = Object.values(summary).reduce((s: number, i: any) => s + Number(i.subtotal), 0);
    const storageTotals = computeStorageTotals(MOCK_STORAGE_BILLING);
    const palletTotals = computePalletTotals(MOCK_PALLET_CONSUMPTIONS);

    // ─── PAGE 1: Cover + Summary ───
    const summaryRows = Object.entries(summary).map(([sku, data]: [string, any]) => {
        const isMeter = sku.toLowerCase().includes('cinta') || data.name.toLowerCase().includes('cinta blanca');
        return `<tr>
            <td${isMeter ? ' class="text-meters"' : ''}>${data.name}</td>
            <td>${sku}</td>
            <td class="text-center">${data.qty} ${isMeter ? 'm' : 'ud'}</td>
            <td class="text-right">${Number(data.price).toFixed(2)} €</td>
            <td class="text-right text-bold">${Number(data.subtotal).toFixed(2)} €</td>
        </tr>`;
    }).join('\n');

    const page1 = `
    <div class="page">
        <div class="cover-header">
            <div class="cover-title">Informe de Facturación</div>
            <div class="cover-subtitle">Plataforma Logística SVQ — Servicios Obramat</div>
        </div>
        <div class="cover-meta">
            <div><strong>Periodo:</strong> ${monthLabel}</div>
            <div><strong>Generado:</strong> ${timestamp}</div>
            <div><strong>Usuario:</strong> ${userName}</div>
        </div>

        <div class="section-title">1. Resumen de Consumo Mensual</div>
        <table>
            <thead><tr>
                <th>Artículo</th><th>SKU</th><th class="text-center">Cantidad</th>
                <th class="text-right">Precio Unit.</th><th class="text-right">Subtotal</th>
            </tr></thead>
            <tbody>${summaryRows}</tbody>
            <tfoot><tr>
                <td colspan="3"></td>
                <td class="text-right">TOTAL SERVICIOS</td>
                <td class="text-right">${totalAmount.toFixed(2)} €</td>
            </tr></tfoot>
        </table>
        ${pageFooter(1, TOTAL_PAGES)}
    </div>`;

    // ─── PAGE 2: Detailed Loads ───
    const loadRows = billingLines.map(line => {
        const cls = line.is_meters ? ' class="text-meters"' : '';
        return `<tr>
            <td>${line.date}</td>
            <td>${line.load_ref}</td>
            <td${cls}>${(line.sku_name || 'Desconocido').substring(0, 45)}</td>
            <td>${line.sku_real}</td>
            <td class="text-right">${line.qty_bill}${line.is_meters ? ' m' : ''}</td>
        </tr>`;
    }).join('\n');

    const page2 = `
    <div class="page">
        ${pageHeader('2. Detalle de Cargas Operativas', 2, TOTAL_PAGES, monthLabel)}
        <table>
            <thead><tr>
                <th>Fecha</th><th>Ref. Carga</th><th>Material</th><th>SKU</th><th class="text-right">Cant.</th>
            </tr></thead>
            <tbody>${loadRows}</tbody>
        </table>
        ${pageFooter(2, TOTAL_PAGES)}
    </div>`;

    // ─── PAGE 3: General Expenses ───
    const expenseRows = MOCK_GENERAL_EXPENSES.map(e => `<tr>
        <td>${e.fecha}</td><td>${e.contenedor}</td>
        <td class="text-center">${e.cantidad}</td>
        <td>${e.descripcion}</td>
        <td>${e.pedido}</td>
        <td>${e.proveedor}</td>
    </tr>`).join('\n');
    const totalExpCant = MOCK_GENERAL_EXPENSES.reduce((s, e) => s + e.cantidad, 0);

    const page3 = `
    <div class="page">
        ${pageHeader('3. Gastos Generales — Manipulación en Contenedor', 3, TOTAL_PAGES, monthLabel)}
        <div class="page-header-subtitle">
            Detalle de los gastos generales enviados a la tienda de Jinámar durante el período del mes de ${monthLabel}.
        </div>
        <table>
            <thead><tr>
                <th class="th-violet">Fecha</th><th class="th-violet">Contenedor</th>
                <th class="th-violet text-center">Cant.</th><th class="th-violet">Descripción</th>
                <th class="th-violet">Pedido</th><th class="th-violet">Proveedor</th>
            </tr></thead>
            <tbody>${expenseRows}</tbody>
            <tfoot><tr>
                <td class="tf-violet"></td><td class="tf-violet"></td>
                <td class="tf-violet text-center">${totalExpCant}</td>
                <td class="tf-violet">Total Gastos Generales</td>
                <td class="tf-violet"></td><td class="tf-violet"></td>
            </tr></tfoot>
        </table>
        ${pageFooter(3, TOTAL_PAGES)}
    </div>`;

    // ─── PAGE 4: Storage ───
    const storageRows = MOCK_STORAGE_BILLING.map(s => `<tr>
        <td>${s.contenedor}</td>
        <td>${s.pedidos.substring(0, 30)}</td>
        <td>${s.proveedor.substring(0, 25)}</td>
        <td>${s.fecha_entrada}</td>
        <td>${s.fecha_inicio_facturacion}</td>
        <td>${s.fecha_salida || '<em>En curso</em>'}</td>
        <td class="text-center text-bold">${s.dias_facturables}</td>
        <td class="text-right text-bold">${s.importe.toFixed(2)} €</td>
    </tr>`).join('\n');

    const page4 = `
    <div class="page">
        ${pageHeader('4. Desglose de Almacenaje', 4, TOTAL_PAGES, monthLabel)}
        <div class="page-header-subtitle">
            Detalle de costes de almacenaje. Los primeros 10 días naturales desde la entrada son gratuitos.<br/>
            La facturación comienza a partir del día 11 a razón de 0,18 €/día por elemento/bulto/palet.
        </div>
        <table>
            <thead><tr>
                <th class="th-orange">Contenedor</th><th class="th-orange">Pedidos</th>
                <th class="th-orange">Proveedor</th><th class="th-orange">F. Entrada</th>
                <th class="th-orange">F. Inicio Fact.</th><th class="th-orange">F. Salida</th>
                <th class="th-orange text-center">Días Fact.</th><th class="th-orange text-right">Importe</th>
            </tr></thead>
            <tbody>${storageRows}</tbody>
            <tfoot><tr>
                <td class="tf-orange" colspan="5"></td>
                <td class="tf-orange text-right">Total</td>
                <td class="tf-orange text-center">${storageTotals.totalDias}</td>
                <td class="tf-orange text-right">${storageTotals.totalImporte.toFixed(2)} €</td>
            </tr></tfoot>
        </table>
        <div class="info-box info-orange">
            <strong>Política de almacenaje:</strong><br/>
            • Los primeros 10 días naturales desde la fecha de entrada son gratuitos.<br/>
            • A partir del día 11 se cobra 0,18 €/día por elemento/bulto/palet hasta la fecha de salida o fin de periodo contable.<br/>
            • Los elementos marcados "En curso" continúan acumulando días en el siguiente periodo.
        </div>
        ${pageFooter(4, TOTAL_PAGES)}
    </div>`;

    // ─── PAGE 5: Pallets ───
    const palletRows = MOCK_PALLET_CONSUMPTIONS.map(p => {
        const isAgrupado = p.agencia === 'AGRUPADOS';
        const rowStyle = isAgrupado ? ' style="background:#f5f3ff;font-style:italic"' : '';
        return `<tr${rowStyle}>
            <td>${p.fecha}</td>
            <td>${p.agencia}</td>
            <td>${p.proveedor.substring(0, 30)}</td>
            <td>${p.pedido || '—'}</td>
            <td class="text-right">${p.peso > 0 ? p.peso.toFixed(1) : '—'}</td>
            <td class="text-center">${p.num_bultos > 0 ? p.num_bultos : '—'}</td>
            <td class="text-center text-bold">${p.palets_resultantes}</td>
        </tr>`;
    }).join('\n');

    const page5 = `
    <div class="page">
        ${pageHeader('5. Consumo de Palets — Detalle Mensual', 5, TOTAL_PAGES, monthLabel)}
        <div class="page-header-subtitle">
            Detalle de la paletización de mercancía suelta recibida durante el periodo contable.
        </div>
        <table>
            <thead><tr>
                <th class="th-indigo">Fecha</th><th class="th-indigo">Agencia</th>
                <th class="th-indigo">Proveedor</th><th class="th-indigo">Pedido</th>
                <th class="th-indigo text-right">Peso (kg)</th>
                <th class="th-indigo text-center">Bultos</th>
                <th class="th-indigo text-center">Palets</th>
            </tr></thead>
            <tbody>${palletRows}</tbody>
            <tfoot><tr>
                <td class="tf-indigo" colspan="3"></td>
                <td class="tf-indigo text-right">Totales</td>
                <td class="tf-indigo text-right">${palletTotals.totalPeso.toFixed(1)} kg</td>
                <td class="tf-indigo text-center">${palletTotals.totalBultos}</td>
                <td class="tf-indigo text-center">${palletTotals.totalPalets}</td>
            </tr></tfoot>
        </table>
        <div class="summary-card">
            <strong>Resumen:</strong> ${palletTotals.totalPalets} palets consumidos en el periodo<br/>
            <span>Peso total manipulado: ${palletTotals.totalPeso.toFixed(1)} kg — Bultos procesados: ${palletTotals.totalBultos}</span>
        </div>
        ${pageFooter(5, TOTAL_PAGES)}
    </div>`;

    // ─── Assemble full document ───────────────────────────────────────
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Informe de Facturación — ${monthLabel} — ENVOS Logistics</title>
    <style>${getReportCSS()}</style>
</head>
<body>
    <div class="toolbar no-print">
        <div class="toolbar-title">ENVOS · Informe de Facturación · ${monthLabel}</div>
        <div class="toolbar-buttons">
            <button class="toolbar-btn btn-pdf" onclick="window.print()">Exportar PDF</button>
            <button class="toolbar-btn btn-excel" id="btn-export-excel">Exportar Excel</button>
        </div>
    </div>
    ${page1}
    ${page2}
    ${page3}
    ${page4}
    ${page5}
</body>
</html>`;
}

// ─── Build Excel workbook using SheetJS and trigger download ──────────
function exportExcelXlsx(params: ReportParams): void {

    const { billingLines, viewMonth } = params;
    const summary = buildSummary(billingLines);
    const storageTotals = computeStorageTotals(MOCK_STORAGE_BILLING);
    const palletTotals = computePalletTotals(MOCK_PALLET_CONSUMPTIONS);

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Resumen ──
    const summaryData: any[][] = [['Artículo', 'SKU', 'Cantidad', 'Precio Unit.', 'Subtotal']];
    let total = 0;
    Object.entries(summary).forEach(([sku, data]: [string, any]) => {
        const isMeter = sku.toLowerCase().includes('cinta') || data.name.toLowerCase().includes('cinta blanca');
        summaryData.push([
            data.name,
            sku,
            `${data.qty} ${isMeter ? 'm' : 'ud'}`,
            Number(data.price),
            Number(data.subtotal)
        ]);
        total += Number(data.subtotal);
    });
    summaryData.push(['', '', '', 'TOTAL SERVICIOS', total]);
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    // Set column widths
    ws1['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

    // ── Sheet 2: Cargas Operativas ──
    const loadData: any[][] = [['Fecha', 'Ref. Carga', 'Material', 'SKU', 'Cantidad']];
    billingLines.forEach(line => {
        loadData.push([
            line.date,
            line.load_ref,
            (line.sku_name || 'Desconocido').substring(0, 45),
            line.sku_real,
            `${line.qty_bill}${line.is_meters ? ' m' : ''}`
        ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(loadData);
    ws2['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 40 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Cargas Operativas');

    // ── Sheet 3: Gastos Generales ──
    const expData: any[][] = [['Fecha', 'Contenedor', 'Cantidad', 'Descripción', 'Pedido', 'Proveedor']];
    MOCK_GENERAL_EXPENSES.forEach(e => {
        expData.push([e.fecha, e.contenedor, e.cantidad, e.descripcion, e.pedido, e.proveedor]);
    });
    const totalExpCant = MOCK_GENERAL_EXPENSES.reduce((s, e) => s + e.cantidad, 0);
    expData.push(['', '', totalExpCant, 'Total Gastos Generales', '', '']);
    const ws3 = XLSX.utils.aoa_to_sheet(expData);
    ws3['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 40 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Gastos Generales');

    // ── Sheet 4: Almacenaje ──
    const storData: any[][] = [['Contenedor', 'Pedidos', 'Proveedor', 'F. Entrada', 'F. Inicio Fact.', 'F. Salida', 'Días Fact.', 'Importe']];
    MOCK_STORAGE_BILLING.forEach(s => {
        storData.push([
            s.contenedor, s.pedidos, s.proveedor,
            s.fecha_entrada, s.fecha_inicio_facturacion,
            s.fecha_salida || 'En curso',
            s.dias_facturables, s.importe
        ]);
    });
    storData.push(['', '', '', '', '', 'Total', storageTotals.totalDias, storageTotals.totalImporte]);
    const ws4 = XLSX.utils.aoa_to_sheet(storData);
    ws4['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 25 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Almacenaje');

    // ── Sheet 5: Palets ──
    const palData: any[][] = [['Fecha', 'Agencia', 'Proveedor', 'Pedido', 'Peso (kg)', 'Bultos', 'Palets']];
    MOCK_PALLET_CONSUMPTIONS.forEach(p => {
        palData.push([
            p.fecha, p.agencia, p.proveedor,
            p.pedido || '—',
            p.peso > 0 ? p.peso : '—',
            p.num_bultos > 0 ? p.num_bultos : '—',
            p.palets_resultantes
        ]);
    });
    palData.push(['', '', '', 'Totales', palletTotals.totalPeso, palletTotals.totalBultos, palletTotals.totalPalets]);
    const ws5 = XLSX.utils.aoa_to_sheet(palData);
    ws5['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Palets');

    // ── Write and download ──
    XLSX.writeFile(wb, `ENVOS_Obramat_Facturacion_${viewMonth}.xlsx`);
}

// ─── Public: Open report in new window ────────────────────────────────
export function openBillingReport(params: ReportParams): void {
    const html = generateReportHTML(params);
    const win = window.open('', '_blank');
    if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();

        // Inject the Excel export function into the new window after it finishes loading
        const excelBtn = win.document.getElementById('btn-export-excel');
        if (excelBtn) {
            excelBtn.addEventListener('click', () => {
                exportExcelXlsx(params);
            });
        }
    }
}
