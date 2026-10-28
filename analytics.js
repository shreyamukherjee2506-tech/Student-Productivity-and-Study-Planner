/**
 * StudyFlow - Progress Tracker & Analytics Module
 * Calculates real-time statistics from saved localStorage data and renders
 * custom lightweight HTML5 Canvas charts (Donut status chart, Subject distribution bar chart,
 * and Daily focus hours chart) with zero external dependencies.
 */

class AnalyticsManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.render();
    });

    window.addEventListener('studyflow:theme-changed', () => {
      this.render();
    });

    window.addEventListener('studyflow:data-updated', () => {
      this.render();
    });
  }

  render() {
    const tasks = window.storageService.getTasks();
    const stats = window.storageService.getStats();
    const sessions = window.storageService.getSessions();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Update KPI stat counters on progress page
    const rateEl = document.getElementById('analyticsCompletionRate');
    if (rateEl) rateEl.textContent = `${completionRate}%`;

    const totalTimeEl = document.getElementById('analyticsTotalFocus');
    if (totalTimeEl) {
      const hours = ((stats.totalFocusMinutes || 0) / 60).toFixed(1);
      totalTimeEl.textContent = `${hours} hrs`;
    }

    const pomoCountEl = document.getElementById('analyticsPomoCount');
    if (pomoCountEl) pomoCountEl.textContent = stats.completedPomodoros || 0;

    // Render Canvas Charts
    this.drawStatusDonutChart(completedTasks, inProgressTasks, pendingTasks, completionRate);
    this.drawSubjectBarChart(tasks);
    this.drawWeeklyFocusChart(stats.dailyFocusLogs || {});

    // Render Dynamic Insights
    this.renderInsights(tasks, sessions, stats, completionRate);
  }

  getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      textColor: isDark ? '#F3F4F6' : '#0F172A',
      mutedColor: isDark ? '#9CA3AF' : '#64748B',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      emerald: '#10B981',
      amber: '#F59E0B',
      indigo: '#6366F1',
      cyan: '#06B6D4',
      purple: '#8B5CF6'
    };
  }

  // ================= 1. STATUS DONUT CHART =================
  drawStatusDonutChart(completed, inProgress, pending, completionRate) {
    const canvas = document.getElementById('chartStatusDonut');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 340;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const total = completed + inProgress + pending;
    const colors = this.getThemeColors();

    const centerX = width / 2;
    const centerY = height / 2 - 10;
    const outerRadius = Math.min(centerX, centerY) - 20;
    const innerRadius = outerRadius * 0.68;

    if (total === 0) {
      // Empty ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
      ctx.arc(centerX, centerY, innerRadius, 2 * Math.PI, 0, true);
      ctx.fillStyle = colors.gridColor;
      ctx.fill();

      ctx.fillStyle = colors.mutedColor;
      ctx.font = '14px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No tasks yet', centerX, centerY);
      return;
    }

    const segments = [
      { label: 'Completed', value: completed, color: colors.emerald },
      { label: 'In Progress', value: inProgress, color: colors.amber },
      { label: 'Pending', value: pending, color: colors.indigo }
    ];

    let startAngle = -Math.PI / 2;

    segments.forEach(seg => {
      if (seg.value === 0) return;
      const sliceAngle = (seg.value / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      startAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = colors.textColor;
    ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${completionRate}%`, centerX, centerY - 4);

    ctx.fillStyle = colors.mutedColor;
    ctx.font = '11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Completed', centerX, centerY + 18);
  }

  // ================= 2. SUBJECT BAR CHART =================
  drawSubjectBarChart(tasks) {
    const canvas = document.getElementById('chartSubjectsBar');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 340;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);
    const colors = this.getThemeColors();

    // Aggregate tasks count by subject
    const subjectCounts = {};
    tasks.forEach(t => {
      const sub = t.subject || 'General';
      subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
    });

    const entries = Object.entries(subjectCounts).slice(0, 5); // top 5 subjects

    if (entries.length === 0) {
      ctx.fillStyle = colors.mutedColor;
      ctx.font = '14px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add tasks to see subject distribution', width / 2, height / 2);
      return;
    }

    const maxCount = Math.max(...entries.map(e => e[1]), 1);
    const paddingLeft = 110;
    const paddingRight = 40;
    const chartWidth = width - paddingLeft - paddingRight;
    const barHeight = 22;
    const gap = 16;
    const startY = 24;

    entries.forEach(([subject, count], index) => {
      const y = startY + index * (barHeight + gap);
      const barLength = Math.max((count / maxCount) * chartWidth, 12);

      // Label (Subject)
      ctx.fillStyle = colors.textColor;
      ctx.font = '12px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Truncate if long
      let displaySubject = subject;
      if (displaySubject.length > 14) {
        displaySubject = displaySubject.slice(0, 13) + '…';
      }
      ctx.fillText(displaySubject, paddingLeft - 10, y + barHeight / 2);

      // Bar Background Slot
      ctx.fillStyle = colors.gridColor;
      this.roundRect(ctx, paddingLeft, y, chartWidth, barHeight, 4);
      ctx.fill();

      // Filled Bar
      const gradient = ctx.createLinearGradient(paddingLeft, 0, paddingLeft + barLength, 0);
      gradient.addColorStop(0, colors.indigo);
      gradient.addColorStop(1, colors.cyan);
      ctx.fillStyle = gradient;
      this.roundRect(ctx, paddingLeft, y, barLength, barHeight, 4);
      ctx.fill();

      // Count value
      ctx.fillStyle = colors.mutedColor;
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${count}`, paddingLeft + barLength + 8, y + barHeight / 2);
    });
  }

  // ================= 3. DAILY FOCUS BAR CHART =================
  drawWeeklyFocusChart(dailyLogs) {
    const canvas = document.getElementById('chartWeeklyFocus');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 340;
    const height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);
    const colors = this.getThemeColors();

    // Generate past 7 days labels
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'narrow' });
      days.push({
        date: key,
        label: dayLabel,
        minutes: dailyLogs[key] || 0
      });
    }

    const maxMinutes = Math.max(...days.map(d => d.minutes), 60);
    const paddingBottom = 35;
    const paddingTop = 25;
    const paddingLeft = 35;
    const paddingRight = 20;

    const chartHeight = height - paddingTop - paddingBottom;
    const chartWidth = width - paddingLeft - paddingRight;
    const colWidth = chartWidth / days.length;
    const barWidth = Math.min(colWidth * 0.55, 32);

    // Draw baseline
    ctx.strokeStyle = colors.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, height - paddingBottom);
    ctx.lineTo(width - paddingRight, height - paddingBottom);
    ctx.stroke();

    days.forEach((day, i) => {
      const x = paddingLeft + i * colWidth + (colWidth - barWidth) / 2;
      const barH = Math.max((day.minutes / maxMinutes) * chartHeight, 4);
      const y = height - paddingBottom - barH;

      // Bar
      const grad = ctx.createLinearGradient(0, y, 0, height - paddingBottom);
      grad.addColorStop(0, colors.emerald);
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.25)');
      ctx.fillStyle = grad;
      this.roundRect(ctx, x, y, barWidth, barH, 4);
      ctx.fill();

      // Day Label
      ctx.fillStyle = colors.mutedColor;
      ctx.font = '11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(day.label, x + barWidth / 2, height - paddingBottom + 16);

      // Value if > 0
      if (day.minutes > 0) {
        ctx.fillStyle = colors.textColor;
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.fillText(`${day.minutes}m`, x + barWidth / 2, y - 6);
      }
    });
  }

  renderInsights(tasks, sessions, stats, rate) {
    const listEl = document.getElementById('analyticsInsightsList');
    if (!listEl) return;

    const highPriorityPending = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    const scheduledSessions = sessions.filter(s => s.status === 'scheduled').length;

    const items = [];

    if (rate >= 80) {
      items.push(`Outstanding consistency! You've completed <strong>${rate}%</strong> of all assigned tasks.`);
    } else if (rate >= 50) {
      items.push(`Solid momentum: <strong>${rate}%</strong> completion rate. A quick Pomodoro session could boost it higher.`);
    } else {
      items.push(`You currently have pending coursework to tackle. Try breaking big tasks into smaller 25-minute study sprints.`);
    }

    if (highPriorityPending > 0) {
      items.push(`You have <strong>${highPriorityPending} urgent priority</strong> task(s) awaiting completion.`);
    } else {
      items.push(`Zero high-priority bottlenecks! All urgent deadlines are cleared.`);
    }

    if (scheduledSessions > 0) {
      items.push(`You have <strong>${scheduledSessions} scheduled study session(s)</strong> lined up.`);
    } else {
      items.push(`No study sessions booked. Schedule a focused study block in the Study Planner.`);
    }

    if (stats.totalFocusMinutes > 0) {
      items.push(`Total deep work logged: <strong>${stats.totalFocusMinutes} minutes</strong> across <strong>${stats.completedPomodoros || 0} Pomodoro sessions</strong>.`);
    }

    listEl.innerHTML = items.map(text => `
      <li class="insights-item">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>${text}</span>
      </li>
    `).join('');
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// Global instance
window.analyticsManager = new AnalyticsManager();
