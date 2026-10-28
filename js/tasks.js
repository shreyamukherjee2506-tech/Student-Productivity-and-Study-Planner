/**
 * StudyFlow - Task Manager Module
 * Handles task rendering, filtering, sorting, CRUD actions,
 * form validation, and status updates.
 */

class TaskManager {
  constructor() {
    this.currentStatusFilter = 'all';
    this.currentPriorityFilter = 'all';
    this.currentSubjectFilter = 'all';
    this.searchQuery = '';
    this.currentSort = 'dueDate-asc';
    this.editingTaskId = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Status Filter Pills
    const statusPills = document.querySelectorAll('.task-filter-pill');
    statusPills.forEach(pill => {
      pill.addEventListener('click', () => {
        statusPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentStatusFilter = pill.dataset.status;
        this.render();
      });
    });

    // Priority Filter Select
    const prioritySelect = document.getElementById('taskPriorityFilter');
    if (prioritySelect) {
      prioritySelect.addEventListener('change', (e) => {
        this.currentPriorityFilter = e.target.value;
        this.render();
      });
    }

    // Subject Filter Select
    const subjectSelect = document.getElementById('taskSubjectFilter');
    if (subjectSelect) {
      subjectSelect.addEventListener('change', (e) => {
        this.currentSubjectFilter = e.target.value;
        this.render();
      });
    }

    // Sort Select
    const sortSelect = document.getElementById('taskSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.render();
      });
    }

    // Search Input with debounce
    const searchInput = document.getElementById('taskSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // New Task Form Submission
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // Listen for storage updates
    window.addEventListener('studyflow:data-updated', () => {
      this.populateSubjectOptions();
      this.render();
    });
  }

  getFilteredTasks() {
    let tasks = window.storageService.getTasks();

    // 1. Status Filter
    if (this.currentStatusFilter !== 'all') {
      tasks = tasks.filter(t => t.status === this.currentStatusFilter);
    }

    // 2. Priority Filter
    if (this.currentPriorityFilter !== 'all') {
      tasks = tasks.filter(t => t.priority === this.currentPriorityFilter);
    }

    // 3. Subject Filter
    if (this.currentSubjectFilter !== 'all') {
      tasks = tasks.filter(t => t.subject === this.currentSubjectFilter);
    }

    // 4. Search Filter
    if (this.searchQuery) {
      tasks = tasks.filter(t =>
        (t.title && t.title.toLowerCase().includes(this.searchQuery)) ||
        (t.subject && t.subject.toLowerCase().includes(this.searchQuery)) ||
        (t.notes && t.notes.toLowerCase().includes(this.searchQuery))
      );
    }

    // 5. Sorting
    const priorityWeights = { high: 3, medium: 2, low: 1 };
    tasks.sort((a, b) => {
      if (this.currentSort === 'dueDate-asc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (this.currentSort === 'dueDate-desc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate) - new Date(a.dueDate);
      } else if (this.currentSort === 'priority-desc') {
        return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      } else if (this.currentSort === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return tasks;
  }

  render() {
    const taskListEl = document.getElementById('tasksListContainer');
    if (!taskListEl) return;

    const filtered = this.getFilteredTasks();

    // Update active tasks counter badge
    const pendingTasks = window.storageService.getTasks().filter(t => t.status !== 'completed');
    const badgeEl = document.getElementById('sidebarTasksBadge');
    if (badgeEl) {
      badgeEl.textContent = pendingTasks.length;
    }

    if (filtered.length === 0) {
      taskListEl.innerHTML = `
        <div class="card empty-state">
          <div class="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h4 class="empty-state-title">No tasks found</h4>
          <p class="empty-state-description">Try adjusting your filters or search keywords, or add a new study task.</p>
          <button class="btn btn-primary" onclick="window.taskManager.openCreateModal()">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create First Task
          </button>
        </div>
      `;
      return;
    }

    taskListEl.innerHTML = filtered.map(task => this.renderTaskCard(task)).join('');
  }

  renderTaskCard(task) {
    const isCompleted = task.status === 'completed';
    const dueFormatted = this.formatDueDate(task.dueDate);
    const priorityClass = `badge-priority-${task.priority || 'medium'}`;
    const statusClass = `badge-status-${task.status || 'pending'}`;

    return `
      <div class="task-card ${isCompleted ? 'is-completed' : ''}" id="task-${task.id}">
        <div class="task-card-left">
          <label class="custom-checkbox" title="Mark as ${isCompleted ? 'pending' : 'completed'}">
            <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="window.taskManager.toggleStatus('${task.id}')">
            <span class="checkmark"></span>
          </label>
          <div class="task-card-content">
            <div class="task-card-title-row">
              <span class="task-title">${this.escapeHtml(task.title)}</span>
              <span class="badge ${priorityClass}">
                <span class="badge-dot"></span>
                ${this.capitalize(task.priority || 'medium')}
              </span>
              <span class="badge badge-subject">${this.escapeHtml(task.subject || 'General')}</span>
            </div>
            ${task.notes ? `<p class="session-notes" style="margin: 0.35rem 0 0.2rem;">${this.escapeHtml(task.notes)}</p>` : ''}
            <div class="task-card-meta">
              <span class="task-due-info ${dueFormatted.className}">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ${dueFormatted.text}
              </span>
              <span class="badge ${statusClass}">${this.formatStatus(task.status)}</span>
            </div>
          </div>
        </div>

        <div class="task-card-actions">
          <button class="task-action-btn" title="Focus on this task in Pomodoro" onclick="window.taskManager.focusInPomodoro('${task.id}')">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button class="task-action-btn" title="Edit task" onclick="window.taskManager.openEditModal('${task.id}')">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button class="task-action-btn delete-btn" title="Delete task" onclick="window.taskManager.deleteTask('${task.id}')">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  formatDueDate(dateStr) {
    if (!dateStr) return { text: 'No due date', className: '' };
    const due = new Date(dateStr);
    const now = new Date();
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { text: `Overdue (${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`, className: 'is-overdue' };
    }
    if (diffDays === 0 || (now.toDateString() === due.toDateString())) {
      const timeStr = due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { text: `Due Today at ${timeStr}`, className: 'is-today' };
    }
    if (diffDays === 1) {
      return { text: 'Due Tomorrow', className: '' };
    }
    return {
      text: `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      className: ''
    };
  }

  toggleStatus(taskId) {
    const updated = window.storageService.toggleTaskStatus(taskId);
    if (updated) {
      if (updated.status === 'completed') {
        window.toastService.show(`"${updated.title}" marked as complete! 🎉`, 'success');
      } else {
        window.toastService.show(`"${updated.title}" moved to pending`, 'info');
      }
      this.render();
      if (window.dashboardManager) window.dashboardManager.render();
      if (window.analyticsManager) window.analyticsManager.render();
    }
  }

  deleteTask(taskId) {
    const tasks = window.storageService.getTasks();
    const task = tasks.find(t => t.id === taskId);
    const taskTitle = task ? task.title : 'Task';

    if (confirm(`Are you sure you want to delete "${taskTitle}"?`)) {
      window.storageService.deleteTask(taskId);
      window.toastService.show(`Deleted "${taskTitle}"`, 'warning');
      this.render();
      if (window.dashboardManager) window.dashboardManager.render();
      if (window.analyticsManager) window.analyticsManager.render();
    }
  }

  openCreateModal() {
    this.editingTaskId = null;
    const form = document.getElementById('taskForm');
    if (form) form.reset();
    document.getElementById('taskModalTitle').textContent = 'Create New Study Task';
    document.getElementById('taskSubmitBtnText').textContent = 'Add Task';
    
    // Set default due date to tomorrow 18:00
    const tomorrow = new Date(Date.now() + 86400000);
    tomorrow.setHours(18, 0, 0, 0);
    const dateInput = document.getElementById('taskDueDate');
    if (dateInput) {
      dateInput.value = tomorrow.toISOString().slice(0, 16);
    }

    this.populateSubjectOptions();
    window.app.openModal('taskModal');
  }

  openEditModal(taskId) {
    this.editingTaskId = taskId;
    const task = window.storageService.getTasks().find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('taskModalTitle').textContent = 'Edit Study Task';
    document.getElementById('taskSubmitBtnText').textContent = 'Save Changes';

    document.getElementById('taskTitle').value = task.title || '';
    document.getElementById('taskSubject').value = task.subject || '';
    document.getElementById('taskPriority').value = task.priority || 'medium';
    document.getElementById('taskStatus').value = task.status || 'pending';
    document.getElementById('taskDueDate').value = task.dueDate || '';
    document.getElementById('taskNotes').value = task.notes || '';

    this.populateSubjectOptions();
    window.app.openModal('taskModal');
  }

  handleFormSubmit() {
    const titleInput = document.getElementById('taskTitle');
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      window.toastService.show('Please enter a task title', 'error');
      return;
    }

    const subjectInput = document.getElementById('taskSubject');
    const subject = subjectInput.value.trim() || 'General';
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const notes = document.getElementById('taskNotes').value.trim();

    const taskPayload = {
      title,
      subject,
      priority,
      status,
      dueDate,
      notes
    };

    if (this.editingTaskId) {
      taskPayload.id = this.editingTaskId;
      window.storageService.saveTask(taskPayload);
      window.toastService.show('Task updated successfully!', 'success');
    } else {
      window.storageService.saveTask(taskPayload);
      window.toastService.show('New task added!', 'success');
    }

    window.app.closeModal('taskModal');
    this.render();
    if (window.dashboardManager) window.dashboardManager.render();
    if (window.analyticsManager) window.analyticsManager.render();
  }

  focusInPomodoro(taskId) {
    const task = window.storageService.getTasks().find(t => t.id === taskId);
    if (task && window.pomodoroTimer) {
      window.pomodoroTimer.selectActiveTask(task.title);
      window.app.navigateTo('pomodoro');
      window.toastService.show(`Focus session started for: ${task.title}`, 'info');
    }
  }

  populateSubjectOptions() {
    const select = document.getElementById('taskSubjectFilter');
    if (!select) return;

    const tasks = window.storageService.getTasks();
    const subjects = Array.from(new Set(tasks.map(t => t.subject).filter(Boolean)));
    const currentValue = select.value;

    select.innerHTML = `<option value="all">All Subjects</option>`;
    subjects.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      select.appendChild(opt);
    });

    if (subjects.includes(currentValue)) {
      select.value = currentValue;
    }
  }

  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  formatStatus(status) {
    if (status === 'in-progress') return 'In Progress';
    if (status === 'completed') return 'Completed';
    return 'Pending';
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Global instance
window.taskManager = new TaskManager();
