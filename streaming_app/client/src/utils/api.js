// Centralized API base URL + fetch wrapper
// Uses REACT_APP_API_URL when provided; falls back to localhost:5002 in dev (port 3002)

const inferDefaultBase = () => {
  try {
    if (typeof window !== 'undefined') {
      const { protocol, hostname, port } = window.location;
      // If running the React dev server on 3002, default API to 5002
      if (port === '3002') return `${protocol}//${hostname}:5002`;
      // Otherwise assume same origin
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }
  } catch (_) {}
  return 'http://localhost:5002';
};

export const API_BASE = process.env.REACT_APP_API_URL || inferDefaultBase();

export function apiUrl(path) {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) path = `/${path}`;
  return `${API_BASE}${path}`;
}

export async function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  return fetch(url, options);
}
