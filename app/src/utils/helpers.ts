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
 */
export const getCurrentMonth = (): string => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    if (day >= 26) {
        const nextDate = new Date(year, month + 1, 1);
        return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    }
    return `${year}-${String(month + 1).padStart(2, '0')}`;
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
