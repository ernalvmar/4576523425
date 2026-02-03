import React, { useState } from 'react';
import {
    LayoutDashboard,
    Package,
    Truck,
    PackagePlus,
    ClipboardList,
    History,
    Settings,
    Lock,
    FileText,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { User } from '../../types';

export type TabType = 'dashboard' | 'inbound' | 'manual' | 'loads' | 'closings' | 'billing' | 'master' | 'history' | 'reverse' | 'expenses' | 'proforma';

interface SidebarProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    currentUser: User;
    onLogout: () => void;
    hasLoadAlerts: boolean;
}

const SidebarItem = ({ id, label, icon: Icon, alert, activeTab, onClick, restricted }: any) => {
    if (restricted) return null;

    const isActive = activeTab === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`w-full group relative flex items-center justify-between px-6 py-2.5 text-sm transition-all duration-200 ${isActive
                ? 'text-white bg-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} className={`transition-colors duration-200 ${isActive ? 'text-white' : 'group-hover:text-slate-200'}`} />
                <span className={`tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </div>
            {isActive && <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full"></div>}
            <div className="flex items-center gap-2">
                {alert && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>}
            </div>
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab,
    currentUser,
    onLogout,
    hasLoadAlerts
}) => {
    const isResponsable = currentUser.rol === 'responsable';

    return (
        <aside className="w-64 glass-sidebar flex-shrink-0 flex flex-col z-20 shadow-lg">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                        <img src="/logo-2.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-white font-black text-xs tracking-tighter leading-none">ENVOS - OBRAMAT</h1>
                        <p className="text-slate-400 font-bold text-[8px] uppercase tracking-[0.2em] mt-1.5 whitespace-nowrap">Plataforma · SVQ</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto">
                <div className="px-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-30">Operaciones</div>
                <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="loads" label="Cargas Operativas" icon={Truck} alert={hasLoadAlerts} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="inbound" label="Entradas de Compra" icon={PackagePlus} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="reverse" label="Logística Inversa" icon={Package} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="expenses" label="Gastos Generales" icon={ClipboardList} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="manual" label="Consumos Manuales" icon={History} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="history" label="Movimientos" icon={History} activeTab={activeTab} onClick={setActiveTab} />

                <div className="px-6 mt-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-30">Administración</div>
                <SidebarItem id="master" label="Maestro de Materiales" icon={Settings} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="closings" label="Cierre Mes" icon={Lock} activeTab={activeTab} onClick={setActiveTab} restricted={!isResponsable} />
                <SidebarItem id="billing" label="Facturación" icon={FileText} activeTab={activeTab} onClick={setActiveTab} restricted={!isResponsable} />
                <SidebarItem id="proforma" label="Proformas" icon={FileText} activeTab={activeTab} onClick={setActiveTab} />
            </nav>

        </aside>
    );
};
