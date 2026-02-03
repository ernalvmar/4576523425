import React from 'react';
import { TabType } from './Sidebar';
import { formatMonth } from '../../utils/helpers';
import { Calendar, User as UserIcon, LogOut } from 'lucide-react';

interface HeaderProps {
    activeTab: TabType;
    currentMonth: string;
    isMonthOpen: boolean;
    userName: string;
    userRole: string;
    onLogout: () => void;
    version?: string;
}

const TAB_TITLES: Record<TabType, string> = {
    dashboard: 'Panel de Control',
    master: 'Maestro de Materiales',
    loads: 'Cargas Operativas',
    inbound: 'Entradas de Compra',
    reverse: 'Logística Inversa',
    expenses: 'Gastos Generales',
    manual: 'Consumos Manuales',
    closings: 'Cierre de Periodo',
    billing: 'Gestión de Facturación',
    history: 'Operaciones'
};

export const Header: React.FC<HeaderProps> = ({
    activeTab,
    currentMonth,
    isMonthOpen,
    userName,
    userRole,
    onLogout,
    version
}) => {
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
                {version && (
                    <span className="text-[8px] font-mono text-slate-400 bg-slate-50 px-1 rounded">v{version}</span>
                )}
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{formatMonth(currentMonth)}</span>
                </div>

                <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-none">{userName}</p>
                        <p className="text-[9px] font-bold text-[#632f9a] uppercase tracking-widest mt-0.5">{userRole}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
};
