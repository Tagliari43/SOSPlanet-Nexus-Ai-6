export function saveToStorage<T>(key: string, value: T): void {
    try {
        const serializedState = JSON.stringify(value);
        localStorage.setItem(key, serializedState);
    } catch (error) {
        console.error("Erro ao salvar no Núcleo de Memória Soberano:", error);
    }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
        const serializedState = localStorage.getItem(key);
        if (serializedState === null) {
            return defaultValue;
        }
        return JSON.parse(serializedState);
    } catch (error) {
        console.error("Erro ao carregar do Núcleo de Memória Soberano:", error);
        return defaultValue;
    }
}
