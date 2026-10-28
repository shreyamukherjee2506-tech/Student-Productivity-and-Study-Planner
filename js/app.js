/**
 * StudyFlow - Main Application Controller
 * Handles SPA navigation routing, modal management, toast notifications,
 * mobile drawer toggle, and global keyboard shortcuts.
 */

class ToastService {
  constructor() {
    this.container = document.getElementById('toastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 3200) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: `<svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
      info: `<svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      warning: `<svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
      error: `<svg class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`
    };

    toast.innerHTML = `
      ${iconMap[type] || iconMap.info}
      <div class="toast-message">${message}</div>
      <button class="toast-close" title="Close">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    this.container.appendChild(toast);

    setTimeout(() => {
      this.dismiss(toast);
    }, duration);
  }

  dismiss(toast) {
    if (toast.classList.contains('toast-hiding')) return;
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }
}

class AppController {
  constructor() {
    this.currentView = 'dashboard';
    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindModals();
    this.bindMobileSidebar();
    this.bindKeyboardShortcuts();
    this.navigateTo('dashboard');
  }

  bindNavigation() {
    // Navigation Links
    const navLinks = document.querySelectorAll('[data-view-target]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.dataset.viewTarget;
        this.navigateTo(targetView);
        this.closeMobileSidebar();
      });
    });

    // Global Topbar "+ New Task" Button
    const globalAddBtn = document.getElementById('globalAddTaskBtn');
    if (globalAddBtn) {
      globalAddBtn.addEventListener('click', () => {
        if (window.taskManager) {
          window.taskManager.openCreateModal();
        }
      });
    }
  }

  navigateTo(viewId) {
    const validViews = ['dashboard', 'tasks', 'planner', 'pomodoro', 'analytics', 'notes', 'settings'];
    if (!validViews.includes(viewId)) {
      viewId = 'dashboard';
    }

    this.currentView = viewId;

    // Update active view DOM
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.remove('active');
    });
    const targetPage = document.getElementById(`view-${viewId}`);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // Update active nav links
    document.querySelectorAll('[data-view-target]').forEach(link => {
      if (link.dataset.viewTarget === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update page title and subtitle
    const titles = {
      dashboard: { title: 'Academic Dashboard', subtitle: 'Overview of your coursework, daily goals & upcoming study blocks' },
      tasks: { title: 'Task Manager', subtitle: 'Organize assignments, track progress, and conquer deadlines' },
      planner: { title: 'Study Planner', subtitle: 'Block out focused study sessions for maximum retention' },
      pomodoro: { title: 'Pomodoro Timer', subtitle: 'High-focus deep work intervals with structured breaks' },
      analytics: { title: 'Progress & Analytics', subtitle: 'Data-driven performance insights calculated from your activity' },
      notes: { title: 'Study Notes & Cheatsheets', subtitle: 'Quick reference concepts, definitions, and code snippets' },
      settings: { title: 'Settings & Data', subtitle: 'Customize profile, timer intervals, themes, and backup data' }
    };

    const header = titles[viewId] || titles.dashboard;
    const titleEl = document.getElementById('topbarPageTitle');
    const subEl = document.getElementById('topbarPageSubtitle');
    if (titleEl) titleEl.textContent = header.title;
    if (subEl) subEl.textContent = header.subtitle;

    // Re-render corresponding view managers when navigated to
    if (viewId === 'dashboard' && window.dashboardManager) window.dashboardManager.render();
    if (viewId === 'tasks' && window.taskManager) window.taskManager.render();
    if (viewId === 'planner' && window.studyPlanner) window.studyPlanner.render();
    if (viewId === 'pomodoro' && window.pomodoroTimer) window.pomodoroTimer.populateTaskSelector();
    if (viewId === 'analytics' && window.analyticsManager) window.analyticsManager.render();
    if (viewId === 'notes' && window.notesManager) window.notesManager.render();
    if (viewId === 'settings' && window.settingsManager) window.settingsManager.loadCurrentSettings();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindModals() {
    // Close modal on click on [data-close-modal]
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) {
        const modal = closeBtn.closest('.modal-overlay');
        if (modal) this.closeModal(modal.id);
        return;
      }

      // Close modal on overlay background click
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal(e.target.id);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          this.closeModal(activeModal.id);
        }
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Focus first input if available
      const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  bindMobileSidebar() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const closeBtn = document.getElementById('sidebarCloseBtn');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('appSidebar');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
      });
    }

    const closeHandler = () => {
      this.closeMobileSidebar();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeHandler);
    if (overlay) overlay.addEventListener('click', closeHandler);
  }

  closeMobileSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  }

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts if typing inside an input, textarea or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 't') {
        e.preventDefault();
        window.taskManager.openCreateModal();
      } else if (key === 'p') {
        e.preventDefault();
        this.navigateTo('pomodoro');
      } else if (key === 'd') {
        e.preventDefault();
        this.navigateTo('dashboard');
      } else if (key === '?') {
        e.preventDefault();
        this.openModal('shortcutsModal');
      }
    });
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.toastService = new ToastService();
  window.app = new AppController();
});
