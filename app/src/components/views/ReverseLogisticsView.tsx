import React, { useState, useMemo, useEffect } from 'react';
import { Package, Truck, Trash2, CheckCircle2, AlertTriangle, Search, Plus, ExternalLink, ClipboardList } from 'lucide-react';
import { Article, GeneralExpense, StorageEntry, StorageEntryProcedure } from '../../types';
import { getToday, formatMonth } from '../../utils/helpers';

interface ReverseLogisticsViewProps {
    articles: Article[];
    generalExpenses: GeneralExpense[];
    storageEntries: StorageEntry[];
    currentMonth: string;
    onRefresh: () => void;
    notify: (msg: string, type?: any) => void;
}

export const ReverseLogisticsView: React.FC<ReverseLogisticsViewProps> = ({
    articles,
    generalExpenses,
    storageEntries,
    currentMonth,
    onRefresh,
    notify
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'reception' | 'storage' | 'expenses'>('reception');

    // Reception State
    const [containerId, setContainerId] = useState('');
    const [provider, setProvider] = useState('');
    const [date, setDate] = useState(getToday());
    const [receptionLines, setReceptionLines] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Filtered lists
    const [storageSearch, setStorageSearch] = useState('');
    const activeStorage = useMemo(() => {
        return storageEntries.filter(s =>
            s.status === 'ACTIVE' &&
            (s.container_id.toLowerCase().includes(storageSearch.toLowerCase()) ||
                s.order_numbers.toLowerCase().includes(storageSearch.toLowerCase()) ||
                s.provider.toLowerCase().includes(storageSearch.toLowerCase()))
        );
    }, [storageEntries, storageSearch]);

    const handleAddLine = (type: 'STOCK' | 'STORAGE' | 'EXPENSE') => {
        const newLine = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            sku: '',
            quantity: 1,
            order_numbers: '',
            description: '',
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
        if (!containerId || !provider || receptionLines.length === 0) {
            notify('Completa los datos del contenedor y añade al menos una línea', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reverse-logistics/container`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    container_id: containerId.toUpperCase(),
                    provider,
                    date,
                    items: receptionLines,
                    user: 'Operario' // Should come from auth
                })
            });

            if (res.ok) {
                notify('Contenedor de inversa registrado correctamente');
                setContainerId('');
                setProvider('');
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
        <div className="space-y-6">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-fit mb-6 shadow-sm">
                <button
                    onClick={() => setActiveSubTab('reception')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeSubTab === 'reception' ? 'bg-[#632f9a] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Recepción Contenedor
                </button>
                <button
                    onClick={() => setActiveSubTab('storage')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeSubTab === 'storage' ? 'bg-[#632f9a] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Gestión Almacenaje
                </button>
                <button
                    onClick={() => setActiveSubTab('expenses')}
                    className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeSubTab === 'expenses' ? 'bg-[#632f9a] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Gastos Generales
                </button>
            </div>

            {activeSubTab === 'reception' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Truck size={20} className="text-[#632f9a]" />
                            Entrada de Inversa (Multi-línea)
                        </h3>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Contenedor</label>
                                <input
                                    type="text"
                                    placeholder="Ej: MSKU1234567"
                                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold uppercase"
                                    value={containerId}
                                    onChange={e => setContainerId(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Proveedor (Destino)</label>
                                <input
                                    type="text"
                                    placeholder="Nombre del proveedor..."
                                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium"
                                    list="provs-rl"
                                    value={provider}
                                    onChange={e => setProvider(e.target.value)}
                                />
                                <datalist id="provs-rl">
                                    {Array.from(new Set(articles.map(a => a.proveedor))).map(p => <option key={p} value={p} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Fecha de Llegada</label>
                                <input
                                    type="date"
                                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Contenido del Contenedor</h4>

                            {receptionLines.map((line, idx) => (
                                <div key={line.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all flex gap-4 items-start relative group animate-slide-up">
                                    <div className="bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-slate-400">
                                        {idx + 1}
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tipo</label>
                                            <div className={`text-[11px] font-bold px-3 py-1.5 rounded-lg w-fit ${line.type === 'STOCK' ? 'bg-blue-100 text-blue-700' :
                                                    line.type === 'STORAGE' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {line.type === 'STOCK' ? 'Material Reutilizable' :
                                                    line.type === 'STORAGE' ? 'Mercancía Almacenaje' : 'Gasto General'}
                                            </div>
                                        </div>

                                        {line.type === 'STOCK' && (
                                            <>
                                                <div className="md:col-span-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Buscar Material (P.e: Cinta)</label>
                                                    <select
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                                                        value={line.sku}
                                                        onChange={e => updateLine(line.id, { sku: e.target.value })}
                                                    >
                                                        <option value="">-- Seleccionar --</option>
                                                        {articles.filter(a => a.tipo === 'Usado' || a.tipo === 'Nuevo').map(a => (
                                                            <option key={a.sku} value={a.sku}>{a.nombre} [{a.sku}]</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cantidad</label>
                                                    <input
                                                        type="number"
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold"
                                                        value={line.quantity}
                                                        onChange={e => updateLine(line.id, { quantity: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {line.type === 'STORAGE' && (
                                            <>
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nº Pedidos</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Varios sep. por comas"
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                                                        value={line.order_numbers}
                                                        onChange={e => updateLine(line.id, { order_numbers: e.target.value })}
                                                    />
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Procedimiento</label>
                                                    <select
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                                                        value={line.procedure}
                                                        onChange={e => updateLine(line.id, { procedure: e.target.value })}
                                                    >
                                                        <option value="RECOGER">RECOGER</option>
                                                        <option value="ENVIAR">ENVIAR</option>
                                                        <option value="DESTRUIR">DESTRUIR</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Comentarios</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Observaciones..."
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                                                        value={line.comments}
                                                        onChange={e => updateLine(line.id, { comments: e.target.value })}
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {line.type === 'EXPENSE' && (
                                            <>
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Descripción</label>
                                                    <input
                                                        type="text"
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                                                        value={line.description}
                                                        onChange={e => updateLine(line.id, { description: e.target.value })}
                                                    />
                                                </div>
                                                <div className="md:col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nº Pedido</label>
                                                    <input
                                                        type="text"
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                                                        value={line.order_numbers} // reuse field for order
                                                        onChange={e => updateLine(line.id, { order_numbers: e.target.value, order_number: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Bultos</label>
                                                    <input
                                                        type="number"
                                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold"
                                                        value={line.quantity}
                                                        onChange={e => updateLine(line.id, { quantity: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => removeLine(line.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleAddLine('STOCK')}
                                    className="flex-1 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
                                >
                                    <Plus size={16} /> Añadir Material Usado
                                </button>
                                <button
                                    onClick={() => handleAddLine('STORAGE')}
                                    className="flex-1 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-100 transition-all"
                                >
                                    <Plus size={16} /> Añadir Mercancía Almacén
                                </button>
                                <button
                                    onClick={() => handleAddLine('EXPENSE')}
                                    className="flex-1 py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-100 transition-all"
                                >
                                    <Plus size={16} /> Gasto General
                                </button>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <button
                                onClick={handleSaveReception}
                                disabled={isSaving}
                                style={{ background: 'linear-gradient(135deg, #632f9a 0%, #0c9eea 100%)' }}
                                className="w-full text-white py-4 rounded-xl font-black uppercase tracking-[3px] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : 'Confirmar Recepción del Contenedor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'storage' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <Package className="text-orange-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Mercancía en Custodia</h3>
                                <p className="text-sm text-slate-400 font-medium">Gestiona y factura el almacenaje de devoluciones</p>
                            </div>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por contenedor, pedido o proveedor..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                value={storageSearch}
                                onChange={e => setStorageSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Llegada / Inicio Fac.</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Contenedor / Pedidos</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Proveedor</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Procedimiento</th>
                                    <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Días / Estima. (€)</th>
                                    <th className="px-6 py-4"></th>
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
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-700">{item.entry_date}</div>
                                                <div className="text-[10px] font-bold text-orange-500 uppercase">Libre hasta: {item.billing_start_date}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-black text-slate-900">{item.container_id}</div>
                                                <div className="text-xs font-medium text-slate-500 truncate max-w-[200px]">{item.order_numbers}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-700">{item.provider}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight ${item.procedure === 'DESTRUIR' ? 'bg-red-100 text-red-700' :
                                                        item.procedure === 'ENVIAR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {item.procedure}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-sm font-bold text-slate-800">{diff} días totales</div>
                                                <div className="text-xs font-black text-orange-600">{(billableDays * 0.18).toFixed(2)}€ ({billableDays} d. fact)</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRegisterExit(item.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Registrar Salida / Fin de Almacenaje"
                                                >
                                                    <LogOut size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {activeStorage.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No hay mercancía activa en almacén
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeSubTab === 'expenses' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <ClipboardList className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Gastos Generales</h3>
                                <p className="text-sm text-slate-400 font-medium">Historio de material no inventariable recibido</p>
                            </div>
                        </div>
                    </div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Fecha / Periodo</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Contenedor / Pedido</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Descripción</th>
                                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Proveedor</th>
                                <th className="text-right px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Bultos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {generalExpenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-700">{exp.date}</div>
                                        <div className="text-[10px] font-bold text-slate-400">{formatMonth(exp.period)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-black text-slate-900">{exp.container_id}</div>
                                        <div className="text-xs font-medium text-slate-500">{exp.order_number}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-700">{exp.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-700">{exp.provider}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-800">
                                        {exp.quantity}
                                    </td>
                                </tr>
                            ))}
                            {generalExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No hay gastos generales registrados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Helper for exit icon
const LogOut: React.FC<{ size: number }> = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
