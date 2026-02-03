import React, { useState, useMemo } from 'react';
import { PackagePlus, AlertTriangle } from 'lucide-react';
import { Article, InboundMovement } from '../../types';
import { getToday } from '../../utils/helpers';

interface InboundFormProps {
    articles: Article[];
    onSubmit: (data: Omit<InboundMovement, 'id' | 'user'> & { unitCost?: number }) => void;
    notify: (msg: string, type?: any) => void;
    isMonthOpen: boolean;
    onNavigateMaster: () => void;
    setIsEditing?: (val: boolean) => void;
}

export const InboundForm: React.FC<InboundFormProps> = ({ articles, onSubmit, notify, isMonthOpen, onNavigateMaster, setIsEditing }) => {
    // We only handle "Compra" here now. Reverse Logistics has its own view.
    const [sku, setSku] = useState('');
    const [quantity, setQuantity] = useState('');
    const [proveedor, setProveedor] = useState('');
    const [albaran, setAlbaran] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [date, setDate] = useState(getToday());

    const isDirty = sku !== '' || quantity !== '' || proveedor !== '' || albaran !== '';

    React.useEffect(() => {
        if (setIsEditing) setIsEditing(isDirty);
    }, [isDirty, setIsEditing]);

    const availableProviders = useMemo(() => {
        const provs = new Set(articles.map(a => a.proveedor));
        return Array.from(provs).filter(p => p !== 'N/A' && p !== '');
    }, [articles]);

    const filteredArticles = useMemo(() => {
        if (!proveedor) return [];
        return articles.filter(a => a.proveedor && a.proveedor.toLowerCase().includes(proveedor.toLowerCase()));
    }, [articles, proveedor]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sku) return notify('Selecciona un artículo', 'error');

        onSubmit({
            date,
            type: 'Compra',
            sku,
            quantity: Number(quantity),
            proveedor,
            albaran,
            unitCost: unitCost ? Number(unitCost) : undefined
        });

        setQuantity('');
        setSku('');
        setAlbaran('');
        setUnitCost('');
    };

    if (!isMonthOpen) {
        return (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="text-amber-500" size={20} />
                <p className="text-sm text-amber-800 font-medium">El mes actual está cerrado. No se pueden registrar movimientos.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-8 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <PackagePlus size={20} className="text-[#632f9a]" />
                        Entrada de Compra (Proveedor)
                    </h3>
                </div>

                <div className="p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">01. Seleccionar Proveedor</label>
                                <input
                                    list="providers-list"
                                    required
                                    placeholder="Escribe para buscar proveedor..."
                                    className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    value={proveedor}
                                    onChange={e => {
                                        const newVal = e.target.value;
                                        if (newVal !== proveedor) {
                                            setProveedor(newVal);
                                            setSku('');
                                        }
                                    }}
                                />
                                <datalist id="providers-list">
                                    {availableProviders.map((p: any) => (
                                        <option key={p} value={p} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">02. Seleccionar Material</label>
                                <select
                                    required
                                    disabled={!proveedor}
                                    className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer outline-none disabled:opacity-30"
                                    value={sku}
                                    onChange={e => setSku(e.target.value)}
                                >
                                    <option value="">-- Buscar material --</option>
                                    {filteredArticles.map(a => (
                                        <option key={a.sku} value={a.sku}>{a.nombre} ({a.sku})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Fecha Entrada</label>
                                <input
                                    type="date"
                                    required
                                    className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold font-mono outline-none"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Cantidad</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="Unidades"
                                    className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-black outline-none shadow-inner"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Nº Albarán</label>
                                <input
                                    type="text"
                                    placeholder="Ej: ALB-1234"
                                    className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold outline-none"
                                    value={albaran}
                                    onChange={e => setAlbaran(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2 block">Coste Total (€) <span className="text-[9px] text-slate-400 font-normal lowercase">(opcional)</span></label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Importe factura"
                                    className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold text-blue-600 outline-none"
                                    value={unitCost}
                                    onChange={e => setUnitCost(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                style={{ background: 'linear-gradient(135deg, #632f9a 0%, #0c9eea 100%)' }}
                                className="w-full text-white py-4 px-6 rounded-2xl hover:opacity-90 font-black uppercase tracking-[3px] text-xs shadow-xl transition-all active:scale-[0.98]"
                            >
                                Confirmar Entrada de Compra
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
