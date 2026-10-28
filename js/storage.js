/**
 * StudyFlow - Storage Module
 * Centralized localStorage data layer with sample data seeding,
 * full CRUD for tasks, study sessions, notes, settings, and focus stats.
 */

const STORAGE_KEY = 'STUDYFLOW_DATA_v1';

// Seed initial sample data for 2nd Year B.Tech CS (Data Science)
const SAMPLE_DATA = {
  tasks: [
    {
      id: 'task-101',
      title: "Implement Dijkstra's Algorithm in Python",
      subject: 'Data Structures & Algorithms',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // Tomorrow
      status: 'pending',
      notes: 'Use priority queue (heapq) and adjacency list representation.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-102',
      title: 'Gradient Descent & Loss Functions Assignment',
      subject: 'Machine Learning',
      priority: 'high',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16), // In 2 days
      status: 'in-progress',
      notes: 'Complete derivation of MSE gradient with respect to weights and bias.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-103',
      title: 'Process Synchronization & Semaphore Lab Report',
      subject: 'Operating Systems',
      priority: 'medium',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16),
      status: 'pending',
      notes: 'Document solution for Producer-Consumer problem using POSIX semaphores.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-104',
      title: 'Eigenvalues and Matrix Decomposition Review',
      subject: 'Linear Algebra',
      priority: 'low',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 16),
      status: 'completed',
      notes: 'Reviewed SVD and PCA conceptual relationships.',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'task-105',
      title: 'TCP vs UDP Socket Programming Quiz Prep',
      subject: 'Computer Networks',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 16),
      status: 'pending',
      notes: 'Study 3-way handshake and congestion control window mechanics.',
      createdAt: new Date().toISOString()
    }
  ],
  sessions: [
    {
      id: 'sess-201',
      subject: 'Machine Learning',
      date: new Date().toISOString().slice(0, 10), // Today
      startTime: '17:00',
      duration: 60, // minutes
      status: 'scheduled',
      notes: 'Supervised vs Unsupervised learning models and Scikit-learn pipeline.'
    },
    {
      id: 'sess-202',
      subject: 'Data Structures & Algorithms',
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // Tomorrow
      startTime: '10:00',
      duration: 90,
      status: 'scheduled',
      notes: 'Graph traversal problems on LeetCode: BFS & DFS.'
    },
    {
      id: 'sess-203',
      subject: 'Operating Systems',
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), // Yesterday
      startTime: '15:00',
      duration: 45,
      status: 'completed',
      notes: 'Deadlock detection algorithms and Banker\'s algorithm.'
    }
  ],
  notes: [
    {
      id: 'note-301',
      title: 'Time & Space Complexities Reference',
      subject: 'Data Structures & Algorithms',
      content: 'Binary Search: O(log n)\nMerge Sort: O(n log n) time, O(n) space\nQuick Sort: Avg O(n log n), Worst O(n^2)\nHeapify: O(n)\nDijkstra with min-heap: O((V + E) log V)',
      isPinned: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'note-302',
      title: 'Common Loss Functions in Machine Learning',
      subject: 'Machine Learning',
      content: '1. Mean Squared Error (MSE): L = 1/n * sum((y - y_hat)^2) - Sensitive to outliers\n2. Binary Cross-Entropy: -[y log(p) + (1-y) log(1-p)]\n3. Hinge Loss: Used for Support Vector Machines (max(0, 1 - y*f(x)))',
      isPinned: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'note-303',
      title: 'OS Process States & Context Switching',
      subject: 'Operating Systems',
      content: 'States: New -> Ready <-> Running -> Terminated (or Waiting/Blocked on I/O).\nPCB (Process Control Block) saves: PID, Program Counter, CPU registers, Memory management info.',
      isPinned: false,
      updatedAt: new Date().toISOString()
    }
  ],
  settings: {
    theme: 'dark',
    studentName: 'Alex Rivera',
    major: 'B.Tech CS (Data Science)',
    dailyGoalMinutes: 120,
    pomodoro: {
      focusDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      soundEnabled: true
    }
  },
  stats: {
    totalFocusMinutes: 75,
    completedPomodoros: 3,
    dailyFocusLogs: {}
  }
};

