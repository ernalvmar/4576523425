import React from 'react';
import { Truck, AlertOctagon, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Article, OperationalLoad } from '../../types';

interface OperationalLoadsViewProps {
    articles: Article[];
    loads: OperationalLoad[];
    filterMode: 'ALL' | 'DUPLICATES';
    setFilterMode: (mode: 'ALL' | 'DUPLICATES') => void;
    isMonthOpen: boolean;
    onArticleClick: (sku: string) => void;
    onSyncComplete?: () => void;
}

export const OperationalLoadsView: React.FC<OperationalLoadsViewProps> = ({
    articles,
    loads,
    filterMode,
    setFilterMode,
    isMonthOpen,
    onArticleClick,
    onSyncComplete
}) => {
    const [isSyncing, setIsSyncing] = React.useState(false);

    // ADR Breakdown State
    const [adrModalOpen, setAdrModalOpen] = React.useState(false);
    const [selectedLoadForAdr, setSelectedLoadForAdr] = React.useState<OperationalLoad | null>(null);
    const [adrBreakdownData, setAdrBreakdownData] = React.useState<Record<string, number>>({});

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

    const filteredLoads = filterMode === 'DUPLICATES'
        ? loads.filter(l => l.duplicado)
        : loads;

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

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md flex items-start gap-3">
                <Truck className="text-blue-600 mt-1" size={20} />
                <div>
                    <h4 className="text-blue-900 font-medium text-sm">Sincronización Automática</h4>
                    <p className="text-blue-700 text-xs mt-1">
                        Las cargas operativas se sincronizan automáticamente desde Google Sheets.
                        Esta vista es de solo lectura. Si detecta un error, por favor modifique la hoja de origen o cree una regularización.
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center mt-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-3">
                    Histórico de Cargas (Sheets Sync)
                    {filterMode === 'DUPLICATES' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Filtro: Duplicados
                        </span>
                    )}
                </h3>
                <div className="flex items-center gap-3">
                    {filterMode === 'DUPLICATES' && (
                        <button onClick={() => setFilterMode('ALL')} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                            <RefreshCw size={14} /> Mostrar Todo
                        </button>
                    )}
                    <button
                        onClick={handleForceSync}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white shadow-sm transition-all ${isSyncing ? 'bg-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
                    >
                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Legend */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Leyenda de Auditoría</h5>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-500" />
                            <span className="text-gray-600"><strong>Validada:</strong> Carga única y sin alteraciones.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">MODIFICADO</span>
                            <span className="text-gray-600">Datos alterados en Sheets tras el registro inicial.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">DUPLICADO</span>
                            <span className="text-gray-600">Referencia/Precinto repetido (Bloquea cierre).</span>
                        </div>
                    </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datos Transporte</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resumen Consumo</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Alertas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredLoads.map((load) => (
                            <tr key={load.load_uid} className={load.duplicado ? 'bg-red-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-top">{load.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-top">{load.ref_carga}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                    <div><span className="text-xs font-semibold">P:</span> {load.precinto}</div>
                                    <div><span className="text-xs font-semibold">F:</span> {load.flete}</div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 align-top">
                                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                                        {Object.entries(load.consumptions).map(([sku, qty]) => {
                                            const quantity = Number(qty);
                                            const isGenericAdr = sku.toUpperCase().includes('ADR') || sku.toLowerCase().includes('pegatina');
                                            const hasBreakdown = load.adr_breakdown && Object.keys(load.adr_breakdown).length > 0;

                                            if (quantity > 0) {
                                                if (isGenericAdr) {
                                                    return (
                                                        <div key={sku} className="flex flex-col gap-1 bg-purple-50 p-1.5 rounded border border-purple-100">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-purple-700 font-bold">Pegatinas ADR</span>
                                                                <span className="font-bold text-purple-800">x{qty}</span>
                                                            </div>
                                                            {hasBreakdown ? (
                                                                <div className="text-[10px] text-purple-600 mt-1 pl-2 border-l-2 border-purple-200">
                                                                    {Object.entries(load.adr_breakdown || {}).map(([aSku, aQty]) => (
                                                                        <div key={aSku}>{getArticleName(aSku)}: {aQty}</div>
                                                                    ))}
                                                                    <button onClick={() => handleOpenAdrModal(load)} className="text-[9px] underline mt-1">Editar Desglose</button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleOpenAdrModal(load)}
                                                                    className="text-[11px] bg-orange-500 text-white rounded-md px-3 py-1.5 font-bold mt-2 hover:bg-orange-600 transition-all shadow-md shadow-orange-200 flex items-center gap-1.5 animate-pulse-orange"
                                                                >
                                                                    <AlertTriangle size={12} />
                                                                    IDENTIFICAR PEGATINAS
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={sku} className="flex justify-between items-center bg-gray-50 p-1 rounded border border-gray-100">
                                                        <button
                                                            onClick={() => onArticleClick(sku)}
                                                            className="text-blue-600 hover:underline truncate max-w-[200px] text-left"
                                                        >
                                                            {getArticleName(sku)}
                                                        </button>
                                                        <span className="font-semibold text-gray-800 ml-2">x{quantity}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center align-top">
                                    {load.duplicado && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <AlertOctagon size={12} className="mr-1" /> DUPLICADO
                                        </span>
                                    )}
                                    {load.modificada && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            MODIFICADO
                                        </span>
                                    )}
                                    {!load.duplicado && !load.modificada && (
                                        <div className="flex items-center justify-center gap-1 text-green-600">
                                            <CheckCircle2 size={16} />
                                            <span className="text-xs font-medium">Validada</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ADR Breakdown Modal */}
            {adrModalOpen && selectedLoadForAdr && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-purple-50">
                            <h4 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                                <AlertTriangle size={20} /> Desglose ADR
                            </h4>
                            <div className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded">
                                Carga: {selectedLoadForAdr.ref_carga}
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Indique qué tipos de pegatinas ADR se han utilizado en esta carga.
                                <br />
                                <span className="text-xs text-gray-400">Total en Sheets: {Object.entries(selectedLoadForAdr.consumptions).find(([k]) => k.toLowerCase().includes('adr'))?.[1] || 0}</span>
                            </p>

                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                                {adrArticles.map(art => {
                                    const val = adrBreakdownData[art.sku] || 0;
                                    return (
                                        <div key={art.sku} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-lg hover:border-purple-200 transition-colors shadow-sm">
                                            <div>
                                                <div className="font-bold text-sm text-gray-800">{art.nombre}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">{art.sku}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => updateAdrQty(art.sku, -1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">-</button>
                                                <span className="w-8 text-center font-bold text-lg text-purple-700">{val}</span>
                                                <button onClick={() => updateAdrQty(art.sku, 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold">+</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-100">
                                <div className="text-sm">
                                    Total: <span className="font-bold">{Object.values(adrBreakdownData).reduce((a, b) => Number(a) + Number(b), 0)}</span> un.
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setAdrModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                                    <button
                                        onClick={handleSaveAdrBreakdown}
                                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg shadow-purple-200 text-sm"
                                    >
                                        Guardar Desglose
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
