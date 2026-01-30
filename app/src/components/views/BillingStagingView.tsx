import React, { useState, useMemo } from 'react';
import { FileText, Calendar, Lock, ChevronRight } from 'lucide-react';
import { OperationalLoad, Article, MonthClosing } from '../../types';
import { formatMonth } from '../../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BillingStagingViewProps {
    loads: OperationalLoad[];
    currentMonth: string;
    articles: Article[];
    closings: MonthClosing[];
    billingOverrides: Record<string, number>;
    onUpdateOverride: (id: string, qty: number) => void;
    notify: (msg: string, type?: any) => void;
    currentUser: any;
}

export const BillingStagingView: React.FC<BillingStagingViewProps> = ({
    loads,
    currentMonth,
    articles,
    closings,
    billingOverrides,
    onUpdateOverride,
    notify,
    currentUser
}) => {
    const [viewMonth, setViewMonth] = useState(currentMonth);

    const availableMonths = useMemo(() => {
        const months = new Set(closings.map(c => c.month));
        months.add(currentMonth);
        return Array.from(months).sort().reverse();
    }, [closings, currentMonth]);

    const filteredLoads = useMemo(() => {
        return loads.filter(l => l.date.startsWith(viewMonth));
    }, [loads, viewMonth]);

    const billingLines = useMemo(() => {
        const lines: any[] = [];
        filteredLoads.forEach((load) => {
            Object.entries(load.consumptions).forEach(([sku, val]) => {
                const qty = val as number;
                if (qty > 0) {
                    const article = articles.find(a => a.sku === sku);
                    const overrideKey = `${load.load_uid}-${sku}`;
                    const billedQty = billingOverrides[overrideKey] !== undefined ? billingOverrides[overrideKey] : qty;

                    lines.push({
                        id: overrideKey,
                        load_ref: load.ref_carga,
                        date: load.date,
                        sku_real: sku,
                        sku_name: article?.nombre,
                        qty_real: qty,
                        qty_bill: billedQty,
                        is_modified: billingOverrides[overrideKey] !== undefined && billingOverrides[overrideKey] !== qty,
                        price: article?.precio_venta || 0
                    });
                }
            });
        });
        return lines;
    }, [filteredLoads, articles, billingOverrides]);

    const handleGenerateReport = () => {
        if (billingLines.length === 0) {
            notify('No hay datos para generar el informe.', 'error');
            return;
        }

        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        // Summarize by Article
        const summaryByArticle = billingLines.reduce((acc: any, line) => {
            if (!acc[line.sku_real]) {
                acc[line.sku_real] = { name: line.sku_name, qty: 0, price: line.price };
            }
            acc[line.sku_real].qty += line.qty_bill;
            return acc;
        }, {});

        // Logo ENVOS (Base64 placeholder - In real app, import the asset)
        // Using a generic blue shape as placeholder for the logo area until exact base64 is available
        const logoUrl = 'https://i.ibb.co/XfRzS78y/uploaded-media-1769683284568.png'; // Mock URL for the uploaded image

        // Header Rect
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(0, 45, 210, 45);

        // Header Text
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('ENVOS - Obramat', 15, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Plataforma logística SVQ', 15, 27);

        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('Informe de consumo de materiales', 15, 38);

        // Meta Info (Right side)
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Periodo: ${formatMonth(viewMonth)}`, 140, 18);
        doc.text(`Generado por: ${currentUser.nombre || currentUser.email}`, 140, 23);
        doc.text(`Fecha: ${timestamp}`, 140, 28);

        // Summary Table (Grouped by Article)
        const totalAmount = Object.values(summaryByArticle).reduce((acc: number, item: any) => acc + (item.qty * item.price), 0);
        const totalAmountNum = Number(totalAmount) || 0;

        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen de Consumo Mensual', 15, 60);

        // Logo text replacement or simple image if accessible
        // Note: jsPDF addImage requires base64 or a loaded image element. 
        // For reliability in this environment, we'll stick to the text header but style it.
        // If we really need the image, we can try to fetch it, but that might fail CORS locally.

        autoTable(doc, {
            startY: 65,
            head: [['Artículo', 'SKU', 'Cantidad Total', 'P. Unitario', 'Subtotal']],
            body: Object.entries(summaryByArticle).map(([sku, data]: [string, any]) => [
                data.name,
                sku,
                data.qty.toString(),
                `${(data.price as number).toFixed(2)}€`,
                `${((data.qty as number) * (data.price as number)).toFixed(2)}€`
            ]),
            foot: [['', '', '', 'TOTAL A FACTURAR', `${totalAmountNum.toFixed(2)}€`]],
            theme: 'striped',
            headStyles: { fillColor: [99, 47, 154], textColor: [255, 255, 255] }, // Envos Purple
            footStyles: { fillColor: [12, 158, 234], textColor: [255, 255, 255], fontStyle: 'bold' } // Envos Azure
        });

        // Detailed Table (Customer view doesn't need "Quantity Real", just what is billed)
        doc.addPage();
        doc.setFontSize(12);
        doc.text('Detalle de Cargas Operativas', 15, 20);

        autoTable(doc, {
            startY: 25,
            head: [['Fecha', 'Ref. Carga', 'Material', 'SKU', 'Cantidad']],
            body: billingLines.map(line => [
                line.date,
                line.load_ref,
                line.sku_name || 'Desconocido',
                line.sku_real,
                line.qty_bill.toString()
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] }
        });

        // Save
        doc.save(`ENVOS_Obramat_Consumo_${viewMonth}.pdf`);
        notify('Informe de facturacion generado correctamente.', 'success');
    };

    const isHistorical = viewMonth !== currentMonth;

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6 animate-fade-in">
            {/* Sidebar List for Months */}
            <div className="w-64 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} /> Histórico Periodos
                    </h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {availableMonths.map((m: any) => (
                        <button
                            key={m}
                            onClick={() => setViewMonth(m)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex justify-between items-center group
                ${viewMonth === m
                                    ? 'envos-gradient text-white font-bold shadow-md shadow-purple-500/10'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
                        >
                            <span className="flex items-center gap-2">
                                {formatMonth(m)}
                                {m === currentMonth && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>}
                            </span>
                            {m !== currentMonth ? <Lock size={12} className={viewMonth === m ? 'text-white/50' : 'text-slate-300'} /> : <ChevronRight size={12} className={viewMonth === m ? 'text-white/50' : 'text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity'} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div>
                        <h3 className="text-base font-bold text-slate-800 tracking-tight">Periodo: {formatMonth(viewMonth)}</h3>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5 uppercase tracking-wide">
                            {isHistorical ? 'Archivo Histórico (Lectura)' : 'Periodo Actual Operativo'}
                        </p>
                    </div>
                    <button
                        onClick={handleGenerateReport}
                        className="envos-gradient text-white px-5 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg shadow-purple-500/10 transition-all active:scale-[0.98]"
                    >
                        <FileText size={16} /> Generar Informe PDF
                    </button>
                </div>

                <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                    <div className="overflow-auto flex-1">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-md z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carga</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Material</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consumo</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-bold text-[#632f9a] uppercase tracking-widest bg-purple-50/50">A Facturar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {billingLines.length > 0 ? (
                                    billingLines.map((line) => (
                                        <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3 whitespace-nowrap text-[12px] font-medium text-slate-500 font-mono">{line.date}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-slate-700">{line.load_ref}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-600">{line.sku_name}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-slate-400 text-right">{line.qty_real}</td>
                                            <td className={`px-6 py-2 whitespace-nowrap text-right border-l border-slate-100 ${line.is_modified ? 'bg-amber-50/50' : 'bg-blue-50/30'}`}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    disabled={isHistorical}
                                                    className={`w-16 text-right p-1.5 rounded-lg border text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${line.is_modified ? 'border-amber-200 bg-white text-amber-700' : 'border-transparent bg-transparent text-blue-700'}`}
                                                    value={line.qty_bill}
                                                    onChange={(e) => onUpdateOverride(line.id, Number(e.target.value))}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <FileText size={32} />
                                                <p className="text-xs font-bold uppercase tracking-widest">No hay registros este mes</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {billingLines.length > 0 && (
                        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{billingLines.length} Movimientos Encontrados</span>
                            <div className="text-sm font-bold text-slate-700">
                                <span className="text-[10px] text-slate-400 uppercase mr-2">Total Unidades:</span>
                                {billingLines.reduce((acc, l) => acc + l.qty_bill, 0)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
