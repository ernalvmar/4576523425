import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting state in localStorage
 * Data survives page reloads and browser sessions
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    // Prefix all keys with app identifier to avoid collisions
    const storageKey = `envos-obramat-${key}`;

    // Get from local storage then parse stored json or return initialValue
    const readValue = (): T => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${storageKey}":`, error);
            return initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState<T>(readValue);

    // Persist to localStorage whenever value changes
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(storageKey, JSON.stringify(storedValue));
        } catch (error) {
            console.warn(`Error setting localStorage key "${storageKey}":`, error);
        }
    }, [storageKey, storedValue]);

    return [storedValue, setStoredValue];
}

/**
 * Helper to clear all app data from localStorage
 */
export function clearAllAppData(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('envos-obramat-')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
}
