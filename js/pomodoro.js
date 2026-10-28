/**
 * StudyFlow - Pomodoro Timer Module
 * Handles countdown timer logic, circular SVG progress animation,
 * audio chime synthesis via Web Audio API, mode switching,
 * focus task binding, and session stats logging.
 */

class PomodoroTimer {
  constructor() {
    this.mode = 'focus'; // 'focus' | 'shortBreak' | 'longBreak'
    this.totalSeconds = 25 * 60;
    this.remainingSeconds = 25 * 60;
    this.timerInterval = null;
    this.isRunning = false;
    this.cycleCount = 1;
    this.activeTask = '';

    // Circle circumference for r=120
    this.radius = 120;
    this.circumference = 2 * Math.PI * this.radius;

    this.init();
  }

  init() {
    this.loadSettings();
    this.bindEvents();
    this.updateDisplay();
    this.populateTaskSelector();

    // Re-load settings if updated
    window.addEventListener('studyflow:data-updated', () => {
      this.loadSettings();
      this.populateTaskSelector();
      this.updateStatsDisplay();
    });
  }

  loadSettings() {
    const settings = window.storageService.getSettings();
    const pomo = settings.pomodoro || { focusDuration: 25, shortBreak: 5, longBreak: 15, soundEnabled: true };
    this.durations = {
      focus: (parseInt(pomo.focusDuration, 10) || 25) * 60,
      shortBreak: (parseInt(pomo.shortBreak, 10) || 5) * 60,
      longBreak: (parseInt(pomo.longBreak, 10) || 15) * 60
    };
    this.soundEnabled = pomo.soundEnabled !== false;

    // If timer is not running, update current mode's duration
    if (!this.isRunning) {
      this.totalSeconds = this.durations[this.mode];
      this.remainingSeconds = this.totalSeconds;
      this.updateDisplay();
    }
  }

