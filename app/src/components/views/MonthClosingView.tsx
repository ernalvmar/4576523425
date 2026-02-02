import React from 'react';
import { Lock, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';
import { OperationalLoad, MonthClosing } from '../../types';
import { formatMonth } from '../../utils/helpers';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface MonthClosingViewProps {
    currentMonth: string;
    loads: OperationalLoad[];
    isMonthOpen: boolean;
    setClosings: React.Dispatch<React.SetStateAction<MonthClosing[]>>;
    onJumpToDuplicates: () => void;
    onJumpToLoads: () => void;
    userRole: string;
}

export const MonthClosingView: React.FC<MonthClosingViewProps> = ({
    currentMonth,
    loads,
    isMonthOpen,
    setClosings,
    onJumpToDuplicates,
    onJumpToLoads,
    userRole
}) => {
    const [showConfirmClose, setShowConfirmClose] = React.useState(false);
    const [skipAdrCheck, setSkipAdrCheck] = React.useState(false);
    const isResponsable = userRole === 'responsable';

    const periodLoads = loads.filter(l => l.periodo === currentMonth);
    const duplicatesCount = periodLoads.filter(l => l.duplicado).length;

    const adrPendingCount = periodLoads.filter(l => {
        const hasAdr = Object.keys(l.consumptions).some(k => k.toLowerCase().includes('adr'));
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
        setClosings(prev => prev.map(c =>
            c.month === currentMonth
                ? { ...c, status: 'CLOSED', closed_by: 'Admin', closed_at: new Date().toISOString() }
                : c
        ));
        setShowConfirmClose(false);
        alert(`Mes ${formatMonth(currentMonth)} cerrado correctamente.`);
    };

    return (
        <div className="space-y-6">
            <ConfirmDialog
                isOpen={showConfirmClose}
                title="¿Cerrar el mes contable?"
                message={`Una vez cerrado el mes ${formatMonth(currentMonth)}, no se podrán registrar nuevos movimientos ni modificar los existentes. Esta acción es irreversible.`}
                variant="warning"
                confirmText="Cerrar Mes"
                onConfirm={confirmClose}
                onCancel={() => setShowConfirmClose(false)}
            />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${isMonthOpen ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Lock size={24} className={isMonthOpen ? 'text-green-600' : 'text-red-600'} />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">{formatMonth(currentMonth)}</h3>
                            <p className={`text-sm font-medium ${isMonthOpen ? 'text-green-600' : 'text-red-600'}`}>
                                {isMonthOpen ? 'Periodo ABIERTO' : 'Periodo CERRADO'}
                            </p>
                        </div>
                    </div>
                    {isMonthOpen && (
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
                    )}
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
                                {adrPendingCount > 0 && (
                                    <button onClick={onJumpToLoads} className="text-sm text-blue-600 hover:text-blue-800 underline">Resolver</button>
                                )}
                                {adrPendingCount > 0 && isResponsable && (
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

                {duplicatesCount > 0 && (
                    <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <AlertOctagon className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    <strong>Crítico:</strong> No puedes cerrar el mes mientras existan cargas duplicadas.
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
                                    <strong>Pendiente:</strong> Es obligatorio desglosar las pegatinas ADR de las {adrPendingCount} cargas detectadas.
                                    {isResponsable && " Puedes omitir este check si es necesario."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
