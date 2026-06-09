/* ═══════════════════════════════════════════════════════════════════
   API Helper — Catering Dashboard
   ═══════════════════════════════════════════════════════════════════ */

const BASE_URL = 'http://localhost:3000/api';

/**
 * Build query string from params object
 */
function buildQuery(params) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== '' && v != null);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

/**
 * GET request with auth header
 */
async function apiGet(endpoint, params) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}${buildQuery(params)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

/**
 * POST request (auth optional, defaults to true)
 */
async function apiPost(endpoint, data, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    headers['Authorization'] = `Bearer ${getToken()}`;
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

/**
 * PUT request with auth header
 */
async function apiPut(endpoint, data) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

/**
 * DELETE request with auth header
 */
async function apiDelete(endpoint) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

/**
 * Upload file via FormData (multipart/form-data) with auth
 * @param {string} endpoint
 * @param {FormData} formData
 */
async function apiUpload(endpoint, formData) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // NOTE: Do NOT set Content-Type — browser sets it with boundary for FormData
    },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}
