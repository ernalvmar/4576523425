import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Truck } from 'lucide-react';
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
import { getCurrentMonth, generateId, getToday, formatMonth } from './utils/helpers';

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
import { ReverseLogisticsView } from './components/views/ReverseLogisticsView';
import { GeneralExpensesView } from './components/views/GeneralExpensesView';
import { PalletsConsumptionForm } from './components/views/PalletsConsumptionForm';
import { Toast, NotificationType } from './components/ui/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
console.log('--- DIAGNÓSTICO DE CONEXIÓN ---');
console.log('API_URL detectada:', API_URL);
console.log('------------------------------');

const CURRENT_VERSION = '1.0.2 - AntiFlash';

const App: React.FC = () => {
    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

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
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('obramat_user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('Error parsing user from localStorage', e);
            return null;
        }
    });

    const handleLogin = (user: User) => {
        localStorage.setItem('obramat_user', JSON.stringify(user));
        setCurrentUser(user);
    };

    const handleLogout = () => {
        localStorage.removeItem('obramat_user');
        setCurrentUser(null);
    };

    // Navigation
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [editingSku, setEditingSku] = useState<string | null>(null);
    const [loadsFilter, setLoadsFilter] = useState<'ALL' | 'DUPLICATES' | 'ADR_PENDING'>('ALL');
    const [manualMode, setManualMode] = useState<'GENERAL' | 'PALLETS'>('GENERAL');

    // Remote State (from Neon)
    const [articles, setArticles] = useState<Article[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [loads, setLoads] = useState<OperationalLoad[]>([]);
    const [closings, setClosings] = useState<MonthClosing[]>([]);
    const [billingOverrides, setBillingOverrides] = useState<Record<string, number>>({});
    const [generalExpenses, setGeneralExpenses] = useState<any[]>([]);
    const [storageEntries, setStorageEntries] = useState<any[]>([]);
    const [obramatProviders, setObramatProviders] = useState<string[]>([]);
    const [palletConsumptions, setPalletConsumptions] = useState<any[]>([]);

    // Fetch data from API
    const fetchData = async (background = false) => {
        try {
            // Only show loader on first absolute load (articles is empty)
            if (!background && articles.length === 0) setIsLoading(true);
            const [artRes, movRes, loadRes, closeRes, expRes, storeRes, provRes, palRes] = await Promise.all([
                fetch(`${API_URL}/api/articles`).then(res => res.json()),
                fetch(`${API_URL}/api/movements`).then(res => res.json()),
                fetch(`${API_URL}/api/loads`).then(res => res.json()),
                fetch(`${API_URL}/api/closings`).then(res => res.json()),
                fetch(`${API_URL}/api/general-expenses`).then(res => res.json()),
                fetch(`${API_URL}/api/storage`).then(res => res.json()),
                fetch(`${API_URL}/api/obramat-providers`).then(res => res.json()),
                fetch(`${API_URL}/api/pallet-consumptions`).then(res => res.json())
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

            // Format movements safely and map to frontend keys
            const processedMovements = Array.isArray(movRes) ? movRes.map((m: any) => {
                let dateStr = getToday();
                try {
                    if (m.fecha) {
                        if (typeof m.fecha === 'string') {
                            dateStr = m.fecha.split('T')[0].split(' ')[0];
                        } else {
                            dateStr = new Date(m.fecha).toISOString().split('T')[0];
                        }
                    }
                } catch (e) {
                    console.warn('Invalid date in movement:', m.fecha);
                }

                return {
                    id: m.id,
                    sku: m.sku,
                    type: m.tipo,
                    qty: Number(m.cantidad) || 0,
                    quantity: Number(m.cantidad) || 0,
                    detail: m.motivo || '',
                    user: m.usuario || 'Sistema',
                    date: dateStr,
                    periodo: m.periodo,
                    ref_operacion: m.ref_operacion
                };
            }) : [];
            setMovements(processedMovements);

            // Transform backend loads to frontend format and detect duplicates
            const transformedLoads = Array.isArray(loadRes) ? loadRes.map((l: any, idx: number, self: any[]) => {
                // Safer date parsing
                let rawDate = l.fecha;
                let dateStr = getToday();
                if (rawDate) {
                    if (typeof rawDate === 'string') {
                        dateStr = rawDate.split('T')[0].split(' ')[0];
                    } else if (rawDate instanceof Date || (typeof rawDate === 'object' && rawDate.toISOString)) {
                        dateStr = new Date(rawDate).toISOString().split('T')[0];
                    }
                }

                const isDuplicate = self.some((other, i) => {
                    if (i === idx) return false;
                    // Mismo camión (matrícula)
                    if (other.matricula !== l.matricula) return false;
                    // Mismo contenedor (equipo)
                    if (other.equipo !== l.equipo) return false;

                    let otherDateStr = '';
                    try {
                        if (other.fecha) {
                            if (typeof other.fecha === 'string') {
                                otherDateStr = other.fecha.split('T')[0].split(' ')[0];
                            } else {
                                otherDateStr = new Date(other.fecha).toISOString().split('T')[0];
                            }
                        }
                    } catch (e) { }
                    return otherDateStr === dateStr;
                });

                return {
                    load_uid: l.ref_carga,
                    ref_carga: l.ref_carga,
                    precinto: l.matricula,
                    flete: l.equipo,
                    date: dateStr,
                    consumptions: typeof l.consumos_json === 'string' ? JSON.parse(l.consumos_json) : (l.consumos_json || {}),
                    duplicado: isDuplicate,
                    modificada: false,
                    original_fingerprint: '',
                    adr_breakdown: typeof l.adr_breakdown_json === 'string' ? JSON.parse(l.adr_breakdown_json) : (l.adr_breakdown_json || {}),
                    periodo: l.periodo
                };
            }) : [];
            setLoads(transformedLoads);

            if (Array.isArray(closeRes)) {
                setClosings(closeRes);
            }

            setGeneralExpenses(Array.isArray(expRes) ? expRes : []);
            setStorageEntries(Array.isArray(storeRes) ? storeRes : []);
            setObramatProviders(Array.isArray(provRes) ? provRes : []);
            setPalletConsumptions(Array.isArray(palRes) ? palRes : []);
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

    useEffect(() => {
        if (currentUser) {
            // Refrescar cada 2 minutos en background
            const interval = setInterval(() => {
                // If the user is NOT editing, we can safely refresh data in silence
                if (!isEditing) {
                    fetchData(true);
                }
            }, 120000);
            return () => clearInterval(interval);
        }
    }, [currentUser, isEditing]);

    // Computed: Inventory Status
    const inventoryStatus: InventoryItem[] = useMemo(() => {
        try {
            if (!Array.isArray(articles)) {
                console.warn('articles is not an array:', articles);
                return [];
            }
            return articles.map(art => {
                try {
                    const artMovements = Array.isArray(movements) ? movements.filter(m => m && m.sku === art.sku) : [];

                    const totalInbound = artMovements
                        .filter(m => m.type === 'ENTRADA')
                        .reduce((sum, m) => sum + (Number(m.qty) || 0), 0);

                    const totalOutbound = artMovements
                        .filter(m => m.type === 'SALIDA')
                        .reduce((sum, m) => sum + (Number(m.qty) || 0), 0);

                    const stockActual = (Number(art.stock_inicial) || 0) + totalInbound - totalOutbound;

                    // Simple status logic
                    let situacion: ArticleStatus = 'Con stock';
                    if (stockActual <= 0) situacion = 'Sin stock';
                    else if (stockActual <= (Number(art.stock_seguridad) || 0)) situacion = 'Pedir a proveedor';

                    const last30Days = new Date();
                    last30Days.setDate(last30Days.getDate() - 30);
                    const recentMovements = artMovements.filter(m => {
                        try {
                            return new Date(m.date) >= last30Days;
                        } catch (e) { return false; }
                    });

                    const totalRecentOut = recentMovements
                        .filter(m => m.type === 'SALIDA')
                        .reduce((sum, m) => sum + (Number(m.qty) || 0), 0);

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
                        totalManualOut: artMovements.filter(m => m.type === 'SALIDA' && !m.ref_operacion).reduce((sum, m) => sum + (Number(m.qty) || 0), 0),
                        totalLoadOut: artMovements.filter(m => m.type === 'SALIDA' && m.ref_operacion).reduce((sum, m) => sum + (Number(m.qty) || 0), 0),
                        avgWeeklyConsumption: isNaN(avgWeeklyConsumption) ? 0 : avgWeeklyConsumption,
                        suggestedOrder: isNaN(suggestedOrder) ? 0 : suggestedOrder,
                        targetStock: isNaN(targetStock) ? 0 : targetStock
                    };
                } catch (e) {
                    console.error('Error processing article:', art?.sku, e);
                    return null;
                }
            }).filter((a): a is InventoryItem => a !== null);
        } catch (e: any) {
            console.error('Fatal error in inventoryStatus:', e);
            // setGlobalError(`Error de inventario: ${e.message}`); // Removed side effect
            return [];
        }
    }, [articles, movements]);

    // Compute currentMonth and isMonthOpen BEFORE any conditional returns (React hooks rules)
    const currentMonth = getCurrentMonth();
    const isMonthOpen = useMemo(() => {
        const closing = closings.find(c => c.month === currentMonth);
        return !closing || closing.status === 'OPEN';
    }, [closings, currentMonth]);

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

    const handleDeleteArticle = async (sku: string, force = false) => {
        try {
            const res = await fetch(`${API_URL}/api/articles/${sku}${force ? '?force=true' : ''}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al eliminar');

            notify(data.message);
            fetchData();
            setEditingSku(null);
            setIsEditing(false);
            setActiveTab('master');
        } catch (e: any) {
            notify(e.message || 'Error al eliminar el artículo.', 'error');
        }
    };

    const handleSaveClosing = async (month: string, status: 'OPEN' | 'CLOSED') => {
        try {
            const res = await fetch(`${API_URL}/api/closings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month,
                    status,
                    closed_by: currentUser?.nombre || 'Admin'
                })
            });
            if (!res.ok) throw new Error();
            fetchData();
            notify(`Periodo ${month} ${status === 'CLOSED' ? 'cerrado' : 'reabierto'} correctamente.`);
        } catch (e) {
            notify('Error al actualizar el cierre de mes.', 'error');
        }
    };

    if (!currentUser) {
        return <LoginView onLogin={handleLogin} />;
    }

    if (globalError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-red-900 p-8">
                <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Error de Aplicación</h2>
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-200 max-w-lg w-full">
                    <p className="text-sm font-bold text-red-600 mb-4">{globalError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs"
                    >
                        Reiniciar Aplicación
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 font-bold">
                <div className="w-12 h-12 border-4 border-[#632f9a] border-t-transparent rounded-full animate-spin mb-4"></div>
                Cargando datos del inventario...
            </div>
        );
    }

    // currentMonth and isMonthOpen are now computed earlier to comply with hooks rules

    return (
        <div className="flex h-screen bg-gray-100 text-slate-900">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                onLogout={handleLogout}
                hasLoadAlerts={false}
            />

            <main className="flex-1 overflow-auto">
                <Header
                    activeTab={activeTab}
                    currentMonth={currentMonth}
                    isMonthOpen={isMonthOpen}
                    userName={currentUser.nombre}
                    userRole={currentUser.rol}
                    onLogout={handleLogout}
                    version={CURRENT_VERSION}
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
                            isEditing={isEditing}
                            setIsEditing={setIsEditing}
                            onDelete={handleDeleteArticle}
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
                            setIsEditing={setIsEditing}
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
                            onSyncComplete={fetchData}
                            setIsEditing={setIsEditing}
                        />
                    )}

                    {activeTab === 'manual' && (
                        manualMode === 'GENERAL' ? (
                            <div className="space-y-6">
                                <div className="flex justify-end p-2 bg-slate-50 rounded-2xl border border-slate-100 items-center gap-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cambiar modo de registro:</p>
                                    <button
                                        onClick={() => setManualMode('PALLETS')}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                                    >
                                        <Truck size={16} /> Especial: Expedición de Palets
                                    </button>
                                </div>
                                <ManualConsumptionForm
                                    articles={inventoryStatus.filter(a => a.activo)}
                                    isMonthOpen={isMonthOpen}
                                    onSubmit={(data) => handleSaveManualConsumption(data)}
                                    notify={notify}
                                    setIsEditing={setIsEditing}
                                />
                            </div>
                        ) : (
                            <PalletsConsumptionForm
                                articles={inventoryStatus}
                                obramatProviders={obramatProviders}
                                palletConsumptions={palletConsumptions}
                                onRefresh={fetchData}
                                notify={notify}
                                onBack={() => setManualMode('GENERAL')}
                            />
                        )
                    )}

                    {activeTab === 'history' && (
                        <MovementHistoryView
                            articles={articles}
                            inbounds={movements.filter(m => m.type === 'ENTRADA' && !m.detail.includes('Regularización'))}
                            manualConsumptions={movements.filter(m => m.type === 'SALIDA' && !m.ref_operacion && !m.detail.includes('Regularización'))}
                            loads={loads}
                            adjustments={movements.filter(m => m.detail.includes('Regularización'))}
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
                            closings={closings}
                            onSaveClosing={handleSaveClosing}
                            onJumpToDuplicates={() => {
                                setLoadsFilter('DUPLICATES');
                                setActiveTab('loads');
                            }}
                            onJumpToLoads={() => {
                                setLoadsFilter('ADR_PENDING');
                                setActiveTab('loads');
                            }}
                            userRole={currentUser.rol}
                        />
                    )}

                    {activeTab === 'reverse' && (
                        <ReverseLogisticsView
                            articles={articles}
                            obramatProviders={obramatProviders}
                            storageEntries={storageEntries}
                            currentMonth={currentMonth}
                            onRefresh={fetchData}
                            notify={notify}
                        />
                    )}

                    {activeTab === 'expenses' && (
                        <GeneralExpensesView
                            expenses={generalExpenses}
                            obramatProviders={obramatProviders}
                            onRefresh={fetchData}
                            notify={notify}
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
