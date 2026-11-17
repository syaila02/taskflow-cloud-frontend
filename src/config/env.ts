/**
 * Konfigurasi environment frontend (AGENTS.md §11.2).
 * Variabel VITE_ dapat diakses oleh browser dan tidak boleh berisi data rahasia/secret.
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
} as const;
