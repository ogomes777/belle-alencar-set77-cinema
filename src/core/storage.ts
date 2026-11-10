/** localStorage seguro: nunca lança (modo privado, cota, bloqueio). */
const PREFIX = 'belle:v4:';

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* sem persistência: a experiência continua funcionando em memória */
  }
}

export function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(PREFIX + key, value);
  } catch {
    /* ignore */
  }
}
