import React, { useState } from 'react';
import { LayoutDashboard, AlertCircle, TrendingUp, Package, Calculator } from 'lucide-react';
import { InventoryItem, ArticleStatus } from '../../types';

interface DashboardViewProps {
    inventory: InventoryItem[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ inventory }) => {
    const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'ALL'>('ALL');

    const filteredInventory = statusFilter === 'ALL'
        ? inventory
        : inventory.filter(i => i.situacion === statusFilter);

    const stats = {
        critical: inventory.filter(i => i.situacion === 'CRÍTICO' || i.situacion === 'Sin stock').length,
        toOrder: inventory.filter(i => i.situacion === 'Pedir a proveedor').length,
        healthy: inventory.filter(i => i.situacion === 'Con stock').length,
        total: inventory.length
    };

    const KPICard = ({ label, count, icon: Icon, color, status, active }: any) => (
        <button
            onClick={() => setStatusFilter(status)}
            className={`relative overflow-hidden p-5 rounded-xl border transition-all duration-200 text-left group ${active === status
                    ? 'bg-white border-obramat-blue ring-1 ring-obramat-blue shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${color.iconBg} ${color.text}`}>
                    <Icon size={20} />
                </div>
                {active === status && (
                    <span className="text-[9px] font-bold text-obramat-blue uppercase tracking-widest">Filtrado</span>
                )}
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-800 leading-none mb-1">{count}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
        </button>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Panel Principal</h3>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">Visión general del inventario operativo</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Crítico"
                    count={stats.critical}
                    icon={AlertCircle}
                    status="CRÍTICO"
                    active={statusFilter}
                    color={{ iconBg: 'bg-red-50', text: 'text-red-600' }}
                />
                <KPICard
                    label="Para Pedir"
                    count={stats.toOrder}
                    icon={Calculator}
                    status="Pedir a proveedor"
                    active={statusFilter}
                    color={{ iconBg: 'bg-amber-50', text: 'text-amber-600' }}
                />
                <KPICard
                    label="En Stock"
                    count={stats.healthy}
                    icon={Package}
                    status="Con stock"
                    active={statusFilter}
                    color={{ iconBg: 'bg-green-50', text: 'text-green-600' }}
                />
                <KPICard
                    label="Referencias"
                    count={stats.total}
                    icon={LayoutDashboard}
                    status="ALL"
                    active={statusFilter}
                    color={{ iconBg: 'bg-blue-50', text: 'text-obramat-blue' }}
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Listado de Materiales</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referencia</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consumo/Sem</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Actual</th>
                                <th className="px-6 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInventory.map((item) => (
                                <tr key={item.sku} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            {item.imagen_url ? (
                                                <img src={item.imagen_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                                            ) : (
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                    <Package size={14} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-semibold text-slate-700">{item.nombre}</div>
                                                <div className="text-[10px] font-medium text-slate-400">{item.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="text-sm font-medium text-slate-600">{item.avgWeeklyConsumption} <span className="text-[10px] text-slate-400 tracking-normal">{item.unidad}</span></div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="text-sm font-bold text-slate-800">{item.stockActual} <span className="text-[10px] text-slate-400 font-medium">{item.unidad}</span></div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                      ${item.situacion === 'Con stock' ? 'bg-green-50 text-green-600' : ''}
                      ${item.situacion === 'Pedir a proveedor' ? 'bg-amber-50 text-amber-600' : ''}
                      ${item.situacion === 'CRÍTICO' ? 'bg-red-50 text-red-600' : ''}
                      ${item.situacion === 'Sin stock' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                                            {item.situacion}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
