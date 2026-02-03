import React, { useState, useMemo } from 'react';
import { Package, Search, Truck, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '../../types';
import { getToday } from '../../utils/helpers';

interface PalletsConsumptionFormProps {
    articles: InventoryItem[];
    obramatProviders: string[];
    palletConsumptions: any[];
    isMonthOpen: boolean;
    onRefresh: () => void;
    notify: (msg: string, type?: any) => void;
    onBack: () => void;
}

export const PalletsConsumptionForm: React.FC<PalletsConsumptionFormProps> = ({
    articles,
    obramatProviders,
    palletConsumptions,
    isMonthOpen,
    onRefresh,
    notify,
    onBack
}) => {
    const [sku, setSku] = useState('');
    const [date, setDate] = useState(getToday());
    const [agency, setAgency] = useState('');
    const [provider, setProvider] = useState('');
    const [orderRef, setOrderRef] = useState('');
    const [weight, setWeight] = useState('');
    const [numPackages, setNumPackages] = useState('');
    const [resultingPallets, setResultingPallets] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [historySearch, setHistorySearch] = useState('');

    const filteredHistory = useMemo(() => {
        return palletConsumptions.filter(p =>
            p.agency.toLowerCase().includes(historySearch.toLowerCase()) ||
            p.provider.toLowerCase().includes(historySearch.toLowerCase()) ||
            p.order_ref.toLowerCase().includes(historySearch.toLowerCase())
        );
    }, [palletConsumptions, historySearch]);

    const palletArticles = articles.filter(a => a.nombre.toLowerCase().includes('palet') || a.sku.toLowerCase().includes('palet'));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sku || !agency || !resultingPallets) {
            return notify('Material, Agencia y Palets resultantes son obligatorios', 'error');
        }

        setIsSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pallet-consumptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    agency,
                    provider: provider || 'AGRUPADOS',
                    order_ref: orderRef || 'AGRUPADOS',
                    weight: Number(weight) || 0,
                    num_packages: Number(numPackages) || 0,
                    resulting_pallets: Number(resultingPallets),
                    sku,
                    user: 'Operario' // Should come from auth
                })
            });

            if (res.ok) {
                notify('Consumo de palets registrado correctamente');
                onRefresh();
                // Clear form
                setAgency('');
                setProvider('');
                setOrderRef('');
                setWeight('');
                setNumPackages('');
                setResultingPallets('');
            } else {
                throw new Error('Error al registrar');
            }
        } catch (e) {
            notify('Error al registrar el consumo', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
            {!isMonthOpen && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                    <AlertTriangle className="text-amber-500" size={20} />
                    <p className="text-sm text-amber-800 font-bold uppercase tracking-widest text-[10px]">El mes actual está cerrado. El registro de expediciones está deshabilitado.</p>
                </div>
            )}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-2xl">
                            <Package size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Expedición de Palets</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Registro detallado de conformación de palets</p>
                        </div>
                    </div>
                    <button onClick={onBack} className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                        Cerrar modo palets
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Material Selection */}
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Tipo de Palet (Consumible)</label>
                            <select
                                required
                                className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-bold appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                                value={sku}
                                onChange={e => setSku(e.target.value)}
                            >
                                <option value="">-- Seleccionar material --</option>
                                {palletArticles.map(a => (
                                    <option key={a.sku} value={a.sku}>{a.nombre} [{a.sku}] - Stock: {a.stockActual}</option>
                                ))}
                            </select>
                        </div>

                        {/* Agency and Date */}
                        <div className="md:col-span-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Agencia</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej: DHL, Seur..."
                                className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium"
                                value={agency}
                                onChange={e => setAgency(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Fecha</label>
                            <input
                                type="date"
                                required
                                className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium font-mono"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>

                        {/* Obramat Provider & Order */}
                        <div className="md:col-span-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Proveedor Obramat</label>
                            <input
                                type="text"
                                list="obramat-history-provs"
                                placeholder="Agrupados"
                                className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium"
                                value={provider}
                                onChange={e => setProvider(e.target.value)}
                            />
                            <datalist id="obramat-history-provs">
                                {obramatProviders.map(p => <option key={p} value={p} />)}
                            </datalist>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Nº Pedido</label>
                            <input
                                type="text"
                                placeholder="Agrupados"
                                className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-medium"
                                value={orderRef}
                                onChange={e => setOrderRef(e.target.value)}
                            />
                        </div>

                        {/* Metrics */}
                        <div className="md:col-span-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Peso (kg)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-bold"
                                        value={weight}
                                        onChange={e => setWeight(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Bultos</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="block w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-sm font-bold"
                                        value={numPackages}
                                        onChange={e => setNumPackages(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Target Pallets */}
                        <div className="md:col-span-1">
                            <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest ml-1 mb-2 block">Palets Resultantes</label>
                            <input
                                type="number"
                                required
                                placeholder="Unid."
                                className="block w-full bg-blue-50 border-2 border-blue-200 rounded-2xl py-3 px-5 text-lg font-black text-blue-700 shadow-sm outline-none transition-all placeholder:text-blue-200"
                                value={resultingPallets}
                                onChange={e => setResultingPallets(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving || !isMonthOpen}
                            className="w-full md:w-80 envos-gradient text-white py-4 rounded-3xl font-black uppercase tracking-[3px] shadow-xl hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            {isSaving ? 'Registrando...' : 'Confirmar Expedición'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Historical Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[4px]">Historial de Expediciones</h4>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por agencia, proveedor, pedido..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                            value={historySearch}
                            onChange={e => setHistorySearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="text-left px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th className="text-left px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Agencia</th>
                                <th className="text-left px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Proveedor Obramat</th>
                                <th className="text-left px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Pedido</th>
                                <th className="text-right px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Bultos / Peso</th>
                                <th className="text-right px-8 py-4 text-[9px] font-black text-blue-600 uppercase tracking-widest">Palets Totales</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredHistory.map(h => (
                                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4 text-xs font-bold text-slate-600 font-mono">{h.date}</td>
                                    <td className="px-8 py-4 text-sm font-black text-slate-800">{h.agency}</td>
                                    <td className="px-8 py-4 text-sm font-bold text-slate-600">{h.provider}</td>
                                    <td className="px-8 py-4 text-sm font-medium text-slate-500">{h.order_ref}</td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="text-xs font-bold text-slate-700">{h.num_packages} bultos</div>
                                        <div className="text-[10px] font-bold text-slate-400">{h.weight} kg</div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-black text-sm">{h.resulting_pallets}</span>
                                    </td>
                                </tr>
                            ))}
                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-10 text-center text-slate-300 text-xs font-bold uppercase">No se han encontrado expediciones</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
