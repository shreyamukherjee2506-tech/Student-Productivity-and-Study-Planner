/**
 * StudyFlow - Study Planner Module
 * Handles scheduling study sessions, viewing upcoming sessions,
 * marking sessions complete, and duration tracking.
 */

class StudyPlanner {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const sessionForm = document.getElementById('sessionForm');
    if (sessionForm) {
      sessionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    window.addEventListener('studyflow:data-updated', () => {
      this.render();
    });
  }

  render() {
    const container = document.getElementById('sessionsGridContainer');
    if (!container) return;

    const sessions = window.storageService.getSessions();
    // Sort chronologically (date + startTime)
    sessions.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.startTime || '00:00'}`);
      const timeB = new Date(`${b.date}T${b.startTime || '00:00'}`);
      return timeA - timeB;
    });

    // Update KPI stat counters on study planner page
    const totalMinutes = sessions.reduce((acc, s) => acc + (parseInt(s.duration, 10) || 0), 0);
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    
    const plannedHoursEl = document.getElementById('plannerTotalHours');
    if (plannedHoursEl) plannedHoursEl.textContent = `${(totalMinutes / 60).toFixed(1)} hrs`;
    
    const completedCountEl = document.getElementById('plannerCompletedCount');
    if (completedCountEl) completedCountEl.textContent = completedSessions;

    if (sessions.length === 0) {
      container.innerHTML = `
        <div class="card empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 class="empty-state-title">No study sessions scheduled</h4>
          <p class="empty-state-description">Plan your study blocks ahead of time to stay consistent with your coursework.</p>
          <button class="btn btn-primary" onclick="window.studyPlanner.openCreateModal()">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Schedule a Study Session
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = sessions.map(session => this.renderSessionCard(session)).join('');
  }

  renderSessionCard(session) {
    const isCompleted = session.status === 'completed';
    const sessionDate = new Date(`${session.date}T${session.startTime || '00:00'}`);
    const dateFormatted = sessionDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const timeFormatted = session.startTime || 'TBD';

    return `
      <div class="session-card ${isCompleted ? 'is-completed' : ''}" id="session-${session.id}">
        <div class="session-card-header">
          <div>
            <h4 class="session-subject">${this.escapeHtml(session.subject)}</h4>
            <span class="badge ${isCompleted ? 'badge-status-completed' : 'badge-status-in-progress'}" style="margin-top: 0.35rem;">
              <span class="badge-dot"></span>
              ${isCompleted ? 'Completed' : 'Scheduled'}
            </span>
          </div>
          <span class="badge badge-primary-bg" style="font-family: var(--font-mono); font-weight: 700;">
            ${session.duration} min
          </span>
        </div>

        <div class="session-details">
          <div class="session-detail-row">
            <span class="session-detail-label">Date:</span>
            <span class="session-detail-value">${dateFormatted}</span>
          </div>
          <div class="session-detail-row">
            <span class="session-detail-label">Start Time:</span>
            <span class="session-detail-value">${timeFormatted}</span>
          </div>
          <div class="session-detail-row">
            <span class="session-detail-label">Duration:</span>
            <span class="session-detail-value">${session.duration} minutes</span>
          </div>
        </div>

        ${session.notes ? `<div class="session-notes">${this.escapeHtml(session.notes)}</div>` : ''}

        <div class="session-card-footer">
          ${!isCompleted ? `
            <button class="btn btn-sm btn-outline" onclick="window.studyPlanner.markComplete('${session.id}')">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Mark Done
            </button>
            <button class="btn btn-sm btn-primary" onclick="window.studyPlanner.startPomodoroForSession('${session.id}')">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Study Now
            </button>
          ` : `
            <span class="badge badge-status-completed">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Completed
            </span>
          `}
          <button class="task-action-btn delete-btn" title="Delete session" style="margin-left: auto;" onclick="window.studyPlanner.deleteSession('${session.id}')">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  openCreateModal() {
    const form = document.getElementById('sessionForm');
    if (form) form.reset();

    // Default to today and current hour rounded up
    const todayStr = new Date().toISOString().slice(0, 10);
    const dateInput = document.getElementById('sessionDate');
    if (dateInput) dateInput.value = todayStr;

    const timeInput = document.getElementById('sessionStartTime');
    if (timeInput) {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      timeInput.value = now.toTimeString().slice(0, 5);
    }

    window.app.openModal('sessionModal');
  }

  handleFormSubmit() {
    const subject = document.getElementById('sessionSubject').value.trim();
    if (!subject) {
      window.toastService.show('Please enter a subject or topic', 'error');
      return;
    }

    const date = document.getElementById('sessionDate').value;
    const startTime = document.getElementById('sessionStartTime').value;
    const duration = parseInt(document.getElementById('sessionDuration').value, 10) || 45;
    const notes = document.getElementById('sessionNotes').value.trim();

    const newSession = {
      subject,
      date: date || new Date().toISOString().slice(0, 10),
      startTime: startTime || '12:00',
      duration,
      status: 'scheduled',
      notes
    };

    window.storageService.saveSession(newSession);
    window.toastService.show(`Study session for ${subject} scheduled!`, 'success');
    window.app.closeModal('sessionModal');
    this.render();
    if (window.dashboardManager) window.dashboardManager.render();
  }

  markComplete(sessionId) {
    const completed = window.storageService.completeSession(sessionId);
    if (completed) {
      window.toastService.show(`Session completed! +${completed.duration} mins logged! 🎯`, 'success');
      this.render();
      if (window.dashboardManager) window.dashboardManager.render();
      if (window.analyticsManager) window.analyticsManager.render();
    }
  }

  deleteSession(sessionId) {
    if (confirm('Delete this scheduled study session?')) {
      window.storageService.deleteSession(sessionId);
      window.toastService.show('Session removed', 'warning');
      this.render();
      if (window.dashboardManager) window.dashboardManager.render();
      if (window.analyticsManager) window.analyticsManager.render();
    }
  }

  startPomodoroForSession(sessionId) {
    const session = window.storageService.getSessions().find(s => s.id === sessionId);
    if (session && window.pomodoroTimer) {
      window.pomodoroTimer.selectActiveTask(`Study: ${session.subject}`);
      window.app.navigateTo('pomodoro');
      window.toastService.show(`Focus session started for ${session.subject}`, 'info');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Global instance
window.studyPlanner = new StudyPlanner();
