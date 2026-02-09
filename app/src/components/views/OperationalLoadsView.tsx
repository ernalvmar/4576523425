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

            {/* Content Area - Compact View */}
            <div className="space-y-2">
                {/* Compact Header Bar */}
                <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-black text-slate-800">{formatMonth(selectedMonth)}</h3>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{filteredLoads.length} cargas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                            {(['ALL', 'DUPLICATES', 'ADR_PENDING'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setFilterMode(mode)}
                                    className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-all ${filterMode === mode
                                            ? mode === 'DUPLICATES' ? 'bg-red-500 text-white' : mode === 'ADR_PENDING' ? 'bg-yellow-500 text-white' : 'bg-white text-[#632f9a] shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {mode === 'ALL' ? 'Todas' : mode === 'DUPLICATES' ? 'Dup' : 'ADR'}
                                </button>
                            ))}
                        </div>
                        {selectedMonth === currentMonth && (
                            <button
                                onClick={() => { const el = document.getElementById('today-load'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-[#632f9a]'); setTimeout(() => el.classList.remove('ring-2', 'ring-[#632f9a]'), 2000); } }}
                                className="flex items-center gap-1 px-2.5 py-1 bg-[#632f9a] text-white rounded-lg font-black text-[9px] uppercase hover:bg-[#4f247e] transition-all"
                            >
                                <Calendar size={10} /> HOY
                            </button>
                        )}
                        <button onClick={handleForceSync} disabled={isSyncing} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[9px] uppercase text-white transition-all ${isSyncing ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} /> Sync
                        </button>
                    </div>
                </div>

                {/* Ultra-Compact Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-3 py-2 font-black text-slate-400 uppercase text-[9px] w-24">Fecha</th>
                                <th className="px-3 py-2 font-black text-slate-400 uppercase text-[9px] w-20">Ref</th>
                                <th className="px-3 py-2 font-black text-slate-400 uppercase text-[9px] w-28">Precinto</th>
                                <th className="px-3 py-2 font-black text-slate-400 uppercase text-[9px] w-40">Flete</th>
                                <th className="px-3 py-2 font-black text-slate-400 uppercase text-[9px]">Consumos</th>
                                <th className="px-3 py-2 font-black text-slate-400 uppercase text-[9px] w-16 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLoads.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-xs">No hay cargas para este periodo</td></tr>
                            ) : (
                                filteredLoads.map((load) => {
                                    const isToday = load.date === today;
                                    const hasAdrBreakdown = load.adr_breakdown && Object.keys(load.adr_breakdown).length > 0;
                                    return (
                                        <tr
                                            key={load.load_uid}
                                            id={isToday ? 'today-load' : undefined}
                                            className={`group transition-colors ${isToday ? 'bg-purple-50/50' : load.duplicado ? 'bg-red-50/40' : 'hover:bg-slate-50/60'}`}
                                        >
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <span className={`font-black ${isToday ? 'text-[#632f9a]' : 'text-slate-800'}`}>{load.date}</span>
                                                {isToday && <span className="ml-1 inline-block w-1.5 h-1.5 bg-[#632f9a] rounded-full animate-pulse"></span>}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded">#{load.ref_carga}</span>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap font-bold text-slate-700">{load.precinto || '—'}</td>
                                            <td className="px-3 py-2 font-medium text-slate-600 truncate max-w-[160px]" title={load.flete}>{load.flete || '—'}</td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {Object.entries(load.consumptions).map(([sku, qty]) => {
                                                        const quantity = Number(qty);
                                                        if (quantity <= 0) return null;
                                                        const isAdr = sku.toUpperCase().includes('ADR') || sku.toLowerCase().includes('pegatina');
                                                        if (isAdr) {
                                                            return (
                                                                <button
                                                                    key={sku}
                                                                    onClick={() => handleOpenAdrModal(load)}
                                                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${hasAdrBreakdown
                                                                            ? 'bg-purple-100 text-[#632f9a] hover:bg-purple-200'
                                                                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                                        }`}
                                                                >
                                                                    <AlertTriangle size={10} /> ADR x{qty}
                                                                </button>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                key={sku}
                                                                onClick={() => onArticleClick(sku)}
                                                                className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium hover:bg-slate-200 transition-colors"
                                                            >
                                                                {getArticleName(sku)} <span className="font-black text-slate-800">x{quantity}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {load.duplicado ? (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[9px] font-black"><AlertOctagon size={10} /></span>
                                                ) : load.modificada ? (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded-full text-[9px] font-black"><Edit2 size={10} /></span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full text-[9px] font-black"><CheckCircle2 size={10} /></span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* ADR Breakdown Modal */}
            {adrModalOpen && selectedLoadForAdr && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 scale-100 animate-in zoom-in-95 duration-300">
                        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-[#632f9a] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <AlertTriangle size={120} className="text-white" />
                            </div>
                            <h4 className="text-lg font-black text-white flex items-center gap-4 uppercase tracking-[0.2em] relative z-10">
                                <AlertTriangle size={24} /> Desglose Logístico ADR
                            </h4>
                            <button onClick={() => setAdrModalOpen(false)} className="text-white/60 hover:text-white transition-all hover:rotate-90 relative z-10">
                                <Trash2 size={24} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-10">
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-purple-50 p-5 rounded-3xl border border-purple-100">
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-1">Referencia Carga</span>
                                    <span className="text-sm font-black text-purple-900">#{selectedLoadForAdr.ref_carga}</span>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Consumo ADR</span>
                                    <span className="text-sm font-black text-slate-900">x{Object.entries(selectedLoadForAdr.consumptions).find(([k]) => k.toLowerCase().includes('adr'))?.[1] || 0} Unidades</span>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-3 custom-scrollbar">
                                {adrArticles.map(art => {
                                    const val = adrBreakdownData[art.sku] || 0;
                                    return (
                                        <div key={art.sku} className="flex justify-between items-center bg-slate-50/50 border border-slate-100 p-5 rounded-[2rem] hover:border-purple-200 transition-all group hover:bg-white hover:shadow-xl hover:shadow-purple-50/50">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="font-black text-[13px] text-slate-800 tracking-tight truncate">{art.nombre}</div>
                                                <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{art.sku}</div>
                                            </div>
                                            <div className="flex items-center gap-5">
                                                <button onClick={() => updateAdrQty(art.sku, -1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-200 hover:border-red-200 hover:text-red-500 transition-all text-slate-600 shadow-sm font-black">-</button>
                                                <span className={`w-8 text-center font-black text-xl ${val > 0 ? 'text-[#632f9a]' : 'text-slate-300'}`}>{val}</span>
                                                <button onClick={() => updateAdrQty(art.sku, 1)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#632f9a] text-white hover:bg-[#4f247e] transition-all shadow-xl shadow-purple-100 font-black">+</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-10 flex justify-between items-center pt-8 border-t border-slate-100">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Desglosado</span>
                                    <span className="text-2xl font-black text-[#632f9a]">{Object.values(adrBreakdownData).reduce((a, b) => Number(a) + Number(b), 0)} <span className="text-[12px] text-slate-400 font-bold uppercase ml-1">un.</span></span>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setAdrModalOpen(false)} className="px-6 py-3 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Cancelar</button>
                                    <button
                                        onClick={handleSaveAdrBreakdown}
                                        className="px-10 py-4 bg-[#632f9a] hover:bg-[#4f247e] text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-purple-200 transition-all active:scale-95 border-b-4 border-[#4f247e]"
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

