import React, { useState, useMemo } from 'react';
import { Package, Truck, Trash2, Search, Plus, History, LogOut, Info } from 'lucide-react';
import { Article, StorageEntry, StorageEntryProcedure } from '../../types';
import { getToday } from '../../utils/helpers';

interface ReverseLogisticsViewProps {
    articles: Article[];
    obramatProviders: string[];
    storageEntries: StorageEntry[];
    currentMonth: string;
    onRefresh: () => void;
    notify: (msg: string, type?: any) => void;
}

export const ReverseLogisticsView: React.FC<ReverseLogisticsViewProps> = ({
    articles,
    obramatProviders,
    storageEntries,
    onRefresh,
    notify
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'reception' | 'storage' | 'history'>('reception');

    // Reception State
    const [containerId, setContainerId] = useState('');
    const [date, setDate] = useState(getToday());
    const [receptionLines, setReceptionLines] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Search/Filters
    const [searchTerm, setSearchTerm] = useState('');

    const activeStorage = useMemo(() => {
        return storageEntries.filter(s =>
            s.status === 'ACTIVE' &&
            (s.container_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.order_numbers.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.provider.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [storageEntries, searchTerm]);

    const historyStorage = useMemo(() => {
        return storageEntries.filter(s =>
        (s.container_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.order_numbers.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.provider.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [storageEntries, searchTerm]);

    const handleAddLine = (type: 'STOCK' | 'STORAGE') => {
        const newLine = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            provider: '', // Line-level provider
            sku: '',
            quantity: 1,
            order_numbers: '',
            procedure: 'RECOGER' as StorageEntryProcedure,
            comments: ''
        };
        setReceptionLines([...receptionLines, newLine]);
    };

    const updateLine = (id: string, updates: any) => {
        setReceptionLines(receptionLines.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const removeLine = (id: string) => {
        setReceptionLines(receptionLines.filter(l => l.id !== id));
    };

    const handleSaveReception = async () => {
        if (!containerId || receptionLines.length === 0) {
            notify('Indica el ID del contenedor y añade al menos una línea', 'error');
            return;
        }

        // Validate all lines have a provider
        const missingProvider = receptionLines.some(l => !l.provider);
        if (missingProvider) {
            notify('Todas las líneas deben tener un proveedor asignado', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reverse-logistics/container`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    container_id: containerId.toUpperCase(),
                    date,
                    items: receptionLines,
                    user: 'Operario'
                })
            });

            if (res.ok) {
                notify('Contenedor de inversa registrado correctamente');
                setContainerId('');
                setReceptionLines([]);
                onRefresh();
                setActiveSubTab('storage');
            } else {
                throw new Error('Error al guardar');
            }
        } catch (e) {
            notify('Error al registrar la recepción', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRegisterExit = async (id: number) => {
        const exitDate = prompt('Indica la fecha de salida (AAAA-MM-DD)', getToday());
        if (!exitDate) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/storage/${id}/exit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exit_date: exitDate })
            });

            if (res.ok) {
                notify('Salida registrada correctamente');
                onRefresh();
            }
        } catch (e) {
            notify('Error al registrar salida', 'error');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 w-fit mb-6 shadow-sm">
                <button
                    onClick={() => setActiveSubTab('reception')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'reception' ? 'envos-gradient text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Recepción
                </button>
                <button
                    onClick={() => setActiveSubTab('storage')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'storage' ? 'envos-gradient text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    En Almacén
                </button>
                <button
                    onClick={() => setActiveSubTab('history')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'history' ? 'envos-gradient text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Histórico
                </button>
            </div>

            {activeSubTab === 'reception' && (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Truck className="text-[#632f9a]" size={28} />
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Recepción de Inversa</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[2px] mt-0.5">Entrada de materiales y bultos en custodia</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">ID Contenedor</label>
                                <input
                                    type="text"
                                    placeholder="PE: MSKU1234567"
                                    className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-black uppercase focus:ring-4 focus:ring-purple-500/10 transition-all"
                                    value={containerId}
                                    onChange={e => setContainerId(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Fecha de Llegada</label>
                                <input
                                    type="date"
                                    className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-bold font-mono"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-6 mb-10">
                            {/* Datalist for line providers */}
                            <datalist id="line-provs">
                                {obramatProviders.map(p => <option key={p} value={p} />)}
                            </datalist>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Detalle del Contenido</h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAddLine('STOCK')}
                                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 border border-blue-100 flex items-center gap-2"
                                    >
                                        <Plus size={14} /> + Material Usado
                                    </button>
                                    <button
                                        onClick={() => handleAddLine('STORAGE')}
                                        className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 border border-orange-100 flex items-center gap-2"
                                    >
                                        <Plus size={14} /> + Custodia/Almacén
                                    </button>
                                </div>
                            </div>

                            {receptionLines.length === 0 && (
                                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                    <Package size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Añade materiales o bultos para empezar</p>
                                </div>
                            )}

                            {receptionLines.map((line, idx) => (
                                <div key={line.id} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all flex gap-6 items-start relative animate-slide-up group">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${line.type === 'STOCK' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {idx + 1}
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Proveedor</label>
                                            <input
                                                type="text"
                                                list="line-provs"
                                                placeholder="Prov. Obramat"
                                                className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                                value={line.provider}
                                                onChange={e => updateLine(line.id, { provider: e.target.value })}
                                            />
                                        </div>

                                        {line.type === 'STOCK' ? (
                                            <>
                                                <div className="md:col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Material Reutilizable</label>
                                                    <select
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                                        value={line.sku}
                                                        onChange={e => updateLine(line.id, { sku: e.target.value })}
                                                    >
                                                        <option value="">-- Seleccionar --</option>
                                                        {articles.filter(a => a.tipo === 'Usado').map(a => (
                                                            <option key={a.sku} value={a.sku}>{a.nombre}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Cantidad</label>
                                                    <input
                                                        type="number"
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-black"
                                                        value={line.quantity}
                                                        onChange={e => updateLine(line.id, { quantity: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="md:col-span-1 opacity-40 italic flex items-end pb-2 text-[10px]">Stock Automático</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Nº Pedidos</label>
                                                    <input
                                                        type="text"
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                                        placeholder="Varios..."
                                                        value={line.order_numbers}
                                                        onChange={e => updateLine(line.id, { order_numbers: e.target.value })}
                                                    />
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Destino</label>
                                                    <select
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold"
                                                        value={line.procedure}
                                                        onChange={e => updateLine(line.id, { procedure: e.target.value })}
                                                    >
                                                        <option value="RECOGER">RECOGER</option>
                                                        <option value="ENVIAR">ENVIAR</option>
                                                        <option value="DESTRUIR">DESTRUIR</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Notas</label>
                                                    <input
                                                        type="text"
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium"
                                                        placeholder="Obra, cliente, etc..."
                                                        value={line.comments}
                                                        onChange={e => updateLine(line.id, { comments: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => removeLine(line.id)}
                                        className="text-slate-200 hover:text-red-500 transition-colors p-2 self-center"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-10 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={handleSaveReception}
                                disabled={isSaving || receptionLines.length === 0}
                                className="w-full md:w-auto envos-gradient text-white px-20 py-4 rounded-2xl font-black uppercase tracking-[4px] shadow-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30"
                            >
                                {isSaving ? 'Registrando...' : 'Confirmar Entrada'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'storage' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-orange-100 rounded-2xl">
                                <Package className="text-orange-600" size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Custodia Activa</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de bultos esperando salida</p>
                            </div>
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Filtrar custodia (ID, Pedido, Prov)..."
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Ingreso</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Identificación</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Proveedor</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Estado / Días</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeStorage.map(item => {
                                    const entry = new Date(item.entry_date);
                                    const billStart = new Date(item.billing_start_date);
                                    const now = new Date();
                                    const diff = Math.ceil((now.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
                                    const billableDays = Math.max(0, Math.ceil((now.getTime() - billStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-slate-700">{item.entry_date}</div>
                                                <div className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1 mt-1">
                                                    <Info size={10} /> Factura el: {item.billing_start_date}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.container_id}</div>
                                                <div className="text-xs font-bold text-slate-400 truncate max-w-[200px] mt-1">Pedidos: {item.order_numbers}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-bold text-slate-700">{item.provider}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${item.procedure === 'DESTRUIR' ? 'bg-red-100 text-red-700' :
                                                        item.procedure === 'ENVIAR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {item.procedure}
                                                    </span>
                                                    <div className="text-right">
                                                        <div className="text-xs font-black text-slate-800">{diff} días</div>
                                                        <div className="text-[10px] font-black text-orange-600">{(billableDays * 0.18).toFixed(2)}€ (+{billableDays}d)</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => handleRegisterExit(item.id)}
                                                    className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all shadow-sm hover:shadow-md"
                                                    title="Finalizar Custodia"
                                                >
                                                    <LogOut size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeSubTab === 'history' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-slate-100 rounded-2xl text-slate-600">
                                <History size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Histórico de Custodia</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Archivo de todas las entradas registradas</p>
                            </div>
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar en el histórico completo..."
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-slate-500/10 outline-none transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Entrada / Salida</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Identificación</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Proveedor Obramat</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Estado Final</th>
                                    <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Notas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {historyStorage.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black text-slate-700">{item.entry_date}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.exit_date ? `Salida: ${item.exit_date}` : 'Aún en almacén'}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.container_id}</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Ref: {item.order_numbers}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-slate-700">{item.provider}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight w-fit ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {item.status === 'ACTIVE' ? 'ACTIVO' : 'CERRADO'}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{item.procedure}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-medium text-slate-500 max-w-xs">{item.comments || '-'}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
