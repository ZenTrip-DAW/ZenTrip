import { auth } from '../config/firebaseConfig';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function getAuthHeaders() {
  let token = null;

  if (auth.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
      localStorage.setItem('firebaseIdToken', token);
    } catch {
      token = null;
    }
  }

  if (!token) {
    token = localStorage.getItem('firebaseIdToken');
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function refreshAuthHeader() {
  if (!auth.currentUser) return {};

  try {
    const freshToken = await auth.currentUser.getIdToken(true);
    localStorage.setItem('firebaseIdToken', freshToken);
    return { Authorization: `Bearer ${freshToken}` };
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const authHeaders = await getAuthHeaders();

  const makeRequest = async (headers) => fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...options.headers,
    },
  });

  let res = await makeRequest(authHeaders);

  // Si el token expiró, forzamos refresh una vez y reintentamos.
  if (res.status === 401 && auth.currentUser) {
    const refreshedAuthHeaders = await refreshAuthHeader();
    if (refreshedAuthHeaders.Authorization) {
      res = await makeRequest(refreshedAuthHeaders);
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || `Error ${res.status}`);
    if (data.expired) err.expired = true;
    if (data.rotated) err.rotated = true;
    throw err;
  }

  return res.json();
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
