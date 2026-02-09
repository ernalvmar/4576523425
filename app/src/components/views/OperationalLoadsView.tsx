import React from 'react';
import { Trash2, Edit2, AlertTriangle, CheckCircle2, RefreshCw, AlertOctagon, Truck, Calendar } from 'lucide-react';
import { Article, OperationalLoad } from '../../types';
import { getToday, formatMonth } from '../../utils/helpers';

interface OperationalLoadsViewProps {
    articles: Article[];
    loads: OperationalLoad[];
    filterMode: 'ALL' | 'DUPLICATES' | 'ADR_PENDING';
    setFilterMode: (mode: 'ALL' | 'DUPLICATES' | 'ADR_PENDING') => void;
    isMonthOpen: boolean;
    onArticleClick: (sku: string) => void;
    onSyncComplete?: () => void;
    setIsEditing?: (val: boolean) => void;
    currentMonth: string;
    selectedMonth: string;
    onMonthChange: (month: string) => void;
    availableMonths: string[];
}

export const OperationalLoadsView: React.FC<OperationalLoadsViewProps> = ({
    articles,
    loads,
    filterMode,
    setFilterMode,
    isMonthOpen,
    onArticleClick,
    onSyncComplete,
    setIsEditing,
    currentMonth,
    selectedMonth,
    onMonthChange,
    availableMonths
}) => {
    const [isSyncing, setIsSyncing] = React.useState(false);
    const today = getToday();

    // ADR Breakdown State
    const [adrModalOpen, setAdrModalOpen] = React.useState(false);
    const [selectedLoadForAdr, setSelectedLoadForAdr] = React.useState<OperationalLoad | null>(null);
    const [adrBreakdownData, setAdrBreakdownData] = React.useState<Record<string, number>>({});

    React.useEffect(() => {
        if (setIsEditing) {
            setIsEditing(adrModalOpen);
        }
    }, [adrModalOpen, setIsEditing]);

    // Filter ADR Articles
    const adrArticles = React.useMemo(() => {
        return articles.filter(a => a.sku.startsWith('ADR-') || a.nombre.toLowerCase().includes('etiqueta adr'));
    }, [articles]);

    const handleForceSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/trigger-sync`, { method: 'POST' });
            if (res.ok) {
                alert('Sincronización iniciada. Los datos se actualizarán en unos momentos.');
                if (onSyncComplete) {
                    setTimeout(onSyncComplete, 3000);
                }
            } else {
                throw new Error('Error al iniciar sincronización');
            }
        } catch (error) {
            alert('No se pudo conectar con el servidor de sincronización.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleOpenAdrModal = (load: OperationalLoad) => {
        setSelectedLoadForAdr(load);
        // Initialize with existing breakdown or empty
        setAdrBreakdownData(load.adr_breakdown || {});
        setAdrModalOpen(true);
    };

    const handleSaveAdrBreakdown = async () => {
        if (!selectedLoadForAdr) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/loads/${selectedLoadForAdr.ref_carga}/adr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ breakdown: adrBreakdownData })
            });

            if (res.ok) {
                setAdrModalOpen(false);
                setSelectedLoadForAdr(null);
                setAdrBreakdownData({});
                if (onSyncComplete) onSyncComplete(); // Refresh data
            } else {
                alert('Error al guardar el desglose ADR');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    const updateAdrQty = (sku: string, delta: number) => {
        setAdrBreakdownData(prev => {
            const current = prev[sku] || 0;
            const newVal = Math.max(0, current + delta);
            if (newVal === 0) {
                const { [sku]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [sku]: newVal };
        });
    };

    const filteredLoads = React.useMemo(() => {
        // Filter by the selected month
        const periodLoads = loads.filter(l => l.date.slice(0, 7) === selectedMonth);

        if (filterMode === 'DUPLICATES') return periodLoads.filter(l => l.duplicado);
        if (filterMode === 'ADR_PENDING') {
            return periodLoads.filter(l => {
                const hasAdr = Object.keys(l.consumptions).some(k => k.toUpperCase().includes('ADR') || k.toLowerCase().includes('pegatina'));
                const hasBreakdown = l.adr_breakdown && Object.keys(l.adr_breakdown).length > 0;
                return hasAdr && !hasBreakdown;
            });
        }
        return periodLoads;
    }, [loads, filterMode, selectedMonth]);

    const getArticleName = (sku: string) => {
        const art = articles.find(a => a.sku === sku);
        return art ? art.nombre : sku;
    };

    return (
        <div className="space-y-6">
            {!isMonthOpen && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">El mes actual está cerrado.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Month Selector Sidebar */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Calendar size={12} /> Periodo de Visualización
                        </h4>
                        <div className="space-y-1">
                            {availableMonths.map(m => (
                                <button
                                    key={m}
                                    onClick={() => onMonthChange(m)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedMonth === m
                                        ? 'bg-[#632f9a] text-white shadow-lg shadow-purple-100'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className={`text-xs ${selectedMonth === m ? 'font-bold' : 'font-medium'}`}>
                                        {formatMonth(m)}
                                    </span>
                                    {m === currentMonth && (
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded border ${selectedMonth === m ? 'bg-white/20 border-white/30 text-white' : 'bg-green-50 border-green-100 text-green-600'
                                            }`}>ACTUAL</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <Truck className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                            <div>
                                <h4 className="text-blue-900 font-bold text-[10px] uppercase tracking-wider">Sync Activa</h4>
                                <p className="text-blue-700 text-[11px] leading-relaxed mt-1">
                                    Datos sincronizados en tiempo real. Para cambios, use la hoja original.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                            {formatMonth(selectedMonth)}
                            {filterMode !== 'ALL' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800">
                                    {filterMode === 'DUPLICATES' ? 'Duplicados' : 'Pendiente ADR'}
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-3">
                            {filterMode !== 'ALL' && (
                                <button onClick={() => setFilterMode('ALL')} className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
                                    <RefreshCw size={12} /> Mostrar Todo
                                </button>
                            )}
                            <button
                                onClick={handleForceSync}
                                disabled={isSyncing}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 ${isSyncing ? 'bg-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                            >
                                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                                {isSyncing ? 'Sync...' : 'Sincronizar de Sheets'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {/* Legend */}
                        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center gap-6 overflow-x-auto no-scrollbar">
                            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Leyenda</h5>
                            <div className="flex items-center gap-6 text-[10px] font-bold">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200" />
                                    <span>Validada</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm shadow-yellow-200" />
                                    <span>Modificada</span>
                                </div>
                                <div className="flex items-center gap-2 text-red-600">
                                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-200" />
                                    <span>Duplicada (Bloquea)</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#632f9a]">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-200 animate-pulse" />
                                    <span>Hoy (Prioridad)</span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha / Ref</th>
                                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transporte</th>
                                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Resumen de Consumo</th>
                                        <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredLoads.map((load) => {
                                        const isToday = load.date === today;
                                        return (
                                            <tr
                                                key={load.load_uid}
                                                className={`transition-all duration-300 ${isToday
                                                    ? 'bg-purple-50/40 hover:bg-purple-50/60'
                                                    : load.duplicado
                                                        ? 'bg-red-50/50'
                                                        : 'hover:bg-slate-50/50'
                                                    }`}
                                            >
                                                <td className="px-6 py-5 whitespace-nowrap align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-[11px] font-black ${isToday ? 'text-[#632f9a]' : 'text-slate-900'}`}>
                                                            {load.date}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-400 font-mono tracking-tighter">
                                                            #{load.ref_carga}
                                                        </span>
                                                        {isToday && (
                                                            <span className="w-fit text-[8px] font-black bg-[#632f9a] text-white px-1.5 py-0.5 rounded-full mt-1">
                                                                CARGA DE HOY
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap align-top">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest w-6">Prec</span>
                                                            <span className="text-[11px] font-black text-slate-800">{load.precinto}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest w-6">Flete</span>
                                                            <span className="text-[11px] font-black text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-32">{load.flete}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 align-top">
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(load.consumptions).map(([sku, qty]) => {
                                                            const quantity = Number(qty);
                                                            const isGenericAdr = sku.toUpperCase().includes('ADR') || sku.toLowerCase().includes('pegatina');
                                                            const hasBreakdown = load.adr_breakdown && Object.keys(load.adr_breakdown).length > 0;

                                                            if (quantity > 0) {
                                                                if (isGenericAdr) {
                                                                    return (
                                                                        <div key={sku} className="w-full flex flex-col gap-2 bg-white p-3 rounded-xl border border-purple-100 shadow-sm shadow-purple-50/50">
                                                                            <div className="flex justify-between items-center text-[10px] font-black text-[#632f9a] uppercase tracking-widest">
                                                                                <span>Material ADR</span>
                                                                                <span className="bg-purple-100 px-2 py-0.5 rounded-full">x{qty}</span>
                                                                            </div>
                                                                            {hasBreakdown ? (
                                                                                <div className="space-y-1 pl-3 border-l-2 border-purple-100">
                                                                                    {Object.entries(load.adr_breakdown || {}).map(([aSku, aQty]) => (
                                                                                        <div key={aSku} className="text-[10px] font-medium text-purple-700 flex justify-between gap-4">
                                                                                            <span className="truncate">{getArticleName(aSku)}</span>
                                                                                            <span className="font-black">x{aQty}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                    <button onClick={() => handleOpenAdrModal(load)} className="text-[9px] font-black text-[#632f9a] uppercase tracking-widest mt-2 hover:underline">
                                                                                        Editar Desglose
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => handleOpenAdrModal(load)}
                                                                                    className="text-[10px] font-black bg-[#632f9a] text-white px-4 py-2 rounded-lg hover:bg-[#4f247e] transition-all flex items-center justify-center gap-2"
                                                                                >
                                                                                    <AlertTriangle size={12} />
                                                                                    IDENTIFICAR ADR
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <div key={sku} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 group">
                                                                        <button
                                                                            onClick={() => onArticleClick(sku)}
                                                                            className="text-[10px] font-bold text-slate-700 hover:text-blue-600 transition-colors"
                                                                        >
                                                                            {getArticleName(sku)}
                                                                        </button>
                                                                        <span className="text-[10px] font-black text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-100">x{quantity}</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-center align-top">
                                                    {load.duplicado ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-lg shadow-red-100">
                                                                <AlertOctagon size={16} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">DUPLICADO</span>
                                                        </div>
                                                    ) : load.modificada ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-100">
                                                                <Edit2 size={16} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">MODIFICADO</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1 group">
                                                            <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shadow-lg shadow-green-50 transition-transform group-hover:scale-110">
                                                                <CheckCircle2 size={16} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">VÁLIDA</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ADR Breakdown Modal */}
            {adrModalOpen && selectedLoadForAdr && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
                        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-[#632f9a]">
                            <h4 className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest">
                                <AlertTriangle size={20} /> Desglose Logístico ADR
                            </h4>
                            <button onClick={() => setAdrModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                                <Trash2 size={20} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="bg-purple-50 p-4 rounded-2xl mb-6 border border-purple-100">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Referencia Carga</span>
                                    <span className="text-xs font-black text-purple-900">#{selectedLoadForAdr.ref_carga}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Total Sheets</span>
                                    <span className="text-xs font-black text-purple-900">x{Object.entries(selectedLoadForAdr.consumptions).find(([k]) => k.toLowerCase().includes('adr'))?.[1] || 0}</span>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {adrArticles.map(art => {
                                    const val = adrBreakdownData[art.sku] || 0;
                                    return (
                                        <div key={art.sku} className="flex justify-between items-center bg-slate-50/50 border border-slate-100 p-4 rounded-2xl hover:border-purple-200 transition-all group">
                                            <div>
                                                <div className="font-black text-xs text-slate-800 tracking-tight">{art.nombre}</div>
                                                <div className="text-[9px] text-slate-400 font-bold font-mono mt-0.5">{art.sku}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => updateAdrQty(art.sku, -1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:border-red-200 hover:text-red-500 transition-all text-slate-600 shadow-sm">-</button>
                                                <span className={`w-8 text-center font-black text-lg ${val > 0 ? 'text-[#632f9a]' : 'text-slate-300'}`}>{val}</span>
                                                <button onClick={() => updateAdrQty(art.sku, 1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#632f9a] text-white hover:bg-[#4f247e] transition-all shadow-lg shadow-purple-100">+</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Desglosado</span>
                                    <span className="text-xl font-black text-slate-900">{Object.values(adrBreakdownData).reduce((a, b) => Number(a) + Number(b), 0)} <span className="text-xs text-slate-400 font-bold uppercase ml-1">un.</span></span>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setAdrModalOpen(false)} className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Cancelar</button>
                                    <button
                                        onClick={handleSaveAdrBreakdown}
                                        className="px-8 py-3 bg-[#632f9a] hover:bg-[#4f247e] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-100 transition-all active:scale-95"
                                    >
                                        Guardar Registro
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

