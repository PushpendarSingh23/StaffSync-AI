/**
 * Central API utility.
 *
 * apiFetch automatically:
 *  - Reads the JWT from localStorage and adds the Authorization header
 *  - Parses JSON responses
 *  - Throws descriptive errors (pulling server message when available)
 *  - Emits a custom 'auth:expired' window event on 401 TOKEN_EXPIRED
 *    so AuthContext can log the user out without a circular import
 */
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const TOKEN_KEY = 'staffsync_token';

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Fire a window event so AuthContext can react without a circular import
    if (res.status === 401 && data?.code === 'TOKEN_EXPIRED') {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    const message =
      data?.message ||
      data?.errors?.map((e) => e.message).join(', ') ||
      `Request failed with status ${res.status}`;

    const err = new Error(message);
    err.status = res.status;
    err.errors = data?.errors || null;
    throw err;
  }

  return data;
};