// Initialize today's stat in sample data
const todayStr = new Date().toISOString().slice(0, 10);
SAMPLE_DATA.stats.dailyFocusLogs[todayStr] = 50;

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        this.saveRawData(SAMPLE_DATA);
      }
    } catch (e) {
      console.warn('LocalStorage error during init:', e);
    }
  }

  getRawData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveRawData(SAMPLE_DATA);
        return SAMPLE_DATA;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse storage data:', e);
      return SAMPLE_DATA;
    }
  }

  saveRawData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('studyflow:data-updated'));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // ================= TASKS CRUD =================
  getTasks() {
    const data = this.getRawData();
    return data.tasks || [];
  }

  saveTask(task) {
    const data = this.getRawData();
    if (!task.id) {
      task.id = 'task-' + Date.now();
      task.createdAt = new Date().toISOString();
      data.tasks.unshift(task);
    } else {
      const index = data.tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        data.tasks[index] = { ...data.tasks[index], ...task, updatedAt: new Date().toISOString() };
      } else {
        data.tasks.unshift(task);
      }
    }
    this.saveRawData(data);
    return task;
  }

  deleteTask(id) {
    const data = this.getRawData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    this.saveRawData(data);
  }

  toggleTaskStatus(id) {
    const data = this.getRawData();
    const task = data.tasks.find(t => t.id === id);
    if (task) {
      task.status = task.status === 'completed' ? 'pending' : 'completed';
      task.completedAt = task.status === 'completed' ? new Date().toISOString() : null;
      this.saveRawData(data);
      return task;
    }
    return null;
  }

  // ================= STUDY SESSIONS CRUD =================
  getSessions() {
    const data = this.getRawData();
    return data.sessions || [];
  }

  saveSession(session) {
    const data = this.getRawData();
    if (!session.id) {
      session.id = 'sess-' + Date.now();
      session.createdAt = new Date().toISOString();
      data.sessions.unshift(session);
    } else {
      const index = data.sessions.findIndex(s => s.id === session.id);
      if (index !== -1) {
        data.sessions[index] = { ...data.sessions[index], ...session };
      } else {
        data.sessions.unshift(session);
      }
    }
    this.saveRawData(data);
    return session;
  }

  deleteSession(id) {
    const data = this.getRawData();
    data.sessions = data.sessions.filter(s => s.id !== id);
    this.saveRawData(data);
  }

  completeSession(id) {
    const data = this.getRawData();
    const session = data.sessions.find(s => s.id === id);
    if (session) {
      session.status = 'completed';
      // Automatically credit session duration to focus time
      const dur = parseInt(session.duration, 10) || 0;
      if (dur > 0) {
        this.addFocusMinutes(dur);
      }
      this.saveRawData(data);
      return session;
    }
    return null;
  }

  // ================= NOTES CRUD =================
  getNotes() {
    const data = this.getRawData();
    return (data.notes || []).sort((a, b) => {
      if (a.isPinned === b.isPinned) {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      }
      return a.isPinned ? -1 : 1;
    });
  }

  saveNote(note) {
    const data = this.getRawData();
    if (!note.id) {
      note.id = 'note-' + Date.now();
      note.createdAt = new Date().toISOString();
      note.updatedAt = new Date().toISOString();
      data.notes.unshift(note);
    } else {
      const index = data.notes.findIndex(n => n.id === note.id);
      if (index !== -1) {
        data.notes[index] = { ...data.notes[index], ...note, updatedAt: new Date().toISOString() };
      } else {
        data.notes.unshift(note);
      }
    }
    this.saveRawData(data);
    return note;
  }

  deleteNote(id) {
    const data = this.getRawData();
    data.notes = data.notes.filter(n => n.id !== id);
    this.saveRawData(data);
  }

  toggleNotePin(id) {
    const data = this.getRawData();
    const note = data.notes.find(n => n.id === id);
    if (note) {
      note.isPinned = !note.isPinned;
      this.saveRawData(data);
      return note;
    }
    return null;
  }

  // ================= SETTINGS =================
  getSettings() {
    const data = this.getRawData();
    return data.settings || SAMPLE_DATA.settings;
  }

  saveSettings(newSettings) {
    const data = this.getRawData();
    data.settings = { ...data.settings, ...newSettings };
    this.saveRawData(data);
    return data.settings;
  }

  // ================= FOCUS / STATS =================
  getStats() {
    const data = this.getRawData();
    return data.stats || { totalFocusMinutes: 0, completedPomodoros: 0, dailyFocusLogs: {} };
  }

  addFocusMinutes(minutes) {
    const data = this.getRawData();
    if (!data.stats) {
      data.stats = { totalFocusMinutes: 0, completedPomodoros: 0, dailyFocusLogs: {} };
    }
    data.stats.totalFocusMinutes = (data.stats.totalFocusMinutes || 0) + minutes;
    const today = new Date().toISOString().slice(0, 10);
    if (!data.stats.dailyFocusLogs) {
      data.stats.dailyFocusLogs = {};
    }
    data.stats.dailyFocusLogs[today] = (data.stats.dailyFocusLogs[today] || 0) + minutes;
    this.saveRawData(data);
  }

  incrementPomodoroCount() {
    const data = this.getRawData();
    if (!data.stats) {
      data.stats = { totalFocusMinutes: 0, completedPomodoros: 0, dailyFocusLogs: {} };
    }
    data.stats.completedPomodoros = (data.stats.completedPomodoros || 0) + 1;
    this.saveRawData(data);
  }

  // ================= BACKUP & RESTORE =================
  exportJSON() {
    const data = this.getRawData();
    return JSON.stringify(data, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid JSON format');
      }
      this.saveRawData(parsed);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  resetToSampleData() {
    this.saveRawData(JSON.parse(JSON.stringify(SAMPLE_DATA)));
  }

  clearAllData() {
    const emptyState = {
      tasks: [],
      sessions: [],
      notes: [],
      settings: this.getSettings(),
      stats: { totalFocusMinutes: 0, completedPomodoros: 0, dailyFocusLogs: {} }
    };
    this.saveRawData(emptyState);
  }
}

// Global instance
window.storageService = new StorageService();
