/**
 * StudyFlow - Notes Module
 * Allows students to write, edit, delete, pin, and search study notes & cheatsheets.
 */

class NotesManager {
  constructor() {
    this.searchQuery = '';
    this.editingNoteId = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('notesSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Note form
    const noteForm = document.getElementById('noteForm');
    if (noteForm) {
      noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    window.addEventListener('studyflow:data-updated', () => {
      this.render();
    });
  }

  render() {
    const grid = document.getElementById('notesGridContainer');
    if (!grid) return;

    let notes = window.storageService.getNotes();

    if (this.searchQuery) {
      notes = notes.filter(n =>
        (n.title && n.title.toLowerCase().includes(this.searchQuery)) ||
        (n.subject && n.subject.toLowerCase().includes(this.searchQuery)) ||
        (n.content && n.content.toLowerCase().includes(this.searchQuery))
      );
    }

    if (notes.length === 0) {
      grid.innerHTML = `
        <div class="card empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h4 class="empty-state-title">No notes found</h4>
          <p class="empty-state-description">Capture lecture notes, formulas, code snippets, or key definitions.</p>
          <button class="btn btn-primary" onclick="window.notesManager.openCreateModal()">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create First Note
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = notes.map(note => this.renderNoteCard(note)).join('');
  }

  renderNoteCard(note) {
    const isPinned = !!note.isPinned;
    const dateFormatted = new Date(note.updatedAt || note.createdAt || Date.now()).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });

    return `
      <div class="note-card ${isPinned ? 'is-pinned' : ''}" id="note-${note.id}">
        <div class="note-card-top">
          <span class="badge badge-subject">${this.escapeHtml(note.subject || 'General')}</span>
          <button class="note-pin-btn" title="${isPinned ? 'Unpin note' : 'Pin note to top'}" onclick="window.notesManager.togglePin('${note.id}')">
            <svg width="18" height="18" fill="${isPinned ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        <h4 class="note-title">${this.escapeHtml(note.title)}</h4>
        <div class="note-body">${this.escapeHtml(note.content)}</div>

        <div class="note-footer">
          <span>${dateFormatted}</span>
          <div class="note-actions">
            <button class="task-action-btn" title="Edit note" onclick="window.notesManager.openEditModal('${note.id}')">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button class="task-action-btn delete-btn" title="Delete note" onclick="window.notesManager.deleteNote('${note.id}')">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  openCreateModal() {
    this.editingNoteId = null;
    const form = document.getElementById('noteForm');
    if (form) form.reset();
    document.getElementById('noteModalTitle').textContent = 'Create Study Note';
    window.app.openModal('noteModal');
  }

  openEditModal(noteId) {
    this.editingNoteId = noteId;
    const note = window.storageService.getNotes().find(n => n.id === noteId);
    if (!note) return;

    document.getElementById('noteModalTitle').textContent = 'Edit Note';
    document.getElementById('noteTitle').value = note.title || '';
    document.getElementById('noteSubject').value = note.subject || '';
    document.getElementById('noteContent').value = note.content || '';
    window.app.openModal('noteModal');
  }

  handleFormSubmit() {
    const title = document.getElementById('noteTitle').value.trim();
    if (!title) {
      window.toastService.show('Please enter a note title', 'error');
      return;
    }

    const subject = document.getElementById('noteSubject').value.trim() || 'General';
    const content = document.getElementById('noteContent').value.trim();

    const notePayload = {
      title,
      subject,
      content
    };

    if (this.editingNoteId) {
      notePayload.id = this.editingNoteId;
      window.storageService.saveNote(notePayload);
      window.toastService.show('Note updated!', 'success');
    } else {
      window.storageService.saveNote(notePayload);
      window.toastService.show('Note saved!', 'success');
    }

    window.app.closeModal('noteModal');
    this.render();
  }

  togglePin(noteId) {
    const note = window.storageService.toggleNotePin(noteId);
    if (note) {
      window.toastService.show(note.isPinned ? 'Note pinned to top 📌' : 'Note unpinned', 'info');
      this.render();
    }
  }

  deleteNote(noteId) {
    if (confirm('Delete this note permanently?')) {
      window.storageService.deleteNote(noteId);
      window.toastService.show('Note deleted', 'warning');
      this.render();
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
window.notesManager = new NotesManager();
