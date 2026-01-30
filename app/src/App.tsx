import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Types
import {
    User,
    Article,
    InboundMovement,
    ManualConsumption,
    StockAdjustment,
    OperationalLoad,
    MonthClosing,
    InventoryItem,
    ArticleStatus
} from './types';

// Data
import { INITIAL_USERS } from './data/mockData';

// Utils
import { getCurrentMonth, generateId, getToday } from './utils/helpers';

// Components
import { LoginView } from './components/auth/LoginView';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { ArticlesMasterView } from './components/views/ArticlesMasterView';
import { OperationalLoadsView } from './components/views/OperationalLoadsView';
import { InboundForm } from './components/views/InboundForm';
import { ManualConsumptionForm } from './components/views/ManualConsumptionForm';
import { MonthClosingView } from './components/views/MonthClosingView';
import { BillingStagingView } from './components/views/BillingStagingView';
import { MovementHistoryView } from './components/views/MovementHistoryView';
import { Toast, NotificationType } from './components/ui/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log('--- DIAGNÓSTICO DE CONEXIÓN ---');
console.log('API_URL detectada:', API_URL);
console.log('------------------------------');

const App: React.FC = () => {
    // persistent notifications state
    const [notifications, setNotifications] = useState<{ id: string; message: string; type: NotificationType }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const notify = (message: string, type: NotificationType = 'success') => {
        const id = generateId();
        setNotifications(prev => [...prev, { id, message, type }]);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Auth state
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Navigation
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [editingSku, setEditingSku] = useState<string | null>(null);
    const [loadsFilter, setLoadsFilter] = useState<'ALL' | 'DUPLICATES'>('ALL');

    // Remote State (from Neon)
    const [articles, setArticles] = useState<Article[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [loads, setLoads] = useState<OperationalLoad[]>([]);
    const [closings, setClosings] = useState<MonthClosing[]>([]);
    const [billingOverrides, setBillingOverrides] = useState<Record<string, number>>({});

    // Fetch data from API
    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [artRes, movRes, loadRes] = await Promise.all([
                fetch(`${API_URL}/api/articles`).then(res => res.json()),
                fetch(`${API_URL}/api/movements`).then(res => res.json()),
                fetch(`${API_URL}/api/loads`).then(res => res.json())
            ]);

            // Process articles to ensure numbers are numbers (PG returns NUMERIC as string)
            const processedArticles = Array.isArray(artRes) ? artRes.map((a: any) => ({
                ...a,
                stock_inicial: Number(a.stock_inicial) || 0,
                stock_seguridad: Number(a.stock_seguridad) || 0,
                lead_time_dias: Number(a.lead_time_dias) || 0,
                precio_venta: a.precio_venta != null ? Number(a.precio_venta) : undefined,
                ultimo_coste: a.ultimo_coste != null ? Number(a.ultimo_coste) : undefined,
            })) : [];
            setArticles(processedArticles);
            setMovements(Array.isArray(movRes) ? movRes : []);

            // Transform backend loads to frontend format and detect duplicates
            const transformedLoads = Array.isArray(loadRes) ? loadRes.map((l: any, idx: number, self: any[]) => {
                const date = l.fecha ? l.fecha.split('T')[0] : getToday();
                const isDuplicate = self.some((other, i) =>
                    i !== idx &&
                    other.matricula === l.matricula &&
                    (other.fecha ? other.fecha.split('T')[0] : '') === date
                );

                return {
                    load_uid: l.ref_carga,
                    ref_carga: l.ref_carga,
                    precinto: l.matricula,
                    flete: l.equipo,
                    date: date,
                    consumptions: typeof l.consumos_json === 'string' ? JSON.parse(l.consumos_json) : (l.consumos_json || {}),
                    duplicado: isDuplicate,
                    modificada: false,
                    original_fingerprint: ''
                };
            }) : [];
            setLoads(transformedLoads);
        } catch (err) {
            console.error('Fetch error:', err);
            notify('Error al conectar con el servidor.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser]);

    // Computed: Inventory Status
    const inventoryStatus: InventoryItem[] = useMemo(() => {
        return articles.map(art => {
            const artMovements = movements.filter(m => m.sku === art.sku);

            const totalInbound = artMovements
                .filter(m => m.tipo === 'ENTRADA')
                .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);

            const totalOutbound = artMovements
                .filter(m => m.tipo === 'SALIDA')
                .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);

            const stockActual = (Number(art.stock_inicial) || 0) + totalInbound - totalOutbound;

            // Simple status logic
            let situacion: ArticleStatus = 'Con stock';
            if (stockActual <= 0) situacion = 'Sin stock';
            else if (stockActual <= (Number(art.stock_seguridad) || 0)) situacion = 'Pedir a proveedor';

            const last30Days = new Date();
            last30Days.setDate(last30Days.getDate() - 30);
            const recentMovements = artMovements.filter(m => new Date(m.fecha) >= last30Days);
            const totalRecentOut = recentMovements
                .filter(m => m.tipo === 'SALIDA')
                .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);

            const avgWeeklyConsumption = Math.round((totalRecentOut / 30) * 7 * 10) / 10;
            const targetStock = (Number(art.stock_seguridad) || 0) + (avgWeeklyConsumption * (Number(art.lead_time_dias) || 7) / 7);
            const suggestedOrder = stockActual < (Number(art.stock_seguridad) || 0)
                ? Math.max(0, Math.ceil(targetStock - stockActual))
                : 0;

            return {
                ...art,
                stockActual,
                situacion,
                totalInbound,
                totalManualOut: artMovements.filter(m => m.tipo === 'SALIDA' && !m.ref_operacion).reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0),
                totalLoadOut: artMovements.filter(m => m.tipo === 'SALIDA' && m.ref_operacion).reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0),
                avgWeeklyConsumption,
                suggestedOrder,
                targetStock
            };
        });
    }, [articles, movements]);

    // Actions (To be converted to API calls)
    const handleSaveArticle = async (article: Article, isEdit: boolean) => {
        try {
            const res = await fetch(`${API_URL}/api/articles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(article)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al guardar');

            notify(`Material ${data.nombre} guardado correctamente.`);
            fetchData(); // Sincronizar con el servidor
        } catch (e) {
            notify('Error al guardar el artículo.', 'error');
        }
    };

    const handleSaveInbound = async (data: any) => {
        try {
            const movement = {
                sku: data.sku,
                tipo: 'ENTRADA',
                cantidad: data.quantity,
                motivo: `${data.type}: ${data.proveedor || ''} ${data.albaran || ''}`.trim(),
                usuario: currentUser?.name,
                periodo: data.date.slice(0, 7)
            };

            const res = await fetch(`${API_URL}/api/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movement)
            });

            if (!res.ok) throw new Error();

            notify(`Entrada registrada: ${data.quantity} un. de ${data.sku}`);
            fetchData(); // Refresh all state
            setActiveTab('dashboard');
        } catch (e) {
            notify('Error al registrar la entrada.', 'error');
        }
    };

    const handleSaveManualConsumption = async (data: any) => {
        try {
            const movement = {
                sku: data.sku,
                tipo: 'SALIDA',
                cantidad: data.quantity,
                motivo: data.reason,
                usuario: currentUser?.name,
                periodo: data.date.slice(0, 7)
            };

            const res = await fetch(`${API_URL}/api/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movement)
            });

            if (!res.ok) throw new Error();

            notify(`Salida registrada: ${data.quantity} un. de ${data.sku}`);
            fetchData();
            setActiveTab('dashboard');
        } catch (e) {
            notify('Error al registrar el consumo.', 'error');
        }
    };

    const handleRegularize = async (sku: string, qty: number, reason: string, type: 'physical_count' | 'adjustment') => {
        try {
            const art = articles.find(a => a.sku === sku);
            if (!art) return;

            // Calculate delta
            const currentStock = inventoryStatus.find(i => i.sku === sku)?.stockActual || 0;
            const delta = type === 'physical_count' ? qty - currentStock : qty;

            const movement = {
                sku,
                tipo: delta > 0 ? 'ENTRADA' : 'SALIDA',
                cantidad: Math.abs(delta),
                motivo: `Regularización ${type === 'physical_count' ? '(Inventario)' : '(Ajuste)'}: ${reason}`,
                usuario: currentUser?.name,
                periodo: getCurrentMonth()
            };

            const res = await fetch(`${API_URL}/api/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movement)
            });

            if (!res.ok) throw new Error();

            notify(`Ajuste de stock realizado para ${sku}`);
            fetchData();
        } catch (e) {
            notify('Error al regularizar stock.', 'error');
        }
    };

    const handleUpdateBillingOverride = (id: string, qty: number) => {
        setBillingOverrides(prev => ({ ...prev, [id]: qty }));
    };

    if (!currentUser) {
        return <LoginView onLogin={setCurrentUser} />;
    }

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">Cargando datos del inventario...</div>;
    }

    const currentMonth = getCurrentMonth();
    const isMonthOpen = true; // Temporary

    return (
        <div className="flex h-screen bg-gray-100 text-slate-900">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                onLogout={() => setCurrentUser(null)}
                hasLoadAlerts={false}
            />

            <main className="flex-1 overflow-auto">
                <Header
                    activeTab={activeTab}
                    currentMonth={currentMonth}
                    isMonthOpen={isMonthOpen}
                />

                <div className="p-8">
                    {activeTab === 'dashboard' && <DashboardView inventory={inventoryStatus.filter(a => a.activo)} />}

                    {activeTab === 'master' && (
                        <ArticlesMasterView
                            inventory={inventoryStatus}
                            onSave={handleSaveArticle}
                            onRegularize={handleRegularize}
                            onToggleStatus={(sku) => {
                                const art = articles.find(a => a.sku === sku);
                                if (art) handleSaveArticle({ ...art, activo: !art.activo }, true);
                            }}
                            deepLinkSku={editingSku}
                            clearDeepLink={() => setEditingSku(null)}
                            currentUser={currentUser}
                        />
                    )}

                    {activeTab === 'inbound' && (
                        <InboundForm
                            articles={articles.filter(a => a.activo)}
                            onSubmit={handleSaveInbound}
                            notify={notify}
                            isMonthOpen={isMonthOpen}
                            onNavigateMaster={() => setActiveTab('master')}
                        />
                    )}

                    {activeTab === 'loads' && (
                        <OperationalLoadsView
                            articles={articles}
                            loads={loads}
                            filterMode={loadsFilter}
                            setFilterMode={setLoadsFilter}
                            isMonthOpen={isMonthOpen}
                            onArticleClick={(sku) => {
                                setEditingSku(sku);
                                setActiveTab('master');
                            }}
                        />
                    )}

                    {activeTab === 'manual' && (
                        <ManualConsumptionForm
                            articles={inventoryStatus.filter(a => a.activo)}
                            onSubmit={handleSaveManualConsumption}
                            notify={notify}
                            isMonthOpen={isMonthOpen}
                        />
                    )}

                    {activeTab === 'history' && (
                        <MovementHistoryView
                            articles={articles}
                            inbounds={movements.filter(m => m.tipo === 'ENTRADA' && !m.motivo.includes('Regularización'))}
                            manualConsumptions={movements.filter(m => m.tipo === 'SALIDA' && !m.ref_operacion && !m.motivo.includes('Regularización'))}
                            loads={loads}
                            adjustments={movements.filter(m => m.motivo.includes('Regularización'))}
                        />
                    )}

                    {activeTab === 'billing' && (
                        <BillingStagingView
                            loads={loads}
                            currentMonth={currentMonth}
                            articles={articles}
                            closings={closings}
                            billingOverrides={billingOverrides}
                            onUpdateOverride={handleUpdateBillingOverride}
                            notify={notify}
                            currentUser={currentUser}
                        />
                    )}

                    {activeTab === 'closings' && (
                        <MonthClosingView
                            currentMonth={currentMonth}
                            loads={loads}
                            isMonthOpen={isMonthOpen}
                            setClosings={setClosings}
                            onJumpToDuplicates={() => {
                                setLoadsFilter('DUPLICATES');
                                setActiveTab('loads');
                            }}
                        />
                    )}
                </div>
                <Toast notifications={notifications} removeNotification={removeNotification} />
            </main>
        </div>
    );
};

// Mount the app
const root = createRoot(document.getElementById('root')!);
root.render(<App />);

export default App;
