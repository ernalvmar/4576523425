import React, { useState, useMemo } from 'react';
import { FileText, Calendar, Lock, ChevronRight } from 'lucide-react';
import { OperationalLoad, Article, MonthClosing } from '../../types';
import { formatMonth } from '../../utils/helpers';
import { openBillingReport } from '../../utils/generateBillingReport';

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
    const [fetchedPeriods, setFetchedPeriods] = useState<string[]>([]);
    const [storageBilling, setStorageBilling] = useState<any[]>([]);
    const [palletBilling, setPalletBilling] = useState<any[]>([]);

    // Fetch distinct periods for billing history
    React.useEffect(() => {
        const fetchPeriods = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';
                const res = await fetch(`${API_URL}/api/periods`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setFetchedPeriods(data);
                }
            } catch (err) {
                console.error("Error fetching periods", err);
            }
        };
        fetchPeriods();
    }, []);

    // Fetch billing data for the selected month
    React.useEffect(() => {
        const fetchData = async () => {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';
            try {
                // Storage
                const storageRes = await fetch(`${API_URL}/api/storage/billing/${viewMonth}`);
                if (storageRes.ok) {
                    const data = await storageRes.json();
                    setStorageBilling(Array.isArray(data) ? data : []);
                }

                // Pallets
                const palletRes = await fetch(`${API_URL}/api/pallet-consumptions/billing/${viewMonth}`);
                if (palletRes.ok) {
                    const data = await palletRes.json();
                    setPalletBilling(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error fetching billing data", err);
            }
        };
        fetchData();
    }, [viewMonth]);

    const availableMonths = useMemo(() => {
        const months = new Set(fetchedPeriods);
        closings.forEach(c => months.add(c.month));
        months.add(currentMonth);
        return Array.from(months).sort().reverse();
    }, [closings, currentMonth, fetchedPeriods]);

    const filteredLoads = useMemo(() => {
        return loads.filter(l => l.periodo === viewMonth);
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

                    const isMeters = (article?.nombre || '').toLowerCase().includes('cinta blanca') ||
                        (article?.unidad || '').toLowerCase().includes('metro');

                    lines.push({
                        id: overrideKey,
                        load_ref: load.ref_carga,
                        date: load.date,
                        sku_real: sku,
                        sku_name: article?.nombre || sku,
                        qty_real: qty,
                        qty_bill: billedQty,
                        is_modified: billingOverrides[overrideKey] !== undefined && billingOverrides[overrideKey] !== qty,
                        price: article?.precio_venta || 0,
                        type: 'MATERIAL',
                        is_meters: isMeters
                    });
                }
            });
        });

        storageBilling.forEach((item) => {
            lines.push({
                id: `store-${item.id}`,
                load_ref: `ALMACENAJE - ${item.container_id}`,
                date: item.entry_date,
                sku_real: 'STORAGE-FEE',
                sku_name: `Almacenaje (Días: ${item.billable_days}) - Pedidos: ${item.order_numbers}`,
                qty_real: item.billable_days,
                qty_bill: item.billable_days,
                is_modified: false,
                price: 0.18,
                item_amount: item.amount,
                type: 'STORAGE'
            });
        });

        palletBilling.forEach((item) => {
            const article = articles.find(a => a.sku === item.sku);
            lines.push({
                id: `pallet-${item.id}`,
                load_ref: `PALETS - ${item.agency}`,
                date: item.date,
                sku_real: item.sku,
                sku_name: `${article?.nombre || item.sku} - Transf. en ${item.resulting_pallets} palets`,
                qty_real: item.resulting_pallets,
                qty_bill: item.resulting_pallets,
                is_modified: false,
                price: article?.precio_venta || 0,
                type: 'PALLET'
            });
        });

        return lines;
    }, [filteredLoads, articles, billingOverrides, storageBilling, palletBilling]);

    const handleGenerateReport = () => {
        if (billingLines.length === 0) {
            notify('No hay datos para generar el informe.', 'error');
            return;
        }
        openBillingReport({
            billingLines,
            viewMonth,
            currentUser
        });
        notify('Informe de facturación abierto en nueva pestaña.', 'success');
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
                        <FileText size={16} /> Generar Informe
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
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    {line.sku_name}
                                                    {line.is_meters && (
                                                        <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-600 text-[10px] px-1.5 py-0.5 rounded border border-teal-100 font-bold uppercase tracking-tighter">
                                                            Metros
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-slate-400 text-right">
                                                {line.qty_real} {line.type === 'STORAGE' ? 'días' : line.is_meters ? 'm' : ''}
                                            </td>
                                            <td className={`px-6 py-2 whitespace-nowrap text-right border-l border-slate-100 ${line.is_modified ? 'bg-amber-50/50' :
                                                line.type === 'STORAGE' ? 'bg-orange-50/30' :
                                                    line.type === 'PALLET' ? 'bg-indigo-50/30' :
                                                        line.is_meters ? 'bg-teal-50/30' :
                                                            'bg-blue-50/30'
                                                }`}>
                                                {line.type === 'STORAGE' ? (
                                                    <span className="text-sm font-black text-orange-600 px-2">{line.item_amount}€</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        disabled={isHistorical}
                                                        className={`w-16 text-right p-1.5 rounded-lg border text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${line.is_modified ? 'border-amber-200 bg-white text-amber-700' :
                                                            line.type === 'PALLET' ? 'border-indigo-100 bg-transparent text-indigo-700' :
                                                                'border-transparent bg-transparent text-blue-700'
                                                            }`}
                                                        value={line.qty_bill}
                                                        onChange={(e) => onUpdateOverride(line.id, Number(e.target.value))}
                                                    />
                                                )}
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
