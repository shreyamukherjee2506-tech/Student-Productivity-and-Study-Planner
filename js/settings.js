/**
 * StudyFlow - Settings Module
 * Manages user profile customization, Pomodoro timer duration preferences,
 * theme choice, and JSON backup export/import tools.
 */

class SettingsManager {
  constructor() {
    this.init();
  }

  init() {
    this.loadCurrentSettings();
    this.bindEvents();
  }

  loadCurrentSettings() {
    const settings = window.storageService.getSettings();

    // Student profile
    const nameInput = document.getElementById('settingStudentName');
    if (nameInput) nameInput.value = settings.studentName || 'Alex Rivera';

    const majorInput = document.getElementById('settingStudentMajor');
    if (majorInput) majorInput.value = settings.major || 'B.Tech CS (Data Science)';

    const goalInput = document.getElementById('settingDailyGoal');
    if (goalInput) goalInput.value = settings.dailyGoalMinutes || 120;

    // Pomodoro preferences
    const pomo = settings.pomodoro || { focusDuration: 25, shortBreak: 5, longBreak: 15, soundEnabled: true };
    const focusInput = document.getElementById('settingPomoFocus');
    if (focusInput) focusInput.value = pomo.focusDuration || 25;

    const shortInput = document.getElementById('settingPomoShort');
    if (shortInput) shortInput.value = pomo.shortBreak || 5;

    const longInput = document.getElementById('settingPomoLong');
    if (longInput) longInput.value = pomo.longBreak || 15;

    const soundInput = document.getElementById('settingPomoSound');
    if (soundInput) soundInput.checked = pomo.soundEnabled !== false;

    // Update avatar and header details
    this.updateUserSnippet(settings.studentName, settings.major);
  }

  updateUserSnippet(name, major) {
    const nameEl = document.getElementById('sidebarUserName');
    if (nameEl) nameEl.textContent = name || 'Student';

    const roleEl = document.getElementById('sidebarUserRole');
    if (roleEl) roleEl.textContent = major || 'B.Tech CS';

    const avatarEl = document.getElementById('sidebarUserAvatar');
    if (avatarEl && name) {
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      avatarEl.textContent = initials || 'ST';
    }
  }

  bindEvents() {
    // Save Profile Form
    const profileForm = document.getElementById('profileSettingsForm');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('settingStudentName').value.trim();
        const major = document.getElementById('settingStudentMajor').value.trim();
        const goal = parseInt(document.getElementById('settingDailyGoal').value, 10) || 120;

        window.storageService.saveSettings({
          studentName: name,
          major: major,
          dailyGoalMinutes: goal
        });

        this.updateUserSnippet(name, major);
        if (window.dashboardManager) window.dashboardManager.render();
        window.toastService.show('Profile updated successfully!', 'success');
      });
    }

    // Save Pomodoro Timers Form
    const pomoForm = document.getElementById('pomoSettingsForm');
    if (pomoForm) {
      pomoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const focusDuration = parseInt(document.getElementById('settingPomoFocus').value, 10) || 25;
        const shortBreak = parseInt(document.getElementById('settingPomoShort').value, 10) || 5;
        const longBreak = parseInt(document.getElementById('settingPomoLong').value, 10) || 15;
        const soundEnabled = document.getElementById('settingPomoSound').checked;

        window.storageService.saveSettings({
          pomodoro: {
            focusDuration,
            shortBreak,
            longBreak,
            soundEnabled
          }
        });

        if (window.pomodoroTimer) {
          window.pomodoroTimer.loadSettings();
        }

        window.toastService.show('Timer preferences saved!', 'success');
      });
    }

    // Export Data Button
    const exportBtn = document.getElementById('btnExportData');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportDataFile();
      });
    }

    // Import Data File Input
    const importInput = document.getElementById('fileImportInput');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const success = window.storageService.importJSON(event.target.result);
          if (success) {
            window.toastService.show('Data imported successfully!', 'success');
            this.loadCurrentSettings();
            setTimeout(() => window.location.reload(), 600);
          } else {
            window.toastService.show('Failed to import: invalid JSON format', 'error');
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      });
    }

    // Reset Sample Data Button
    const resetBtn = document.getElementById('btnResetSampleData');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset your data to default sample Computer Science planner data? This will overwrite existing records.')) {
          window.storageService.resetToSampleData();
          window.toastService.show('Sample data restored! 🚀', 'success');
          this.loadCurrentSettings();
          if (window.dashboardManager) window.dashboardManager.render();
          if (window.taskManager) window.taskManager.render();
          if (window.studyPlanner) window.studyPlanner.render();
          if (window.notesManager) window.notesManager.render();
          if (window.analyticsManager) window.analyticsManager.render();
        }
      });
    }

    // Clear All Data Button
    const clearBtn = document.getElementById('btnClearAllData');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('WARNING: Are you sure you want to clear all tasks, notes, and sessions? This cannot be undone.')) {
          window.storageService.clearAllData();
          window.toastService.show('All data cleared', 'warning');
          this.loadCurrentSettings();
          if (window.dashboardManager) window.dashboardManager.render();
          if (window.taskManager) window.taskManager.render();
          if (window.studyPlanner) window.studyPlanner.render();
          if (window.notesManager) window.notesManager.render();
          if (window.analyticsManager) window.analyticsManager.render();
        }
      });
    }
  }

  exportDataFile() {
    const jsonStr = window.storageService.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.toastService.show('StudyFlow data exported!', 'success');
  }
}

// Global instance
window.settingsManager = new SettingsManager();
