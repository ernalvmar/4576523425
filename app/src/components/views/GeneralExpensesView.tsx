import React, { useState, useMemo } from 'react';
import { ClipboardList, Search, Plus, Filter, Package } from 'lucide-react';
import { GeneralExpense } from '../../types';
import { getToday, formatMonth } from '../../utils/helpers';

interface GeneralExpensesViewProps {
    expenses: GeneralExpense[];
    obramatProviders: string[];
    onRefresh: () => void;
    notify: (msg: string, type?: any) => void;
}

export const GeneralExpensesView: React.FC<GeneralExpensesViewProps> = ({
    expenses,
    obramatProviders,
    onRefresh,
    notify
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [containerId, setContainerId] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [orderNumber, setOrderNumber] = useState('');
    const [provider, setProvider] = useState('');
    const [date, setDate] = useState(getToday());
    const [isSaving, setIsSaving] = useState(false);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e =>
            e.container_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.provider?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [expenses, searchTerm]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!containerId || !description) return notify('Contenedor y descripción son obligatorios', 'error');

        setIsSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/general-expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    container_id: containerId.toUpperCase(),
                    description,
                    quantity,
                    order_number: orderNumber,
                    provider,
                    date
                })
            });

            if (res.ok) {
                notify('Gasto general registrado');
                setContainerId('');
                setDescription('');
                setQuantity(1);
                setOrderNumber('');
                setProvider('');
                setIsAdding(false);
                onRefresh();
            }
        } catch (e) {
            notify('Error al guardar', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <Package className="text-purple-600" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Gastos Generales</h3>
                        <p className="text-sm text-slate-400 font-medium">Material auxiliar y consumibles no inventariables</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${isAdding ? 'bg-slate-100 text-slate-600' : 'envos-gradient text-white shadow-lg'}`}
                >
                    {isAdding ? 'Cancelar' : <><Plus size={18} /> Nuevo Registro</>}
                </button>
            </div>

            {isAdding && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
                    <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Contenedor</label>
                            <input
                                type="text"
                                className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold uppercase"
                                value={containerId}
                                onChange={e => setContainerId(e.target.value)}
                                placeholder="P.e: SEV-001"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Descripción del Material</label>
                            <input
                                type="text"
                                className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="P.e: Cajas de cartón, material oficina..."
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Nº Pedido</label>
                            <input
                                type="text"
                                className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm"
                                value={orderNumber}
                                onChange={e => setOrderNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Proveedor</label>
                            <input
                                type="text"
                                list="exp-provs"
                                className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium"
                                value={provider}
                                onChange={e => setProvider(e.target.value)}
                                placeholder="Buscar o escribir..."
                            />
                            <datalist id="exp-provs">
                                {obramatProviders.map(p => <option key={p} value={p} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Cantidad / Bultos</label>
                            <input
                                type="number"
                                className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold"
                                value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div className="md:col-span-3 flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="envos-gradient text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : 'Confirmar Registro'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar en el histórico de gastos..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
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
                        {filteredExpenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-700">{exp.date}</div>
                                    <div className="text-[10px] font-bold text-slate-400">{formatMonth(exp.period)}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-black text-slate-900">{exp.container_id}</div>
                                    <div className="text-xs font-medium text-slate-500">{exp.order_number || '-'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-700">{exp.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-700">{exp.provider || '-'}</div>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-slate-800">
                                    {exp.quantity}
                                </td>
                            </tr>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                    No se encontraron registros
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
