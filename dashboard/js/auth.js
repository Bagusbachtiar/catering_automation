/* ═══════════════════════════════════════════════════════════════════
   Auth — Catering Dashboard
   ═══════════════════════════════════════════════════════════════════ */

const TOKEN_KEY = 'catering_token';

/**
 * Login with password, store token on success
 */
async function login(password) {
  const data = await apiPost('/login', { password }, false);
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

/**
 * Logout — clear token and redirect to login page
 */
function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = 'index.html';
}

/**
 * Get stored auth token
 */
function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

/**
 * Check if user is authenticated, redirect to login if not
 */
function checkAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}
