import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface ToastProps {
    notifications: Notification[];
    removeNotification: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ notifications, removeNotification }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 min-w-[320px] max-w-md">
            {notifications.map((n) => (
                <ToastItem key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
            ))}
        </div>
    );
};

interface ToastItemProps {
    notification: Notification;
    onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: {
            bg: 'bg-white',
            border: 'border-green-100',
            icon: <CheckCircle2 className="text-green-500" size={20} />,
            accent: 'bg-green-500'
        },
        error: {
            bg: 'bg-white',
            border: 'border-red-100',
            icon: <AlertCircle className="text-red-500" size={20} />,
            accent: 'bg-red-500'
        },
        info: {
            bg: 'bg-white',
            border: 'border-blue-100',
            icon: <Info className="text-blue-500" size={20} />,
            accent: 'bg-blue-500'
        }
    };

    const s = styles[notification.type];

    return (
        <div className={`${s.bg} border ${s.border} rounded-2xl shadow-2xl shadow-slate-200/50 flex overflow-hidden animate-fade-in group translate-x-0 transition-transform active:scale-95`}>
            <div className={`w-1.5 ${s.accent}`}></div>
            <div className="p-4 flex items-start gap-3 flex-1">
                <div className="mt-0.5">{s.icon}</div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{notification.message}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
