import React, { useState, useEffect } from 'react';
import { Settings, Plus, X, Pencil, Trash2, RefreshCw, Scale, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Article, InventoryItem } from '../../types';
import { generateSmartSKU, getToday } from '../../utils/helpers';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface ArticlesMasterViewProps {
    inventory: InventoryItem[];
    onSave: (article: Article, isEdit: boolean) => void;
    onRegularize: (sku: string, qty: number, reason: string, type: 'physical_count' | 'adjustment') => void;
    onToggleStatus: (sku: string) => void;
    deepLinkSku: string | null;
    clearDeepLink: () => void;
    currentUser: any;
}

export const ArticlesMasterView: React.FC<ArticlesMasterViewProps> = ({
    inventory,
    onSave,
    onRegularize,
    onToggleStatus,
    deepLinkSku,
    clearDeepLink,
    currentUser
}) => {
    const isResponsable = currentUser?.rol === 'responsable';
    const [showForm, setShowForm] = useState(false);
    const [showRegModal, setShowRegModal] = useState(false);
    const [showConfirmToggle, setShowConfirmToggle] = useState(false);
    const [articleToToggle, setArticleToToggle] = useState<InventoryItem | null>(null);

    // Regularization State
    const [selectedForReg, setSelectedForReg] = useState<InventoryItem | null>(null);
    const [regType, setRegType] = useState<'physical_count' | 'adjustment'>('adjustment');
    const [regQty, setRegQty] = useState<number | ''>('');
    const [regReason, setRegReason] = useState('');

    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<Article>>({
        tipo: 'Nuevo',
        unidad: 'UN',
        activo: true
    });

    // Deep Linking Effect
    useEffect(() => {
        if (deepLinkSku) {
            const item = inventory.find(i => i.sku === deepLinkSku);
            if (item) {
                handleEdit(item);
            }
            clearDeepLink();
        }
    }, [deepLinkSku, inventory, clearDeepLink]);

    const handleCreate = () => {
        setIsEditMode(false);
        setFormData({ tipo: 'Nuevo', unidad: 'UN', activo: true, fecha_alta: getToday() });
        setShowForm(true);
    };

    const handleEdit = (article: InventoryItem) => {
        setIsEditMode(true);
        setFormData({ ...article });
        setShowForm(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imagen_url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateSKU = () => {
        if (!formData.nombre) {
            alert('Por favor introduce un nombre primero.');
            return;
        }
        const newSku = generateSmartSKU(formData.nombre, formData.tipo || 'Nuevo');
        setFormData(prev => ({ ...prev, sku: newSku }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const article: Article = {
            ...formData as Article,
            stock_inicial: Number(formData.stock_inicial) || 0,
            stock_seguridad: Number(formData.stock_seguridad) || 0,
            lead_time_dias: Number(formData.lead_time_dias) || 0,
            precio_venta: Number(formData.precio_venta) || 0,
        };
        onSave(article, isEditMode);
        setShowForm(false);
    };

    const openRegularization = (item: InventoryItem) => {
        setSelectedForReg(item);
        setRegQty('');
        setRegReason('');
        setRegType('adjustment');
        setShowRegModal(true);
    };

    const submitRegularization = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedForReg && regQty !== '') {
            onRegularize(selectedForReg.sku, Number(regQty), regReason, regType);
            setShowRegModal(false);
        }
    };

    const handleToggleClick = (item: InventoryItem) => {
        setArticleToToggle(item);
        setShowConfirmToggle(true);
    };

    const confirmToggle = () => {
        if (articleToToggle) {
            onToggleStatus(articleToToggle.sku);
        }
        setShowConfirmToggle(false);
        setArticleToToggle(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Settings size={20} className="text-gray-500" />
                    Gestión de Materiales
                </h3>
                {isResponsable && (
                    <button
                        onClick={handleCreate}
                        className="envos-gradient text-white px-5 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#632f9a]/20 transition-all active:scale-[0.98]"
                    >
                        <Plus size={16} /> Nuevo Material
                    </button>
                )}
            </div>

            {/* Confirmation Dialog for Toggle Status */}
            <ConfirmDialog
                isOpen={showConfirmToggle}
                title={articleToToggle?.activo ? '¿Dar de baja este artículo?' : '¿Reactivar este artículo?'}
                message={articleToToggle?.activo
                    ? `El artículo "${articleToToggle?.nombre}" será desactivado y no aparecerá en las operaciones.`
                    : `El artículo "${articleToToggle?.nombre}" será reactivado y volverá a estar disponible.`
                }
                variant={articleToToggle?.activo ? 'danger' : 'info'}
                confirmText={articleToToggle?.activo ? 'Dar de baja' : 'Reactivar'}
                onConfirm={confirmToggle}
                onCancel={() => { setShowConfirmToggle(false); setArticleToToggle(null); }}
            />

            {/* REGULARIZATION MODAL */}
            {showRegModal && selectedForReg && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                <Scale size={18} /> Regularizar Stock: {selectedForReg.sku}
                            </h4>
                            <button onClick={() => setShowRegModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="bg-blue-50 px-6 py-3 text-sm text-blue-800 flex justify-between items-center">
                            <span><strong>Artículo:</strong> {selectedForReg.nombre}</span>
                            <span><strong>Stock Actual:</strong> {selectedForReg.stockActual} {selectedForReg.unidad}</span>
                        </div>

                        <form onSubmit={submitRegularization} className="p-6 space-y-6">
                            <div className="flex border-b border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setRegType('adjustment')}
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 ${regType === 'adjustment' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Ajuste Rápido (+/-)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRegType('physical_count')}
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 ${regType === 'physical_count' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Conteo Físico (Inventario)
                                </button>
                            </div>

                            {regType === 'adjustment' ? (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-500">Utiliza esta opción para roturas, mermas o pequeños ajustes sin recontar todo.</p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Cantidad a Ajustar (+/-)</label>
                                        <input required type="number" className="mt-1 block w-full rounded-md border-blue-300 shadow-sm border p-2"
                                            placeholder="Ej: -1 (rotura), +5 (encontrado)"
                                            value={regQty} onChange={e => setRegQty(Number(e.target.value))} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-500">Utiliza esta opción cuando hayas contado todo el stock físico real.</p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Cantidad Real Total</label>
                                        <input required type="number" min="0" className="mt-1 block w-full rounded-md border-blue-300 shadow-sm border p-2"
                                            placeholder="Ej: 470"
                                            value={regQty} onChange={e => setRegQty(Number(e.target.value))} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Motivo del Ajuste</label>
                                <input required type="text" placeholder="Ej: Rotura en almacén, Inventario anual..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                    value={regReason} onChange={e => setRegReason(e.target.value)} />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowRegModal(false)} className="text-gray-600 hover:text-gray-800 px-4 py-2">Cancelar</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
                                    Confirmar {regType === 'adjustment' ? 'Ajuste' : 'Conteo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FORM MODAL (Create/Edit) */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h4 className="text-lg font-medium text-gray-900">
                                {isEditMode ? 'Editar Material' : 'Alta de Nuevo Material'}
                            </h4>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre del Material</label>
                                    <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}>
                                        <option value="Nuevo">Nuevo</option>
                                        <option value="Usado">Usado</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">SKU (Código Único)</label>
                                <div className="flex gap-2">
                                    <input
                                        required
                                        type="text"
                                        readOnly={isEditMode}
                                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 ${isEditMode ? 'bg-gray-100 text-gray-500' : ''}`}
                                        value={formData.sku || ''}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    />
                                    {!isEditMode && (
                                        <button
                                            type="button"
                                            onClick={handleGenerateSKU}
                                            className="mt-1 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 text-xs font-medium whitespace-nowrap"
                                        >
                                            Generar Auto
                                        </button>
                                    )}
                                </div>
                                {isEditMode && <span className="text-xs text-gray-400">El SKU no se puede modificar.</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                                    <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm"
                                        value={formData.proveedor || ''} onChange={e => setFormData({ ...formData, proveedor: e.target.value })} />
                                </div>
                                {isResponsable && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 text-blue-700 font-bold">Precio de Venta (€)</label>
                                        <input required type="number" step="0.01" min="0" className="mt-1 block w-full rounded-md border-blue-400 shadow-sm border p-2 text-sm font-bold bg-blue-50"
                                            value={formData.precio_venta || ''} onChange={e => setFormData({ ...formData, precio_venta: Number(e.target.value) })} />
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <h5 className="text-sm font-semibold text-gray-900 mb-3">Parámetros de Stock y Servicio</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Stock Inicial (Solo en alta)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            disabled={isEditMode}
                                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 ${isEditMode ? 'bg-gray-100' : ''}`}
                                            value={formData.stock_inicial || 0}
                                            onChange={e => setFormData({ ...formData, stock_inicial: Number(e.target.value) })}
                                        />
                                        {isEditMode && <span className="text-xs text-gray-400">Utilice "Regularizaciones" para ajustar stock.</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Stock Seguridad</label>
                                        <input required type="number" min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                            value={formData.stock_seguridad || ''} onChange={e => setFormData({ ...formData, stock_seguridad: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700">Tiempo de Servido (Días) - Lead Time</label>
                                    <input required type="number" min="0" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.lead_time_dias || ''} onChange={e => setFormData({ ...formData, lead_time_dias: Number(e.target.value) })} />
                                    <p className="text-xs text-gray-500 mt-1">Días que tarda el proveedor en entregar desde el pedido.</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Material</label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <input type="text" placeholder="Pegar URL de imagen..." className="block w-full rounded-md border-gray-300 shadow-sm border p-2 mb-2 text-sm"
                                            value={formData.imagen_url || ''} onChange={e => setFormData({ ...formData, imagen_url: e.target.value })} />
                                        <div className="text-xs text-center text-gray-500">O</div>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                    </div>
                                    {formData.imagen_url && (
                                        <img src={formData.imagen_url} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setShowForm(false)} className="text-gray-600 hover:text-gray-800 px-4 py-2">Cancelar</button>
                                <button type="submit" className="envos-gradient text-white px-6 py-2 rounded-xl hover:opacity-90 font-bold uppercase text-xs tracking-widest shadow-lg shadow-[#632f9a]/10 transition-all">
                                    {isEditMode ? 'Guardar Cambios' : 'Crear Material'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Material</th>
                            <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</th>
                            {isResponsable && <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">P. Venta</th>}
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50/50">Sugerencia</th>
                            <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {inventory.map((item) => (
                            <tr key={item.sku} className={`hover:bg-slate-50 transition-colors ${!item.activo ? 'opacity-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                            {item.imagen_url ? <img src={item.imagen_url} className="h-8 w-8 rounded-lg object-cover" /> : <ImageIcon size={16} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{item.nombre}</div>
                                            <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{item.proveedor}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-sm font-bold text-slate-800">{item.stockActual} <span className="text-[10px] text-slate-400 font-medium">{item.unidad}</span></div>
                                    <div className="text-[10px] text-slate-400">Seg: {item.stock_seguridad}</div>
                                </td>
                                {isResponsable && (
                                    <td className="px-6 py-4 text-right text-sm font-bold text-blue-700">
                                        {item.precio_venta != null ? `${Number(item.precio_venta).toFixed(2)}€` : '-'}
                                    </td>
                                )}
                                <td className="px-6 py-4 text-right bg-blue-50/30">
                                    {item.suggestedOrder > 0 ? (
                                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-sm">Pedir: {item.suggestedOrder}</span>
                                    ) : (
                                        <CheckCircle2 size={16} className="text-green-500 ml-auto" />
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 text-right">
                                        <button onClick={() => openRegularization(item)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Regularizar Inventario"><Scale size={16} /></button>
                                        {isResponsable && (
                                            <>
                                                <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar Material"><Pencil size={16} /></button>
                                                <button onClick={() => handleToggleClick(item)} className={`p-2 rounded-lg transition-colors ${item.activo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} title={item.activo ? 'Desactivar' : 'Activar'}>
                                                    {item.activo ? <Trash2 size={16} /> : <RefreshCw size={16} />}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
