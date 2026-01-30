import React from 'react';
import { Lock, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';
import { OperationalLoad, MonthClosing } from '../../types';
import { formatMonth, getCurrentMonth } from '../../utils/helpers';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface MonthClosingViewProps {
    currentMonth: string;
    loads: OperationalLoad[];
    isMonthOpen: boolean;
    setClosings: React.Dispatch<React.SetStateAction<MonthClosing[]>>;
    onJumpToDuplicates: () => void;
}

export const MonthClosingView: React.FC<MonthClosingViewProps> = ({
    currentMonth,
    loads,
    isMonthOpen,
    setClosings,
    onJumpToDuplicates
}) => {
    const [showConfirmClose, setShowConfirmClose] = React.useState(false);

    const duplicatesCount = loads.filter(l => l.duplicado && l.date?.startsWith(currentMonth)).length;
    const canClose = duplicatesCount === 0;

    const handleCloseMonth = () => {
        if (!canClose) {
            alert('No se puede cerrar el mes con cargas duplicadas pendientes.');
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

                        <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 border-green-200">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-600" size={20} />
                                <span className="font-medium text-gray-900">Sincronización Google Sheets</span>
                            </div>
                            <span className="text-green-600 font-medium">Actualizado ✓</span>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 border-green-200">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-600" size={20} />
                                <span className="font-medium text-gray-900">Regularizaciones Aplicadas</span>
                            </div>
                            <span className="text-green-600 font-medium">Sin pendientes ✓</span>
                        </div>
                    </div>
                </div>

                {!canClose && (
                    <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Atención:</strong> No puedes cerrar el mes mientras existan cargas duplicadas.
                                    Por favor, revisa y resuelve los duplicados antes de proceder.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
