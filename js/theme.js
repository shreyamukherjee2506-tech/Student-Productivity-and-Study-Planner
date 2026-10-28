/**
 * StudyFlow - Theme Manager
 * Controls Dark and Light theme switching, persists in localStorage,
 * applies document data-theme attribute and updates toggle icons.
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.init();
  }

  init() {
    // 1. Check storageService or fallback to system preference
    let savedTheme = null;
    try {
      const settings = window.storageService ? window.storageService.getSettings() : null;
      if (settings && settings.theme) {
        savedTheme = settings.theme;
      }
    } catch (e) {
      console.warn('Theme init read error:', e);
    }

    if (!savedTheme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      savedTheme = prefersDark ? 'dark' : 'light';
    }

    this.applyTheme(savedTheme, false);
    this.bindEvents();
  }

  applyTheme(theme, save = true) {
    this.currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    if (save && window.storageService) {
      window.storageService.saveSettings({ theme: this.currentTheme });
    }

    // Update settings choices if on settings view
    const choiceBoxes = document.querySelectorAll('.theme-choice-box');
    choiceBoxes.forEach(box => {
      if (box.dataset.themeChoice === this.currentTheme) {
        box.classList.add('active');
      } else {
        box.classList.remove('active');
      }
    });

    // Notify other components (like analytics canvas)
    window.dispatchEvent(new CustomEvent('studyflow:theme-changed', { detail: { theme: this.currentTheme } }));
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme, true);
    if (window.toastService) {
      window.toastService.show(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} theme`, 'info');
    }
  }

  bindEvents() {
    // Listen for theme toggle buttons across the DOM
    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('#themeToggleBtn, .theme-toggle-btn');
      if (toggleBtn) {
        e.preventDefault();
        this.toggleTheme();
        return;
      }

      const choiceBox = e.target.closest('.theme-choice-box');
      if (choiceBox && choiceBox.dataset.themeChoice) {
        this.applyTheme(choiceBox.dataset.themeChoice, true);
      }
    });
  }
}

// Global instance
window.themeManager = new ThemeManager();
