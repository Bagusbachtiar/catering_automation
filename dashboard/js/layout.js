/* ═══════════════════════════════════════════════════════════════════
   Layout — Catering Dashboard (Sidebar + Header)
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Inject sidebar and header into the page
 * @param {string} title - Page title shown in the header
 */
function loadLayout(title) {
  const layout = document.getElementById('app');
  if (!layout) return;

  layout.classList.add('layout');
  layout.innerHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">🍽️</span>
        <span class="logo-text">Catering Dashboard</span>
      </div>
      <nav class="sidebar-nav" id="sidebarNav">
        <a href="dashboard.html" data-page="dashboard">
          <span class="nav-icon">📊</span> Dashboard
        </a>
        <a href="orders.html" data-page="orders">
          <span class="nav-icon">📋</span> Orders
        </a>
        <a href="calendar.html" data-page="calendar">
          <span class="nav-icon">📅</span> Calendar
        </a>
        <a href="menus.html" data-page="menus">
          <span class="nav-icon">🍱</span> Menus
        </a>
        <a href="customers.html" data-page="customers">
          <span class="nav-icon">👥</span> Customers
        </a>
        <a href="analytics.html" data-page="analytics">
          <span class="nav-icon">📈</span> Analytics
        </a>
        <div class="nav-divider"></div>
        <a href="settings.html" data-page="settings">
          <span class="nav-icon">⚙️</span> Settings
        </a>
        <a href="#" data-page="logout" onclick="logout(); return false;">
          <span class="nav-icon">🚪</span> Logout
        </a>
      </nav>
    </aside>

    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <div class="main-content">
      <header class="header">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu">☰</button>
          <h1 class="header-title">${title}</h1>
        </div>
        <div class="header-actions" id="headerActions"></div>
      </header>
      <div class="page-content" id="pageContent"></div>
    </div>
  `;

  // Mobile sidebar toggle
  const hamburger = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}

/**
 * Highlight the current page link in the sidebar
 * @param {string} page - The data-page value to highlight
 */
function setActiveNav(page) {
  const links = document.querySelectorAll('#sidebarNav a');
  links.forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
}
