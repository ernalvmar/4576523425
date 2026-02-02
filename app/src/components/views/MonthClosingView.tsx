import React from 'react';
import { Lock, AlertOctagon, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { OperationalLoad, MonthClosing } from '../../types';
import { formatMonth } from '../../utils/helpers';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface MonthClosingViewProps {
    currentMonth: string;
    loads: OperationalLoad[];
    closings: MonthClosing[];
    onSaveClosing: (month: string, status: 'OPEN' | 'CLOSED') => void;
    onJumpToDuplicates: () => void;
    onJumpToLoads: () => void;
    userRole: string;
}

export const MonthClosingView: React.FC<MonthClosingViewProps> = ({
    currentMonth: activePeriod,
    loads,
    closings,
    onSaveClosing,
    onJumpToDuplicates,
    onJumpToLoads,
    userRole
}) => {
    // Local state for selected month to view
    const [selectedMonth, setSelectedMonth] = React.useState(activePeriod);
    const [showConfirmClose, setShowConfirmClose] = React.useState(false);
    const [skipAdrCheck, setSkipAdrCheck] = React.useState(false);

    const isResponsable = userRole === 'responsable';

    // Get all months that have data or closings
    const availableMonths = React.useMemo(() => {
        const fromLoads = Array.from(new Set(loads.map(l => l.periodo).filter(Boolean)));
        const fromClosings = closings.map(c => c.month);
        const combined = Array.from(new Set([...fromLoads, ...fromClosings, activePeriod])).sort().reverse();
        return combined as string[];
    }, [loads, closings, activePeriod]);

    const currentClosing = closings.find(c => c.month === selectedMonth);
    const isMonthOpen = !currentClosing || currentClosing.status === 'OPEN';

    const periodLoads = loads.filter(l => l.periodo === selectedMonth);
    const duplicatesCount = periodLoads.filter(l => l.duplicado).length;

    const adrPendingCount = periodLoads.filter(l => {
        const hasAdr = Object.keys(l.consumptions).some(k => k.toUpperCase().includes('ADR') || k.toLowerCase().includes('pegatina'));
        const hasBreakdown = l.adr_breakdown && Object.keys(l.adr_breakdown).length > 0;
        return hasAdr && !hasBreakdown;
    }).length;

    const canClose = duplicatesCount === 0 && (adrPendingCount === 0 || skipAdrCheck);

    const handleCloseMonth = () => {
        if (duplicatesCount > 0) {
            alert('No se puede cerrar el mes con cargas duplicadas pendientes.');
            return;
        }
        if (adrPendingCount > 0 && !skipAdrCheck) {
            alert('Debe identificar el desglose de pegatinas ADR o marcar la casilla de omisión.');
            return;
        }
        setShowConfirmClose(true);
    };

    const confirmClose = () => {
        onSaveClosing(selectedMonth, 'CLOSED');
        setShowConfirmClose(false);
    };

    const handleReopenMonth = () => {
        if (!isResponsable) {
            alert('Solo un responsable puede reabrir un mes cerrado.');
            return;
        }
        if (confirm(`¿Está seguro de que desea REABRIR el mes ${formatMonth(selectedMonth)}?`)) {
            onSaveClosing(selectedMonth, 'OPEN');
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmDialog
                isOpen={showConfirmClose}
                title="¿Cerrar el mes contable?"
                message={`Una vez cerrado el mes ${formatMonth(selectedMonth)}, no se podrán registrar nuevos movimientos ni modificar los existentes. Esta acción es irreversible.`}
                variant="warning"
                confirmText="Cerrar Mes"
                onConfirm={confirmClose}
                onCancel={() => setShowConfirmClose(false)}
            />

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar - Month Selection */}
                <div className="w-full md:w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Histórico de Cierres</h3>
                    <div className="space-y-1">
                        {availableMonths.map(m => {
                            const closing = closings.find(c => c.month === m);
                            const isOpen = !closing || closing.status === 'OPEN';
                            return (
                                <button
                                    key={m}
                                    onClick={() => setSelectedMonth(m)}
                                    className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center justify-between ${selectedMonth === m
                                            ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        <span>{formatMonth(m)}</span>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${isMonthOpen ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Lock size={24} className={isMonthOpen ? 'text-green-600' : 'text-red-600'} />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">{formatMonth(selectedMonth)}</h3>
                                <p className={`text-sm font-medium ${isMonthOpen ? 'text-green-600' : 'text-red-600'}`}>
                                    {isMonthOpen ? 'Periodo ABIERTO' : 'Periodo CERRADO'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {isMonthOpen ? (
                                <button
                                    onClick={handleCloseMonth}
                                    disabled={!canClose}
                                    className={`px-6 py-3 rounded-md font-medium flex items-center gap-2 ${canClose
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    <Lock size={18} />
                                    Cerrar Mes
                                </button>
                            ) : (
                                isResponsable && (
                                    <button
                                        onClick={handleReopenMonth}
                                        className="px-6 py-3 rounded-md font-medium flex items-center gap-2 bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200"
                                    >
                                        <Lock size={18} className="rotate-180" />
                                        Reabrir Mes (Admin)
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="border-t pt-6">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Checklist de Cierre</h4>

                        <div className="space-y-3">
                            <div className={`flex items-center justify-between p-4 rounded-lg border ${duplicatesCount === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {duplicatesCount === 0 ? (
                                        <CheckCircle2 className="text-green-600" size={20} />
                                    ) : (
                                        <AlertOctagon className="text-red-600" size={20} />
                                    )}
                                    <span className="font-medium text-gray-900">Cargas Duplicadas</span>
                                </div>
                                {duplicatesCount === 0 ? (
                                    <span className="text-green-600 font-medium">Sin duplicados ✓</span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-600 font-medium">{duplicatesCount} pendiente(s)</span>
                                        <button
                                            onClick={onJumpToDuplicates}
                                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Ver duplicados
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={`flex items-center justify-between p-4 rounded-lg border ${adrPendingCount === 0 || skipAdrCheck ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {adrPendingCount === 0 || skipAdrCheck ? (
                                        <CheckCircle2 className="text-green-600" size={20} />
                                    ) : (
                                        <AlertTriangle className="text-orange-600" size={20} />
                                    )}
                                    <div>
                                        <span className="font-medium text-gray-900">Desglose Pegatinas ADR</span>
                                        {adrPendingCount > 0 && (
                                            <p className="text-[10px] text-orange-700">Hay {adrPendingCount} cargas ADR sin identificar etiquetas.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {adrPendingCount > 0 && isMonthOpen && (
                                        <button onClick={onJumpToLoads} className="text-sm text-blue-600 hover:text-blue-800 underline">Resolver</button>
                                    )}
                                    {adrPendingCount > 0 && isMonthOpen && isResponsable && (
                                        <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded border border-orange-200 shadow-sm">
                                            <input
                                                type="checkbox"
                                                checked={skipAdrCheck}
                                                onChange={(e) => setSkipAdrCheck(e.target.checked)}
                                                className="rounded text-orange-600 shadow-sm focus:ring-orange-500"
                                            />
                                            <span className="text-[10px] font-bold text-orange-800 uppercase">Omitir (Responsable)</span>
                                        </label>
                                    )}
                                    {(adrPendingCount === 0 || skipAdrCheck) && (
                                        <span className="text-green-600 font-medium">{skipAdrCheck ? 'Omitido ✓' : 'Completado ✓'}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 border-green-200">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="text-green-600" size={20} />
                                    <span className="font-medium text-gray-900">Sincronización Google Sheets</span>
                                </div>
                                <span className="text-green-600 font-medium">Actualizado ✓</span>
                            </div>
                        </div>
                    </div>

                    {!isMonthOpen && currentClosing && (
                        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
                            <h5 className="text-sm font-bold text-blue-800 uppercase mb-4">Información de Cierre</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-blue-600 uppercase font-semibold">Cerrado por</p>
                                    <p className="text-lg font-bold text-blue-900">{currentClosing.closed_by}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-blue-600 uppercase font-semibold">Fecha de cierre</p>
                                    <p className="text-lg font-bold text-blue-900">{new Date(currentClosing.closed_at!).toLocaleString('es-ES')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isMonthOpen && (
                        <>
                            {duplicatesCount > 0 && (
                                <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
                                    <div className="flex">
                                        <AlertOctagon className="h-5 w-5 text-red-400" />
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700">
                                                <strong>Crítico:</strong> No puedes cerrar el mes mientras existan cargas duplicadas en el periodo {formatMonth(selectedMonth)}.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {adrPendingCount > 0 && !skipAdrCheck && (
                                <div className="mt-6 bg-orange-50 border-l-4 border-orange-400 p-4">
                                    <div className="flex">
                                        <AlertTriangle className="h-5 w-5 text-orange-400" />
                                        <div className="ml-3">
                                            <p className="text-sm text-orange-700">
                                                <strong>Pendiente:</strong> Es obligatorio desglosar las pegatinas ADR de las {adrPendingCount} cargas detectadas en {formatMonth(selectedMonth)}.
                                                {isResponsable && " Puedes omitir este check si es necesario."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
