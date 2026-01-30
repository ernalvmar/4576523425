import React from 'react';
import { TabType } from './Sidebar';
import { formatMonth } from '../../utils/helpers';
import { Calendar, ShieldCheck, ShieldAlert } from 'lucide-react';

interface HeaderProps {
    activeTab: TabType;
    currentMonth: string;
    isMonthOpen: boolean;
}

const TAB_TITLES: Record<TabType, string> = {
    dashboard: 'Panel de Control',
    master: 'Maestro de Materiales',
    loads: 'Cargas Operativas',
    inbound: 'Entradas y Devoluciones',
    manual: 'Consumos Manuales',
    closings: 'Cierre de Periodo',
    billing: 'Gestión de Facturación',
    history: 'Operaciones'
};

export const Header: React.FC<HeaderProps> = ({ activeTab, currentMonth, isMonthOpen }) => {
    return (
        <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {TAB_TITLES[activeTab]}
                </h2>
                <div className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${isMonthOpen
                    ? 'bg-green-50 border-green-100 text-green-600'
                    : 'bg-red-50 border-red-100 text-red-600'
                    }`}>
                    {isMonthOpen ? 'SISTEMA ABIERTO' : 'SISTEMA CERRADO'}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{formatMonth(currentMonth)}</span>
                </div>
            </div>
        </header>
    );
};
