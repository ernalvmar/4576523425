import React, { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import { Article, InboundMovement, ManualConsumption, OperationalLoad, StockAdjustment } from '../../types';

interface MovementHistoryViewProps {
    articles: Article[];
    inbounds: InboundMovement[];
    manualConsumptions: ManualConsumption[];
    loads: OperationalLoad[];
    adjustments: StockAdjustment[];
}

export const MovementHistoryView: React.FC<MovementHistoryViewProps> = ({
    articles,
    inbounds,
    manualConsumptions,
    loads,
    adjustments
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const history = useMemo(() => {
        const all: any[] = [];

        inbounds.forEach((i) => {
            let detail = i.proveedor ? `Prov: ${i.proveedor}` : 'N/A';
            if (i.type === 'Logística Inversa') {
                detail = `Cont: ${i.contenedor || '-'} | Prec: ${i.precinto || '-'}`;
            }
            all.push({
                date: i.date, type: i.type, user: i.user, sku: i.sku, qty: i.quantity, detail: detail
            });
        });

        manualConsumptions.forEach((m) => all.push({
            date: m.date, type: 'Salida Manual', user: m.user, sku: m.sku, qty: -m.quantity, detail: m.reason
        }));

        adjustments.forEach((a) => all.push({
            date: a.date, type: a.type === 'physical_count' ? 'Regularización (Conteo)' : 'Regularización (Ajuste)', user: a.user, sku: a.sku, qty: a.delta, detail: a.reason
        }));

        loads.forEach((l) => {
            Object.entries(l.consumptions).forEach(([sku, qty]) => {
                if ((qty as number) > 0) {
                    all.push({
                        date: l.date, type: 'Carga Op.', user: 'System (Sync)', sku: sku, qty: -(qty as number), detail: `Ref: ${l.ref_carga}`
                    });
                }
            });
        });

        return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [inbounds, manualConsumptions, loads, adjustments]);

    const filtered = history.filter(item => {
        const matchesSearch = item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.user.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'ALL' || item.type.includes(typeFilter);
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <History size={20} className="text-gray-500" />
                    Auditoría de Movimientos
                </h3>
                <div className="flex gap-2">
                    <select
                        className="border border-gray-300 rounded-md p-2 text-sm"
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                    >
                        <option value="ALL">Todos los Tipos</option>
                        <option value="Compra">Compras</option>
                        <option value="Logística Inversa">Log. Inversa</option>
                        <option value="Carga Op.">Cargas Operativas</option>
                        <option value="Salida Manual">Salidas Manuales</option>
                        <option value="Regularización">Regularizaciones</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Buscar SKU o Usuario..."
                        className="border border-gray-300 rounded-md p-2 text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artículo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle / Motivo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {filtered.map((row, idx) => {
                            const articleName = articles.find(a => a.sku === row.sku)?.nombre || row.sku;
                            const qty = Number(row.qty) || 0;
                            return (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.date || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                      ${row.type === 'Compra' ? 'bg-green-100 text-green-800' : ''}
                      ${row.type === 'Logística Inversa' ? 'bg-teal-100 text-teal-800' : ''}
                      ${row.type === 'Carga Op.' ? 'bg-blue-100 text-blue-800' : ''}
                      ${row.type === 'Salida Manual' ? 'bg-orange-100 text-orange-800' : ''}
                      ${row.type?.includes('Regularización') ? 'bg-purple-100 text-purple-800' : ''}
                    `}>
                                            {row.type || 'Movimiento'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{articleName}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {qty > 0 ? '+' : ''}{qty}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.detail || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{row.user || 'Sistema'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
