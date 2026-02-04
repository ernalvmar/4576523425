import React, { useState, useEffect } from 'react';
import {
    Download,
    History as HistoryIcon,
    Search,
    Eye,
    Plus,
    Trash2,
    FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProformaRecord } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ProformaItem {
    id: string;
    description: string;
    quantity: number;
    price: string;
}

interface ProformaData {
    invoiceNumber: string;
    date: string;
    expenseNumber: string;
    provider: string;
    containerNumber: string;
    sealNumber: string;
    weight: string;
    pallets: string;
    packages: string;
    rolls: string;
    merchandiseValue: string;
    freightInsurance: string;
    items: ProformaItem[];
}

export const ProformaInvoiceView: React.FC = () => {
    const [formData, setFormData] = useState<ProformaData>({
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        expenseNumber: '',
        provider: '',
        containerNumber: '',
        sealNumber: '',
        weight: '',
        pallets: '',
        packages: '',
        rolls: '',
        merchandiseValue: '0',
        freightInsurance: '1',
        items: [{ id: Math.random().toString(36).substr(2, 9), description: '', quantity: 0, price: '0' }]
    });

    const [history, setHistory] = useState<ProformaRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/api/proformas`);
            const data = await res.json();
            if (Array.isArray(data)) setHistory(data);
        } catch (e) {
            console.error('Error fetching history:', e);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        const date = new Date(formData.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        if (!formData.invoiceNumber || formData.invoiceNumber.length < 6) {
            setFormData(prev => ({ ...prev, invoiceNumber: `${day}${month}01` }));
        }
    }, [formData.date]);

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 0, price: '0' }]
        }));
    };

    const handleRemoveItem = (id: string) => {
        if (formData.items.length === 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const handleItemChange = (id: string, field: keyof ProformaItem, value: any) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
        }));
    };

    const handleKeyPress = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const index = formData.items.findIndex(i => i.id === id);
            if (index === formData.items.length - 1) {
                handleAddItem();
                setTimeout(() => {
                    const inputs = document.querySelectorAll('.item-description-input');
                    (inputs[inputs.length - 1] as HTMLInputElement)?.focus();
                }, 50);
            }
        }
    };

    const calculateTotal = (items: any[]) => {
        return items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.price || '0')), 0);
    };

    const saveAndGenerate = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/proformas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoice_number: formData.invoiceNumber,
                    date: formData.date,
                    expense_number: formData.expenseNumber,
                    provider: formData.provider,
                    container_number: formData.containerNumber,
                    seal_number: formData.sealNumber,
                    weight: parseFloat(formData.weight) || 0,
                    pallets: formData.pallets,
                    packages: formData.packages,
                    rolls: formData.rolls,
                    merchandise_value: parseFloat(formData.merchandiseValue) || 0,
                    freight_insurance: parseFloat(formData.freightInsurance) || 0,
                    items: formData.items
                })
            });

            if (!res.ok) throw new Error('Error saving proforma');

            fetchHistory();
            generatePDFFromData(formData);

        } catch (e) {
            console.error(e);
            alert('Error al guardar la factura proforma.');
        } finally {
            setIsLoading(false);
        }
    };

    const generatePDFFromData = (data: any) => {
        try {
            const doc = new jsPDF();

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('FACTURA PROFORMA', 105, 15, { align: 'center' });

            doc.setDrawColor(200);
            doc.rect(10, 20, 95, 35);
            doc.rect(105, 20, 95, 35);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Origen:', 12, 25);
            doc.setFont('helvetica', 'normal');
            doc.text('Bricolaje Bricoman SLU', 40, 25);
            doc.text('C/Margarita Salas, Nº6 (Parque Tecnologico Leganes)', 12, 30);
            doc.text('28919 Madrid', 12, 35);
            doc.text('España', 12, 40);
            doc.text('Tlfno: 982853000 Fax:', 12, 45);
            doc.text('NIF: ESB84406289', 12, 50);

            doc.setFont('helvetica', 'bold');
            doc.text('Destino:', 107, 25);
            doc.setFont('helvetica', 'normal');
            doc.text('Bricolaje Bricoman SLU', 140, 25);
            doc.text('CC El Mirador, Autovia GC-1', 107, 30);
            doc.text('35220 Las Palmas de Gran Canaria', 107, 35);
            doc.text('España', 107, 40);
            doc.text('Tlfno: 982853000 Fax:', 107, 45);
            doc.text('NIF: ESB84406289', 107, 50);

            doc.setFont('helvetica', 'bold');
            doc.text('Fecha:', 10, 65);
            doc.setFont('helvetica', 'normal');
            const dateStr = data.date ? data.date.split('T')[0].split('-').reverse().join('/') : '';
            doc.text(dateStr, 25, 65);

            doc.setFont('helvetica', 'bold');
            doc.text('Nº Fact.:', 10, 70);
            doc.setFont('helvetica', 'normal');
            doc.text((data.invoiceNumber || data.invoice_number) || '', 25, 70);

            doc.setFont('helvetica', 'bold');
            doc.text('Proveedor:', 70, 65);
            doc.setFont('helvetica', 'normal');
            doc.text(data.provider || '', 90, 65);

            doc.setFont('helvetica', 'bold');
            doc.text('Contenedor:', 70, 70);
            doc.setFont('helvetica', 'normal');
            doc.text((data.containerNumber || data.container_number) || '', 90, 70);

            doc.setFont('helvetica', 'bold');
            doc.text('Gasto:', 140, 65);
            doc.setFont('helvetica', 'normal');
            doc.text((data.expenseNumber || data.expense_number) || '', 155, 65);

            doc.setFont('helvetica', 'bold');
            doc.text('Precinto:', 140, 70);
            doc.setFont('helvetica', 'normal');
            doc.text((data.sealNumber || data.seal_number) || '', 155, 70);

            const items = data.items || data.items_json;
            const merchValue = parseFloat(data.merchandiseValue || data.merchandise_value || '0');
            const freight = parseFloat(data.freightInsurance || data.freight_insurance || '0');

            autoTable(doc, {
                startY: 75,
                head: [['Palets', 'Bultos', 'Rollos', 'Peso (Kgs)', 'Valor Mercancía', 'Flete y Seguro', 'Total Importe']],
                body: [[
                    data.pallets || '',
                    data.packages || '',
                    data.rolls || '',
                    data.weight || '',
                    merchValue.toFixed(2) + ' €',
                    freight.toFixed(2) + ' €',
                    (merchValue + freight).toFixed(2) + ' €'
                ]],
                theme: 'grid',
                headStyles: { fillColor: [80, 80, 80], fontSize: 8 },
                styles: { fontSize: 8, halign: 'center' }
            });

            const lastY = (doc as any).lastAutoTable.finalY || 75;

            autoTable(doc, {
                startY: lastY + 10,
                head: [['Articulo', 'Designación', 'Cantidad', 'Precio', 'Total Neto']],
                body: items.map((item: any, index: number) => [
                    index + 1,
                    item.description,
                    item.quantity,
                    parseFloat(item.price).toFixed(2) + ' €',
                    (item.quantity * parseFloat(item.price)).toFixed(2) + ' €'
                ]),
                theme: 'grid',
                headStyles: { fillColor: [80, 80, 80], fontSize: 8 },
                styles: { fontSize: 8 }
            });

            const finalY = (doc as any).lastAutoTable.finalY;
            doc.setFont('helvetica', 'bold');
            const total = items.reduce((sum: number, item: any) => sum + (item.quantity * parseFloat(item.price)), 0);
            doc.text(`TOTAL FACTURA: ${total.toFixed(2)} €`, 190, finalY + 10, { align: 'right' });

            doc.save(`Proforma_${data.invoiceNumber || data.invoice_number}.pdf`);
        } catch (err) {
            console.error('PDF Generation error:', err);
            alert('Error al generar el PDF. Revisa la consola para más detalles.');
        }
    };

    const loadFromHistory = (record: ProformaRecord) => {
        setFormData({
            invoiceNumber: record.invoice_number,
            date: record.date.split('T')[0],
            expenseNumber: record.expense_number,
            provider: record.provider,
            containerNumber: record.container_number || '',
            sealNumber: record.seal_number || '',
            weight: record.weight.toString(),
            pallets: record.pallets,
            packages: record.packages,
            rolls: record.rolls,
            merchandiseValue: record.merchandise_value.toString(),
            freightInsurance: record.freight_insurance.toString(),
            items: record.items_json
        });
        setShowHistory(false);
    };

    const filteredHistory = history.filter(h =>
        h.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.container_number && h.container_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <style>
                {`
                    input.no-arrows::-webkit-outer-spin-button,
                    input.no-arrows::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input.no-arrows {
                        -moz-appearance: textfield;
                    }
                `}
            </style>

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Emisión de Proformas</h3>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">Generación manual de facturas proforma para despacho</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${showHistory ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                    >
                        <HistoryIcon size={16} /> {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
                    </button>
                    <button
                        onClick={saveAndGenerate}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-[#632f9a] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#4a2273] transition-all shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download size={16} />}
                        Guardar y PDF
                    </button>
                </div>
            </div>

            {showHistory ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Proformas</h4>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#632f9a]"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Factura</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Proveedor</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase">Contenedor</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Total</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.map(record => {
                                    const total = calculateTotal(record.items_json);
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 text-sm font-bold text-slate-700">{record.invoice_number}</td>
                                            <td className="px-6 py-3 text-sm text-slate-500">{new Date(record.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-3 text-sm text-slate-600 font-medium">{record.provider}</td>
                                            <td className="px-6 py-3 text-sm text-slate-500">{record.container_number}</td>
                                            <td className="px-6 py-3 text-sm font-bold text-[#632f9a] text-right">{total.toFixed(2)} €</td>
                                            <td className="px-6 py-3 flex justify-end gap-2">
                                                <button onClick={() => loadFromHistory(record)} className="p-2 text-slate-400 hover:text-[#632f9a] transition-colors" title="Cargar">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => generatePDFFromData(record)} className="p-2 text-slate-400 hover:text-[#632f9a] transition-colors" title="Descargar PDF">
                                                    <Download size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Información del Despacho</h4>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha Carga</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nº Factura</label>
                                <input
                                    type="text"
                                    value={formData.invoiceNumber}
                                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium font-mono"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Proveedor</label>
                                <input
                                    type="text"
                                    placeholder="Nombre del proveedor"
                                    value={formData.provider}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Contenedor</label>
                                <input
                                    type="text"
                                    placeholder="Nº Contenedor"
                                    value={formData.containerNumber}
                                    onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Precinto</label>
                                <input
                                    type="text"
                                    placeholder="Nº Precinto"
                                    value={formData.sealNumber}
                                    onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Nº Gasto</label>
                                <input
                                    type="text"
                                    value={formData.expenseNumber}
                                    onChange={(e) => setFormData({ ...formData, expenseNumber: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Peso (Kgs)</label>
                                <input
                                    type="number"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium no-arrows"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Palets</label>
                                <input
                                    type="text"
                                    value={formData.pallets}
                                    onChange={(e) => setFormData({ ...formData, pallets: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Bultos</label>
                                <input
                                    type="text"
                                    value={formData.packages}
                                    onChange={(e) => setFormData({ ...formData, packages: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor (€)</label>
                                <input
                                    type="number"
                                    value={formData.merchandiseValue}
                                    onChange={(e) => setFormData({ ...formData, merchandiseValue: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium no-arrows"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Flete (€)</label>
                                <input
                                    type="number"
                                    value={formData.freightInsurance}
                                    onChange={(e) => setFormData({ ...formData, freightInsurance: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium no-arrows"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Desglose de Artículos</h4>
                            <button
                                onClick={handleAddItem}
                                className="bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/20">
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Designación</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">Cantidad</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">Precio (€)</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">Total</th>
                                        <th className="px-6 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {formData.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 group transition-colors">
                                            <td className="px-6 py-2">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                    placeholder="Ej: Cantoneras Reutilizadas"
                                                    className="item-description-input w-full px-3 py-1.5 rounded-lg border border-transparent focus:border-[#632f9a]/30 focus:bg-white outline-none text-sm bg-slate-50/50 transition-all font-medium"
                                                />
                                            </td>
                                            <td className="px-6 py-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity || ''}
                                                    onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-transparent focus:border-[#632f9a]/30 focus:bg-white outline-none text-sm bg-slate-50/50 no-arrows"
                                                />
                                            </td>
                                            <td className="px-6 py-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.price}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
                                                            handleItemChange(item.id, 'price', val.substring(1));
                                                        } else {
                                                            handleItemChange(item.id, 'price', val);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => handleKeyPress(e, item.id)}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-transparent focus:border-[#632f9a]/30 focus:bg-white outline-none text-sm bg-slate-50/50 no-arrows font-bold text-slate-700 font-mono"
                                                />
                                            </td>
                                            <td className="px-6 py-2 text-sm font-bold text-slate-600">
                                                {(item.quantity * parseFloat(item.price || '0')).toFixed(2)} €
                                            </td>
                                            <td className="px-6 py-2 text-right">
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 pr-2"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50/50 font-bold border-t border-slate-100">
                                        <td colSpan={3} className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-slate-400">Total Importe Neto Factura</td>
                                        <td className="px-6 py-4 text-xl text-[#632f9a] font-black italic">{(calculateTotal(formData.items)).toFixed(2)} €</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
