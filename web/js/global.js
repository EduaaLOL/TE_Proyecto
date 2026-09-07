/**
 * ============================================================================
 * SCRIPT GLOBAL · CAMPUS VIRTUAL ACADÉMICO (global.js)
 * Manejo transversal del menú lateral móvil, accesos y utilidades de navegación
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. MANEJO DEL MENÚ LATERAL MÓVIL (DRAWER & BACKDROP)
  // --------------------------------------------------------------------------
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const sidebar = document.querySelector('.app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    backdrop?.classList.add('active');
    document.body.classList.add('sidebar-open');
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    backdrop?.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  }

  mobileMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openSidebar();
  });

  sidebarCloseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSidebar();
  });

  backdrop?.addEventListener('click', closeSidebar);

  // Cerrar el drawer al seleccionar cualquier elemento en móviles
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  // Cerrar menú con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar?.classList.contains('open')) {
      closeSidebar();
    }
  });

  // --------------------------------------------------------------------------
  // 2. DETECCIÓN DE REDIRECCIÓN CON PARÁMETROS (Ej. ?openMl=true)
  // --------------------------------------------------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('openMl') === 'true' || urlParams.get('openMl') === '1') {
    const mlBtn = document.getElementById('btn-ml-recommend') || document.querySelector('.ml-trigger');
    if (mlBtn) {
      setTimeout(() => {
        mlBtn.click();
      }, 300);
    }
  }
});
