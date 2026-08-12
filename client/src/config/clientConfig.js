/**
 * clientConfig.js
 * Single source of truth for client-side constants.
 */
export const clientConfig = {
  apiUrl:       import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  tokenKey:     'staffsync_token',
  debounceMs:   300,
  pageSize:     20,
  pollIntervalMs: 4000,   // for processing status polling on Documents page
  maxFileSizeMb:  20,
  confidenceThresholds: { high: 0.85, medium: 0.70 },
};
