/* ═══════════════════════════════════════════════════════════════════
   Utilities — Catering Dashboard
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Format a number as Indonesian Rupiah
 * @param {number} amount
 * @returns {string} e.g. "Rp 50.000"
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return 'Rp ' + num.toLocaleString('id-ID', { minimumFractionDigits: 0 });
}

/**
 * Format a date string to a readable Indonesian-style date
 * @param {string} dateStr
 * @returns {string} e.g. "20 September 2026"
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {string} type - success | error | warning | info
 */
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

/**
 * Open a modal dialog
 * @param {string} id - Unique modal ID
 * @param {string} title - Modal title
 * @param {string} bodyHtml - HTML content for the modal body
 */
function showModal(id, title, bodyHtml) {
  // Remove existing modal with same id
  closeModal(id);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = id;

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="closeModal('${id}')">&times;</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(id);
  });

  // Trigger open animation
  requestAnimationFrame(() => overlay.classList.add('open'));
}

/**
 * Close and remove a modal by ID
 * @param {string} id
 */
function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => overlay.remove(), 250);
}

/**
 * Show a promise-based confirm dialog
 * @param {string} message
 * @returns {Promise<boolean>}
 */
function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box">
        <p>${message}</p>
        <div class="confirm-actions">
          <button class="btn btn-outline" id="confirmNo">Cancel</button>
          <button class="btn btn-danger" id="confirmYes">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#confirmYes').addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });

    overlay.querySelector('#confirmNo').addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });
  });
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} delay - milliseconds
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Return a colored badge HTML for a status string
 * @param {string} status
 * @returns {string} HTML
 */
function statusBadge(status) {
  const map = {
    confirmed: 'confirmed',
    'in-progress': 'progress',
    'in progress': 'progress',
    completed: 'completed',
    cancelled: 'cancelled',
    pending: 'pending',
    paid: 'paid',
  };
  const cls = map[(status || '').toLowerCase()] || 'confirmed';
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  return `<span class="badge badge-${cls}">${label}</span>`;
}

/**
 * Format menu items for display
 * @param {object} order
 * @returns {string}
 */
function formatMenuDisplay(order) {
  if (order.menu_items) {
    try {
      const items = JSON.parse(order.menu_items);
      if (Array.isArray(items) && items.length > 0) {
        return items.map(item => `${item.menu} (x${item.quantity})`).join(', ');
      }
    } catch (e) {}
  }
  return order.menu_choice || '-';
}

/**
 * Escape HTML characters
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
