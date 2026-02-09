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

            {/* Content Area */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                {formatMonth(selectedMonth)}
                            </h3>
                            {filterMode !== 'ALL' && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                                    {filterMode === 'DUPLICATES' ? 'Duplicados' : 'Pendiente ADR'}
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Truck size={12} className="text-[#632f9a]" /> Auditoría de Carga y Consumo Logístico
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Quick Filters */}
                        <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 mr-2">
                            <button
                                onClick={() => setFilterMode('ALL')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'ALL'
                                    ? 'bg-white text-[#632f9a] shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilterMode('DUPLICATES')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'DUPLICATES'
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-100'
                                    : 'text-slate-400 hover:text-red-500'
                                    }`}
                            >
                                Duplicadas
                            </button>
                            <button
                                onClick={() => setFilterMode('ADR_PENDING')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'ADR_PENDING'
                                    ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-100'
                                    : 'text-slate-400 hover:text-yellow-600'
                                    }`}
                            >
                                Pend. ADR
                            </button>
                        </div>

                        {selectedMonth === currentMonth && (
                            <button
                                onClick={() => {
                                    // Smooth scroll to today's load
                                    const todayElement = document.getElementById('today-load');
                                    if (todayElement) {
                                        todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        todayElement.classList.add('ring-4', 'ring-[#632f9a]/20');
                                        setTimeout(() => todayElement.classList.remove('ring-4', 'ring-[#632f9a]/20'), 3000);
                                    }
                                }}
                                className="flex items-center gap-2.5 px-6 py-3 bg-[#632f9a] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-100 hover:bg-[#4f247e] transition-all active:scale-95 border-b-4 border-[#4f247e]"
                            >
                                <Calendar size={14} />
                                CARGA DE HOY
                            </button>
                        )}

                        <button
                            onClick={handleForceSync}
                            disabled={isSyncing}
                            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 border-b-4 ${isSyncing
                                ? 'bg-slate-400 border-slate-500 cursor-wait'
                                : 'bg-blue-600 border-blue-800 hover:bg-blue-700 shadow-blue-100'
                                }`}
                        >
                            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'Sincronizando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    {/* Legend - Responsive and horizontal */}
                    <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/40 flex items-center justify-between gap-8 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-8">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] whitespace-nowrap border-r border-slate-200 pr-8">Estados</h5>
                            <div className="flex items-center gap-8 text-[11px] font-bold">
                                <div className="flex items-center gap-2.5 text-slate-600 group cursor-default">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200" />
                                    <span>Válida</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-slate-600 group cursor-default">
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm shadow-yellow-200" />
                                    <span>Editada</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-red-500 group cursor-default">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200 animate-pulse" />
                                    <span>Duplicada (Bloqueo)</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 italic text-[10px] font-medium text-slate-400">
                            <Truck size={12} /> Desliza para ver más columnas en móvil
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-[180px]">Fecha / Referencia</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-[220px]">Transporte</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Materiales / Consumos</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-[140px] text-center">Auditoría</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLoads.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-10 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                    <Truck size={32} />
                                                </div>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay cargas registradas</p>
                                                <p className="text-xs text-slate-400">Prueba cambiando el mes o los filtros</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLoads.map((load) => {
                                        const isToday = load.date === today;
                                        return (
                                            <tr
                                                key={load.load_uid}
                                                id={isToday ? 'today-load' : undefined}
                                                className={`group transition-all duration-300 hover:z-10 relative ${isToday
                                                    ? 'bg-[#632f9a]/[0.02] hover:bg-[#632f9a]/[0.05]'
                                                    : load.duplicado
                                                        ? 'bg-red-50/30'
                                                        : 'hover:bg-slate-50/50'
                                                    }`}
                                            >
                                                <td className="px-10 py-8 align-top">
                                                    <div className="flex flex-col gap-2">
                                                        <span className={`text-sm font-black tracking-tight ${isToday ? 'text-[#632f9a]' : 'text-slate-900'}`}>
                                                            {load.date}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter bg-slate-100/50 w-fit px-2 py-0.5 rounded-lg border border-slate-100">
                                                            #{load.ref_carga}
                                                        </span>
                                                        {isToday && (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-[#632f9a] animate-pulse" />
                                                                <span className="text-[9px] font-black text-[#632f9a] uppercase tracking-widest">HOY</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 align-top">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-colors border border-transparent group-hover:border-slate-100">
                                                                <Truck size={14} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-0.5">Precinto</span>
                                                                <span className="text-[12px] font-black text-slate-800 tracking-tight">{load.precinto || 'N/D'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-[#632f9a] transition-colors border border-transparent group-hover:border-slate-100">
                                                                <Edit2 size={14} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-0.5">Flete</span>
                                                                <span className="text-[11px] font-black text-slate-700 tracking-tight line-clamp-1">{load.flete || 'N/D'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 align-top">
                                                    <div className="flex flex-wrap gap-2.5 max-w-2xl">
                                                        {Object.entries(load.consumptions).map(([sku, qty]) => {
                                                            const quantity = Number(qty);
                                                            const isGenericAdr = sku.toUpperCase().includes('ADR') || sku.toLowerCase().includes('pegatina');
                                                            const hasBreakdown = load.adr_breakdown && Object.keys(load.adr_breakdown).length > 0;

                                                            if (quantity > 0) {
                                                                if (isGenericAdr) {
                                                                    return (
                                                                        <div key={sku} className="w-full max-w-sm overflow-hidden flex flex-col bg-white rounded-2xl border border-purple-100 shadow-sm shadow-purple-50/50 transition-all hover:border-purple-300 hover:shadow-md">
                                                                            <div className="flex justify-between items-center px-4 py-3 bg-purple-50/50 border-b border-purple-50">
                                                                                <div className="flex items-center gap-2 text-[10px] font-black text-[#632f9a] uppercase tracking-widest">
                                                                                    <AlertTriangle size={14} className="animate-pulse" />
                                                                                    REQUERIDO ADR
                                                                                </div>
                                                                                <span className="bg-[#632f9a] text-white px-2.5 py-1 rounded-lg text-[11px] font-black">x{qty}</span>
                                                                            </div>
                                                                            <div className="p-4">
                                                                                {hasBreakdown ? (
                                                                                    <div className="space-y-2">
                                                                                        {Object.entries(load.adr_breakdown || {}).map(([aSku, aQty]) => (
                                                                                            <div key={aSku} className="text-[11px] font-bold text-slate-600 flex justify-between gap-6 px-2">
                                                                                                <span className="truncate">{getArticleName(aSku)}</span>
                                                                                                <span className="font-black text-[#632f9a]">x{aQty}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                        <button
                                                                                            onClick={() => handleOpenAdrModal(load)}
                                                                                            className="w-full mt-2 text-[9px] font-black text-[#632f9a] uppercase tracking-widest hover:bg-purple-50 py-2 rounded-xl transition-colors border border-purple-100 border-dashed"
                                                                                        >
                                                                                            Editar Desglose
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={() => handleOpenAdrModal(load)}
                                                                                        className="w-full text-[10px] font-black bg-[#632f9a] text-white px-5 py-3 rounded-xl hover:bg-[#4f247e] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100"
                                                                                    >
                                                                                        <AlertTriangle size={14} />
                                                                                        ASIGNAR ARTÍCULOS ADR
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <div key={sku} className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-100 group/item transition-all hover:bg-slate-50 hover:border-slate-200 shadow-sm shadow-slate-50/50">
                                                                        <button
                                                                            onClick={() => onArticleClick(sku)}
                                                                            className="text-[11px] font-bold text-slate-700 hover:text-[#632f9a] transition-colors tracking-tight line-clamp-1"
                                                                        >
                                                                            {getArticleName(sku)}
                                                                        </button>
                                                                        <span className="text-[11px] font-black text-white bg-slate-900 px-2 py-0.5 rounded-lg">x{quantity}</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 align-top text-center whitespace-nowrap">
                                                    {load.duplicado ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-lg shadow-red-100 border border-red-100">
                                                                <AlertOctagon size={24} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Duplicado</span>
                                                        </div>
                                                    ) : load.modificada ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-100 border border-yellow-100">
                                                                <Edit2 size={24} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Modificado</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-lg shadow-green-100 border border-green-100">
                                                                <CheckCircle2 size={24} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Validada</span>
                                                        </div>
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

