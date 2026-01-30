import React, { useState } from 'react';
import {
    LayoutDashboard,
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

export type TabType = 'dashboard' | 'inbound' | 'manual' | 'loads' | 'closing' | 'billing' | 'master' | 'audit';

interface SidebarProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    currentUser: User;
    onLogout: () => void;
    hasLoadAlerts: boolean;
}

const SidebarItem = ({ id, label, icon: Icon, alert, activeTab, onClick }: any) => {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`w-full group relative flex items-center justify-between px-6 py-2.5 text-sm transition-all duration-200 ${isActive
                    ? 'text-white bg-white/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} className={`transition-colors duration-200 ${isActive ? 'text-obramat-orange' : 'group-hover:text-slate-300'}`} />
                <span className={isActive ? 'font-semibold' : 'font-medium'}>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {alert && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>}
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
    return (
        <aside className="w-64 glass-sidebar flex-shrink-0 flex flex-col z-20 shadow-lg">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-obramat-orange rounded-lg flex items-center justify-center text-white">
                        <PackagePlus size={18} />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg tracking-tight leading-none">ENVOS</h1>
                        <p className="text-slate-400 font-medium text-[9px] uppercase tracking-wider mt-0.5">Gestión de Stock</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto">
                <div className="px-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-30">Operaciones</div>
                <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="loads" label="Cargas Operativas" icon={Truck} alert={hasLoadAlerts} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="inbound" label="Entradas / Devoluciones" icon={PackagePlus} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="manual" label="Consumos Manuales" icon={ClipboardList} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="audit" label="Movimientos" icon={History} activeTab={activeTab} onClick={setActiveTab} />

                <div className="px-6 mt-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-30">Admin</div>
                <SidebarItem id="master" label="Maestro" icon={Settings} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="closing" label="Cierre Mes" icon={Lock} activeTab={activeTab} onClick={setActiveTab} />
                <SidebarItem id="billing" label="Facturación" icon={FileText} activeTab={activeTab} onClick={setActiveTab} />
            </nav>

            <div className="p-4">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
                            {currentUser.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate leading-none mb-1">{currentUser.name}</p>
                            <button onClick={onLogout} className="text-[10px] text-slate-500 hover:text-red-400 uppercase font-bold transition-colors tracking-widest leading-none">Cerrar Sesión</button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