  bindEvents() {
    // Mode Switch Buttons
    const modeBtns = document.querySelectorAll('.pomodoro-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetMode = btn.dataset.pomoMode;
        this.switchMode(targetMode);
      });
    });

    // Controls
    const startPauseBtn = document.getElementById('pomoStartPauseBtn');
    if (startPauseBtn) {
      startPauseBtn.addEventListener('click', () => {
        this.toggleStartPause();
      });
    }

    const resetBtn = document.getElementById('pomoResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetTimer();
      });
    }

    const skipBtn = document.getElementById('pomoSkipBtn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.skipMode();
      });
    }

    // Task selector change
    const taskSelect = document.getElementById('pomoTaskSelect');
    if (taskSelect) {
      taskSelect.addEventListener('change', (e) => {
        this.activeTask = e.target.value;
      });
    }
  }

  switchMode(targetMode) {
    this.pause();
    this.mode = targetMode;

    // Update active mode buttons
    document.querySelectorAll('.pomodoro-mode-btn').forEach(btn => {
      if (btn.dataset.pomoMode === targetMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update circle progress color based on mode
    const progressCircle = document.getElementById('timerCircleProgress');
    if (progressCircle) {
      if (targetMode === 'focus') {
        progressCircle.style.stroke = 'var(--primary-500)';
      } else if (targetMode === 'shortBreak') {
        progressCircle.style.stroke = 'var(--accent-emerald)';
      } else {
        progressCircle.style.stroke = 'var(--accent-cyan)';
      }
    }

    const modeLabels = { focus: 'Focus Session', shortBreak: 'Short Break', longBreak: 'Long Break' };
    const labelEl = document.getElementById('timerModeLabel');
    if (labelEl) labelEl.textContent = modeLabels[targetMode];

    this.totalSeconds = this.durations[targetMode];
    this.remainingSeconds = this.totalSeconds;
    this.updateDisplay();
  }

  toggleStartPause() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.updateStartPauseBtn();

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.updateStartPauseBtn();
  }

  resetTimer() {
    this.pause();
    this.remainingSeconds = this.durations[this.mode];
    this.updateDisplay();
  }

  skipMode() {
    this.pause();
    if (this.mode === 'focus') {
      if (this.cycleCount % 4 === 0) {
        this.switchMode('longBreak');
      } else {
        this.switchMode('shortBreak');
      }
    } else {
      this.cycleCount++;
      this.switchMode('focus');
    }
  }

  tick() {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds--;
      this.updateDisplay();
    } else {
      this.timerCompleted();
    }
  }

  timerCompleted() {
    this.pause();
    this.playChime();

    if (this.mode === 'focus') {
      // Completed a focus session!
      const minutesSpent = Math.round(this.durations.focus / 60);
      window.storageService.addFocusMinutes(minutesSpent);
      window.storageService.incrementPomodoroCount();

      window.toastService.show(`Focus session complete! 🎉 Logged ${minutesSpent} mins! Take a break.`, 'success');

      // Check if long break or short break
      if (this.cycleCount % 4 === 0) {
        this.switchMode('longBreak');
      } else {
        this.switchMode('shortBreak');
      }
    } else {
      window.toastService.show('Break finished! Ready to focus again? 🚀', 'info');
      this.cycleCount++;
      this.switchMode('focus');
    }

    this.updateStatsDisplay();
    if (window.dashboardManager) window.dashboardManager.render();
    if (window.analyticsManager) window.analyticsManager.render();
  }

  updateDisplay() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Update main display
    const timeEl = document.getElementById('timerTimeText');
    if (timeEl) timeEl.textContent = timeFormatted;

    // Update dashboard mini display if present
    const miniTimeEl = document.getElementById('dashMiniPomoTime');
    if (miniTimeEl) miniTimeEl.textContent = timeFormatted;

    // Update browser tab document title
    const modeName = this.mode === 'focus' ? 'Focus' : 'Break';
    document.title = `(${timeFormatted}) ${modeName} | StudyFlow`;

    // Update circular progress stroke-dashoffset
    const progressCircle = document.getElementById('timerCircleProgress');
    if (progressCircle) {
      const progressFraction = (this.totalSeconds - this.remainingSeconds) / this.totalSeconds;
      const offset = this.circumference - (progressFraction * this.circumference);
      progressCircle.style.strokeDashoffset = offset;
    }
  }

  updateStartPauseBtn() {
    const btn = document.getElementById('pomoStartPauseBtn');
    if (!btn) return;

    if (this.isRunning) {
      btn.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
        Pause
      `;
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
    } else {
      btn.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        Start
      `;
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-secondary');
    }
  }

  selectActiveTask(taskTitle) {
    this.activeTask = taskTitle;
    const taskSelect = document.getElementById('pomoTaskSelect');
    if (taskSelect) {
      taskSelect.value = taskTitle;
    }
  }

  populateTaskSelector() {
    const taskSelect = document.getElementById('pomoTaskSelect');
    if (!taskSelect) return;

    const tasks = window.storageService.getTasks().filter(t => t.status !== 'completed');
    taskSelect.innerHTML = `<option value="">-- General Study Session --</option>`;

    tasks.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.title;
      opt.textContent = `[${t.subject || 'General'}] ${t.title}`;
      taskSelect.appendChild(opt);
    });

    if (this.activeTask) {
      taskSelect.value = this.activeTask;
    }
  }

  updateStatsDisplay() {
    const stats = window.storageService.getStats();
    const pomoCountEl = document.getElementById('pomoCompletedCount');
    if (pomoCountEl) pomoCountEl.textContent = stats.completedPomodoros || 0;

    const pomoTotalMinEl = document.getElementById('pomoTotalMinutes');
    if (pomoTotalMinEl) pomoTotalMinEl.textContent = `${stats.totalFocusMinutes || 0}m`;

    const pomoCycleEl = document.getElementById('pomoCycleCount');
    if (pomoCycleEl) pomoCycleEl.textContent = `Round ${this.cycleCount}`;
  }

  playChime() {
    if (!this.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      
      // Gentle dual-tone chime (880Hz then 1320Hz)
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      playTone(523.25, 0, 0.4);   // C5
      playTone(659.25, 0.15, 0.4); // E5
      playTone(783.99, 0.3, 0.7);  // G5
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }
}

// Global instance
window.pomodoroTimer = new PomodoroTimer();
