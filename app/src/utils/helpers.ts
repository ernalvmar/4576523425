/**
 * Format ISO month string to readable Spanish format
 * Example: "2024-01" -> "2024 - Enero"
 */
export const formatMonth = (isoMonth: string): string => {
    if (!isoMonth) return '';
    const [year, month] = isoMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const monthName = date.toLocaleString('es-ES', { month: 'long' });
    return `${year} - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
};

/**
 * Get current billing period (26th to 25th logic)
 * Período contable: del 26 del mes anterior al 25 del mes actual
 * Ejemplo: 26 enero - 25 febrero = período "2026-02" (febrero)
 */
export const getCurrentMonth = (): string => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    const year = now.getFullYear();

    if (day >= 26) {
        // Si el día es >= 26, pertenece al período del MES SIGUIENTE
        // Ejemplo: 26 enero -> período febrero (2026-02)
        const nextMonth = month + 1;
        if (nextMonth > 12) {
            // Si es diciembre, el siguiente período es enero del año siguiente
            return `${year + 1}-01`;
        }
        return `${year}-${String(nextMonth).padStart(2, '0')}`;
    } else {
        // Si el día es < 26, pertenece al período del MES ACTUAL
        // Ejemplo: 12 febrero -> período febrero (2026-02)
        return `${year}-${String(month).padStart(2, '0')}`;
    }
};

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export const getToday = (): string => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Generate a unique ID (UUID fallback if crypto is not available)
 */
export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

/**
 * Generate a smart SKU based on product name and type
 */
export const generateSmartSKU = (nombre: string, tipo: 'Nuevo' | 'Usado'): string => {
    if (!nombre) return '';
    const prefix = nombre.substring(0, 3).toUpperCase();
    const typeChar = tipo === 'Nuevo' ? 'N' : 'U';
    const seq = Math.floor(Math.random() * 900) + 100;
    return `${prefix}-${typeChar}-${seq}`;
};

/**
 * Format number as currency (EUR)
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
};

/**
 * Format number with Spanish locale
 */
export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('es-ES').format(value);
};

/**
 * Calculate billing period from a date string (YYYY-MM-DD)
 * Período contable: del 26 del mes anterior al 25 del mes actual
 * Ejemplo: "2026-01-26" -> "2026-02" (período febrero)
 * Ejemplo: "2026-02-12" -> "2026-02" (período febrero)
 */
export const calculatePeriodFromDate = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);

    if (d >= 26) {
        // Si el día es >= 26, pertenece al período del MES SIGUIENTE
        const nextMonth = m + 1;
        if (nextMonth > 12) {
            return `${y + 1}-01`;
        }
        return `${y}-${String(nextMonth).padStart(2, '0')}`;
    } else {
        // Si el día es < 26, pertenece al período del MES ACTUAL
        return `${y}-${String(m).padStart(2, '0')}`;
    }
};
