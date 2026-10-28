/**
 * StudyFlow - Dashboard Module
 * Coordinates the primary command center: dynamic greetings, inspirational quotes,
 * real-time KPI metrics, today's tasks widget, upcoming study sessions,
 * and quick focus shortcuts.
 */

class DashboardManager {
  constructor() {
    this.quotes = [
      { text: "Consistency is what transforms average into excellence in computer science.", author: "Donald Knuth" },
      { text: "The secret to understanding machine learning is mastering the fundamentals of linear algebra and calculus.", author: "Data Science Tip" },
      { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
      { text: "Small daily improvements over time lead to stunning long-term academic results.", author: "Robin Sharma" },
      { text: "Simplicity is prerequisite for reliability in software systems.", author: "Edsger W. Dijkstra" }
    ];
    this.init();
  }

  init() {
    this.render();
    window.addEventListener('studyflow:data-updated', () => {
      this.render();
    });
  }

  render() {
    this.renderGreeting();
    this.renderMetrics();
    this.renderTodaysTasks();
    this.renderUpcomingSessions();
    this.renderMiniPomodoro();
  }

  renderGreeting() {
    const settings = window.storageService.getSettings();
    const studentName = settings.studentName || 'Scholar';
    const now = new Date();
    const hour = now.getHours();

    let timeOfDay = 'Good morning';
    if (hour >= 12 && hour < 17) {
      timeOfDay = 'Good afternoon';
    } else if (hour >= 17) {
      timeOfDay = 'Good evening';
    }

    const greetingEl = document.getElementById('dashGreetingText');
    if (greetingEl) {
      greetingEl.textContent = `${timeOfDay}, ${studentName} 👋`;
    }

    // Date badge
    const dateEl = document.getElementById('dashCurrentDate');
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    // Inspirational quote
    const quoteEl = document.getElementById('dashQuoteText');
    if (quoteEl) {
      const dayIndex = (now.getDate() + now.getMonth()) % this.quotes.length;
      const quote = this.quotes[dayIndex];
      quoteEl.innerHTML = `"${quote.text}" — <span style="color: var(--text-muted);">${quote.author}</span>`;
    }
  }

  renderMetrics() {
    const tasks = window.storageService.getTasks();
    const stats = window.storageService.getStats();
    const settings = window.storageService.getSettings();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
    const highPriorityPending = tasks.filter(t => t.status !== 'completed' && t.priority === 'high').length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Today's focus minutes
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayFocusMins = (stats.dailyFocusLogs && stats.dailyFocusLogs[todayStr]) || 0;
    const dailyGoal = settings.dailyGoalMinutes || 120;
    const goalPercent = Math.min(Math.round((todayFocusMins / dailyGoal) * 100), 100);

    // 1. Total Tasks
    const totalEl = document.getElementById('dashMetricTotal');
    if (totalEl) totalEl.textContent = totalTasks;

    // 2. Completed Tasks
    const completedEl = document.getElementById('dashMetricCompleted');
    if (completedEl) completedEl.textContent = completedTasks;
    const compRateEl = document.getElementById('dashMetricCompRate');
    if (compRateEl) compRateEl.textContent = `${completionRate}% rate`;

    // 3. Pending Tasks
    const pendingEl = document.getElementById('dashMetricPending');
    if (pendingEl) pendingEl.textContent = pendingTasks;
    const highPendingEl = document.getElementById('dashMetricUrgentPending');
    if (highPendingEl) highPendingEl.textContent = `${highPriorityPending} high priority`;

    // 4. Study Progress
    const studyTimeEl = document.getElementById('dashMetricStudyTime');
    if (studyTimeEl) studyTimeEl.textContent = `${todayFocusMins}m`;
    const studyGoalEl = document.getElementById('dashMetricStudyGoal');
    if (studyGoalEl) studyGoalEl.textContent = `${goalPercent}% of ${dailyGoal}m goal`;
  }

  renderTodaysTasks() {
    const container = document.getElementById('dashTodayTasksList');
    if (!container) return;

    const tasks = window.storageService.getTasks();
    const todayStr = new Date().toISOString().slice(0, 10);

    // Filter tasks due today or urgent high priority pending tasks
    const relevantTasks = tasks.filter(t => {
      if (t.status !== 'completed') return true;
      // Also show recently completed today
      if (t.dueDate && t.dueDate.startsWith(todayStr)) return true;
      return false;
    }).slice(0, 5);

    if (relevantTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <p class="empty-state-description">No urgent tasks remaining today. Great job keeping your plate clean!</p>
          <button class="btn btn-sm btn-primary" onclick="window.taskManager.openCreateModal()">Add a Task</button>
        </div>
      `;
      return;
    }

    container.innerHTML = relevantTasks.map(task => {
      const isCompleted = task.status === 'completed';
      const priorityClass = `badge-priority-${task.priority || 'medium'}`;

      return `
        <div class="dashboard-task-item">
          <div class="dashboard-task-left">
            <label class="custom-checkbox">
              <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="window.taskManager.toggleStatus('${task.id}')">
              <span class="checkmark"></span>
            </label>
            <div style="min-width: 0;">
              <div class="dashboard-task-title ${isCompleted ? 'completed' : ''}">${this.escapeHtml(task.title)}</div>
              <div class="dashboard-task-due">
                <span class="badge ${priorityClass}" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">
                  ${this.capitalize(task.priority || 'medium')}
                </span>
                <span>${this.escapeHtml(task.subject || 'General')}</span>
              </div>
            </div>
          </div>
          <button class="task-action-btn" title="Focus in Pomodoro" onclick="window.taskManager.focusInPomodoro('${task.id}')">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      `;
    }).join('');
  }

  renderUpcomingSessions() {
    const container = document.getElementById('dashUpcomingSessionsList');
    if (!container) return;

    const sessions = window.storageService.getSessions()
      .filter(s => s.status !== 'completed')
      .slice(0, 4);

    if (sessions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <p class="empty-state-description">No upcoming study sessions scheduled.</p>
          <button class="btn btn-sm btn-primary" onclick="window.studyPlanner.openCreateModal()">Schedule Session</button>
        </div>
      `;
      return;
    }

    container.innerHTML = sessions.map(session => {
      const date = new Date(`${session.date}T${session.startTime || '00:00'}`);
      const dateLabel = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

      return `
        <div class="dashboard-session-item">
          <div>
            <div style="font-size: 0.875rem; font-weight: 700; color: var(--text-primary);">${this.escapeHtml(session.subject)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
              ${dateLabel} • ${session.duration} mins
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="dashboard-session-time">${session.startTime || 'TBD'}</span>
            <button class="btn btn-sm btn-outline" style="padding: 0.25rem 0.5rem;" onclick="window.studyPlanner.startPomodoroForSession('${session.id}')">
              Start
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderMiniPomodoro() {
    if (window.pomodoroTimer) {
      window.pomodoroTimer.updateDisplay();
    }
  }

  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Global instance
window.dashboardManager = new DashboardManager();
