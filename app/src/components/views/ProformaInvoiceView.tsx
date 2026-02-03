import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Download, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ProformaItem {
    id: string;
    description: string;
    quantity: number;
    price: number;
}

interface ProformaData {
    invoiceNumber: string;
    date: string;
    expenseNumber: string;
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
        weight: '',
        pallets: '',
        packages: '',
        rolls: '',
        merchandiseValue: '0',
        freightInsurance: '1',
        items: [{ id: Math.random().toString(36).substr(2, 9), description: '', quantity: 0, price: 0 }]
    });

    // Auto-generate invoice number if date changes
    useEffect(() => {
        const date = new Date(formData.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        // For sequence, normally we'd fetch from DB, but user said "manually introducing"
        // Let's suggest 01 if not set
        if (!formData.invoiceNumber || formData.invoiceNumber.length < 6) {
            setFormData(prev => ({ ...prev, invoiceNumber: `${day}${month}01` }));
        }
    }, [formData.date]);

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 0, price: 0 }]
        }));
    };

    const handleRemoveItem = (id: string) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const handleItemChange = (id: string, field: keyof ProformaItem, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
        }));
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(10);
        doc.text('FACTURA PROFORMA', 105, 10, { align: 'center' });

        // Origin Section
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Origen', 10, 20);
        doc.setFont('helvetica', 'normal');
        doc.text('Bricolaje Bricoman SLU', 40, 20);
        doc.text('C/Margarita Salas, Nº6 (Parque Tecnologico Leganes)', 10, 25);
        doc.text('28919 Madrid', 10, 30);
        doc.text('España', 10, 35);
        doc.text('Tlfno: 982853000 Fax:', 10, 40);
        doc.text('NIF: ESB84406289', 10, 45);

        // Destination Section
        doc.setFont('helvetica', 'bold');
        doc.text('Destino', 110, 20);
        doc.setFont('helvetica', 'normal');
        doc.text('Bricolaje Bricoman SLU', 140, 20);
        doc.text('CC El Mirador, Autovia GC-1', 110, 25);
        doc.text('35220 Las Palmas de Gran Canaria', 110, 30);
        doc.text('España', 110, 35);
        doc.text('Tlfno: 982853000 Fax:', 110, 40);
        doc.text('NIF: ESB84406289', 110, 45);

        // Date and Invoice No
        const formattedDate = formData.date.split('-').reverse().join('/');
        doc.text(`Fecha: ${formattedDate}`, 10, 55);
        doc.text(`Nº Fact.: ${formData.invoiceNumber}`, 10, 60);
        doc.text(`Gasto: ${formData.expenseNumber}`, 110, 55);

        // Logistics Table
        (doc as any).autoTable({
            startY: 70,
            head: [['Palets', 'Bultos', 'Rollos', 'Peso (Kgs)', 'Valor Mercancía', 'Flete y Seguro', 'Total Importe']],
            body: [[
                formData.pallets,
                formData.packages,
                formData.rolls,
                formData.weight,
                formData.merchandiseValue + ' €',
                formData.freightInsurance + ' €',
                (parseFloat(formData.merchandiseValue || '0') + parseFloat(formData.freightInsurance || '0')).toFixed(2) + ' €'
            ]],
            theme: 'grid',
            headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
            styles: { fontSize: 8 }
        });

        // Items Table
        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Articulo', 'Designación', 'Cantidad', 'Precio', 'Total Neto']],
            body: formData.items.map((item, index) => [
                index + 1,
                item.description,
                item.quantity,
                item.price.toFixed(2) + ' €',
                (item.quantity * item.price).toFixed(2) + ' €'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
            styles: { fontSize: 8 }
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL FACTURA: ${calculateTotal().toFixed(2)} €`, 190, finalY + 10, { align: 'right' });

        doc.save(`Proforma_${formData.invoiceNumber}.pdf`);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Emisión de Proformas</h3>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">Generación manual de facturas proforma para despacho</p>
                </div>
                <button
                    onClick={generatePDF}
                    className="flex items-center gap-2 bg-[#632f9a] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#4a2273] transition-all shadow-lg"
                >
                    <Download size={16} /> Generar PDF
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* General Info */}
                <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Información General</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha Despacho</label>
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
                                placeholder="DDMMNN"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nº Gasto (Albarán)</label>
                            <input
                                type="text"
                                value={formData.expenseNumber}
                                onChange={(e) => setFormData({ ...formData, expenseNumber: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Peso Total (Kgs)</label>
                            <input
                                type="number"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Logistics Details */}
                <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detalles Logísticos y Valores</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Rollos</label>
                            <input
                                type="text"
                                value={formData.rolls}
                                onChange={(e) => setFormData({ ...formData, rolls: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Valor Mercancía (€)</label>
                            <input
                                type="number"
                                value={formData.merchandiseValue}
                                onChange={(e) => setFormData({ ...formData, merchandiseValue: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Flete y Seguro (€)</label>
                            <input
                                type="number"
                                value={formData.freightInsurance}
                                onChange={(e) => setFormData({ ...formData, freightInsurance: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-[#632f9a] focus:ring-1 focus:ring-[#632f9a] outline-none transition-all text-sm font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Articles Table */}
                <div className="md:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Desglose de Artículos</h4>
                        <button
                            onClick={handleAddItem}
                            className="bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700 transition-colors"
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
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-2">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                placeholder="Ej: Cantoneras Reutilizadas"
                                                className="w-full px-3 py-1.5 rounded-lg border border-transparent focus:border-[#632f9a]/30 focus:bg-white outline-none text-sm bg-slate-50/50"
                                            />
                                        </td>
                                        <td className="px-6 py-2">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-1.5 rounded-lg border border-transparent focus:border-[#632f9a]/30 focus:bg-white outline-none text-sm bg-slate-50/50"
                                            />
                                        </td>
                                        <td className="px-6 py-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.price}
                                                onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-1.5 rounded-lg border border-transparent focus:border-[#632f9a]/30 focus:bg-white outline-none text-sm bg-slate-50/50"
                                            />
                                        </td>
                                        <td className="px-6 py-2 text-sm font-bold text-slate-700">
                                            {(item.quantity * item.price).toFixed(2)} €
                                        </td>
                                        <td className="px-6 py-2">
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50/50 font-bold">
                                    <td colSpan={3} className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-slate-400">Total Neto</td>
                                    <td className="px-6 py-4 text-lg text-[#632f9a]">{calculateTotal().toFixed(2)} €</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
