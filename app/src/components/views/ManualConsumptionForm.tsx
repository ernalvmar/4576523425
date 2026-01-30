import React, { useState } from 'react';
import { ClipboardList, AlertTriangle } from 'lucide-react';
import { InventoryItem, ManualConsumption } from '../../types';
import { getToday } from '../../utils/helpers';

interface ManualConsumptionFormProps {
    articles: InventoryItem[];
    onSubmit: (data: Omit<ManualConsumption, 'id' | 'user'>) => void;
    notify: (msg: string, type?: any) => void;
    isMonthOpen: boolean;
}

export const ManualConsumptionForm: React.FC<ManualConsumptionFormProps> = ({ articles, onSubmit, notify, isMonthOpen }) => {
    const [sku, setSku] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [date, setDate] = useState(getToday());

    const selectedArticle = articles.find(a => a.sku === sku);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sku) return notify('Selecciona un artículo', 'error');
        if (!reason) return notify('Indica el motivo del consumo', 'error');

        const qty = Number(quantity);
        if (selectedArticle && qty > selectedArticle.stockActual) {
            if (!window.confirm(`⚠️ Atención: La cantidad (${qty}) supera el stock actual. ¿Continuar?`)) {
                return;
            }
        }

        onSubmit({ date, sku, quantity: qty, reason });
        setSku('');
        setQuantity('');
        setReason('');
    };

    if (!isMonthOpen) {
        return (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="text-amber-500" size={20} />
                <p className="text-sm text-amber-800 font-medium">Mes cerrado. No se pueden registrar movimientos.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardList size={20} className="text-orange-600" />
                        Salida Manual / Mermas
                    </h3>
                </div>

                <div className="p-8 space-y-8">
                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 text-[13px] text-orange-800 leading-relaxed">
                        <strong className="font-bold">Nota operativa:</strong> Usa esta opción para consumos que no vienen de las cargas sincronizadas (uso interno, roturas, etc).
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Seleccionar Material</label>
                            <select
                                required
                                className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-orange-500/10 transition-all cursor-pointer"
                                value={sku}
                                onChange={e => setSku(e.target.value)}
                            >
                                <option value="">-- Buscar referencia --</option>
                                {articles.map(a => (
                                    <option key={a.sku} value={a.sku}>
                                        {a.nombre} [{a.sku}] • Stock: {a.stockActual} {a.unidad}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedArticle && (
                            <div className="bg-slate-800 p-5 rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">En Almacén</p>
                                    <p className="text-white font-bold">{selectedArticle.nombre}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-obramat-orange leading-none mb-1">{selectedArticle.stockActual}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{selectedArticle.unidad}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Fecha de Salida</label>
                                <input
                                    type="date"
                                    required
                                    className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Cantidad</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="Unidades"
                                    className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Justificación</label>
                            <textarea
                                required
                                rows={2}
                                placeholder="Indica el motivo de la salida..."
                                className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium resize-none"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl hover:bg-orange-700 font-bold uppercase tracking-widest text-xs shadow-md transition-all active:scale-[0.98]"
                        >
                            Registrar Salida
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
