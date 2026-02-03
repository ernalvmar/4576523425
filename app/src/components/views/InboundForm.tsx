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
    const [type, setType] = useState<'Compra' | 'Logística Inversa'>('Compra');
    const [sku, setSku] = useState('');
    const [quantity, setQuantity] = useState('');
    const [proveedor, setProveedor] = useState('');
    const [albaran, setAlbaran] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [date, setDate] = useState(getToday());
    const [contenedor, setContenedor] = useState('');
    const [precinto, setPrecinto] = useState('');

    const isDirty = sku !== '' || quantity !== '' || proveedor !== '' || albaran !== '';

    React.useEffect(() => {
        if (setIsEditing) setIsEditing(isDirty);
    }, [isDirty, setIsEditing]);

    const availableProviders = useMemo(() => {
        const provs = new Set(articles.map(a => a.proveedor));
        return Array.from(provs).filter(p => p !== 'N/A' && p !== '');
    }, [articles]);

    const filteredArticles = useMemo(() => {
        if (type === 'Compra') {
            if (!proveedor) return [];
            return articles.filter(a => a.proveedor && a.proveedor.toLowerCase().includes(proveedor.toLowerCase()));
        } else {
            return articles;
        }
    }, [articles, type, proveedor]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sku) return notify('Selecciona un artículo', 'error');

        onSubmit({
            date,
            type,
            sku,
            quantity: Number(quantity),
            proveedor: type === 'Compra' ? proveedor : undefined,
            albaran: type === 'Compra' ? albaran : undefined,
            unitCost: type === 'Compra' && unitCost ? Number(unitCost) : undefined,
            contenedor: type === 'Logística Inversa' ? contenedor : undefined,
            precinto: type === 'Logística Inversa' ? precinto : undefined
        });

        setQuantity('');
        setSku('');
        if (type === 'Compra') {
            setAlbaran('');
            setUnitCost('');
        } else {
            setContenedor('');
            setPrecinto('');
        }
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
            <div className="mb-8 overflow-hidden bg-white border border-slate-200 rounded-2xl">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <PackagePlus size={20} className="text-[#632f9a]" />
                        Registrar Movimiento
                    </h3>
                </div>

                <div className="p-8">
                    <div className="flex gap-4 mb-10">
                        <button
                            type="button"
                            onClick={() => { setType('Compra'); setSku(''); }}
                            className={`flex-1 p-4 text-left rounded-xl border transition-all duration-200 ${type === 'Compra' ? 'bg-blue-50/50 border-blue-200 ring-2 ring-blue-500/10' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${type === 'Compra' ? 'text-blue-600' : 'text-slate-400'}`}>Proveedor</span>
                            <span className={`text-base font-bold ${type === 'Compra' ? 'text-slate-800' : 'text-slate-400'}`}>Nueva Entrada</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType('Logística Inversa'); setSku(''); }}
                            className={`flex-1 p-4 text-left rounded-xl border transition-all duration-200 ${type === 'Logística Inversa' ? 'bg-teal-50/50 border-teal-200 ring-2 ring-teal-500/10' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${type === 'Logística Inversa' ? 'text-teal-600' : 'text-slate-400'}`}>Devolución</span>
                            <span className={`text-base font-bold ${type === 'Logística Inversa' ? 'text-slate-800' : 'text-slate-400'}`}>Logística Inversa</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {type === 'Compra' && (
                                <div className="md:col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">01. Seleccionar Proveedor</label>
                                    <input
                                        list="providers-list"
                                        required
                                        placeholder="Escribe para buscar..."
                                        className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 transition-all"
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
                            )}

                            <div className="md:col-span-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">
                                    {type === 'Compra' ? '02. Seleccionar Material' : '01. Seleccionar Material'}
                                </label>
                                <select
                                    required
                                    className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
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
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Fecha</label>
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

                            {type === 'Compra' ? (
                                <>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Nº Albarán</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: ALB-1234"
                                            className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium"
                                            value={albaran}
                                            onChange={e => setAlbaran(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Coste Total (€)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="Importe factura"
                                            className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium"
                                            value={unitCost}
                                            onChange={e => setUnitCost(e.target.value)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Nº Contenedor</label>
                                        <input
                                            type="text"
                                            placeholder="Opcional"
                                            className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium"
                                            value={contenedor}
                                            onChange={e => setContenedor(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Precinto</label>
                                        <input
                                            type="text"
                                            placeholder="Opcional"
                                            className="block w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-medium"
                                            value={precinto}
                                            onChange={e => setPrecinto(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                style={{ background: 'linear-gradient(135deg, #632f9a 0%, #0c9eea 100%)' }}
                                className="w-full text-white py-3 px-6 rounded-xl hover:opacity-90 font-bold uppercase tracking-widest text-xs shadow-md transition-all active:scale-[0.98]"
                            >
                                Confirmar Registro
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
