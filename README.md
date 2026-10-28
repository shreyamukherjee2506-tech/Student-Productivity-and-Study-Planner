# StudyFlow — Student Productivity & Study Planner

> A modern, high-aesthetic productivity dashboard and study planner tailored for computer science and data science university students. Built with pure **HTML5**, **CSS3 (Custom Design System)**, and **Vanilla JavaScript (ES6+)**.

---

## 🌟 Key Features

1. **Academic Dashboard**
   - Dynamic time-sensitive greeting ("Good morning / afternoon / evening, [Name] 👋").
   - Live date display and rotating computer science & data science motivational quotes.
   - 4 real-time KPI cards: **Total Tasks**, **Completed Tasks (with % completion rate)**, **Pending Tasks (with high-priority urgent count)**, and **Today's Focus Study Progress (minutes vs daily goal)**.
   - Quick action shortcuts and immediate overview of today's tasks and upcoming study blocks.

2. **Task Manager**
   - Add coursework with **Title**, **Subject / Course tag**, **Priority (High, Medium, Low)**, **Due Date & Time**, **Status**, and optional checklist notes.
   - Edit, delete, and mark tasks as complete with interactive custom checkboxes and instant visual feedback.
   - Multi-dimensional filtering by **Status** (*All, Pending, In Progress, Completed*), **Priority** (*High, Medium, Low*), **Subject**, and **Live Keyword Search**.
   - Flexible sorting by *Due Date (Earliest / Latest)*, *Priority (High to Low)*, and *Title (A-Z)*.
   - Seamless "Focus in Pomodoro" button directly on each task card.

3. **Study Session Planner**
   - Schedule structured study sessions with Subject, Date, Start Time, and Duration (25m, 45m, 60m, 90m, 120m).
   - Display chronological timeline of upcoming sessions with status indicators (*Scheduled* vs *Completed*).
   - "Study Now" button triggers an immediate Pomodoro focus session bound to that subject.
   - "Mark Done" automatically credits the session duration towards your daily focus statistics.

4. **Pomodoro Focus Chamber**
   - Circular SVG animated countdown timer ring with stroke-dashoffset transition.
   - 3 Modes: **Focus (25m)**, **Short Break (5m)**, and **Long Break (15m)**.
   - Real-time controls: **Start**, **Pause**, **Reset**, and **Skip**.
   - In-app task picker to focus on specific coursework.
   - Gentle, synthesized dual-tone completion chime using the native **Web Audio API** (100% offline, zero audio file dependencies).
   - Dynamic browser tab title updating in real time: e.g. `(24:59) Focus | StudyFlow`.

5. **Progress & Analytics**
   - 100% real statistics derived strictly from your saved localStorage data (no disconnected mock data).
   - **Canvas Chart 1**: Interactive Task Completion Ratio Donut Chart.
   - **Canvas Chart 2**: Coursework Distribution Bar Chart by Subject.
   - **Canvas Chart 3**: Weekly Deep Work & Study Minutes Bar Chart (past 7 days).
   - Data-driven academic insight tips based on your actual completion rates and pending deadlines.

6. **Study Notes & Cheatsheets**
   - Create, edit, and delete study notes with subject tags.
   - Pin critical cheatsheets, formulas, and definitions to the top.
   - Real-time instant search by title, subject, or content keywords.

7. **Theme & Settings**
   - Sleek **Dark Theme (Default)** and crisp **Light Theme** toggle with instant transition.
   - Theme preference saved in `localStorage` and automatically loaded on every visit.
   - Student profile customization (Full Name, Major/Specialization, Daily Goal in minutes).
   - Custom Pomodoro timer durations (adjust focus and break lengths).
   - **Data Portability**: One-click **Export as JSON** backup file, **Import from JSON**, **Restore Sample Data**, and **Clear All Data**.

8. **Keyboard Shortcuts**
   - `T` — Create New Task
   - `P` — Jump to Pomodoro Timer
   - `D` — Return to Academic Dashboard
   - `ESC` — Close any open modal dialog
   - `?` — View Keyboard Shortcuts cheatsheet

---

## 📁 Project Structure

```
Student Productivity and Study Planner/
│
├── index.html               # Main semantic HTML structure & SPA views
├── README.md                # Project documentation and guide
│
├── css/
│   ├── variables.css        # Design tokens, color palettes (dark/light), typography, shadows
│   ├── layout.css           # App shell, responsive sidebar, topbar header, grid breakpoints
│   ├── components.css       # Buttons, cards, badges, custom checkboxes, modals, toasts
│   └── pages.css            # Styles for Dashboard, Tasks, Planner, Pomodoro, Analytics, Notes
│
└── js/
    ├── storage.js           # Centralized localStorage manager, CRUD methods, seed data generator
    ├── theme.js             # Dark/Light theme switching & persistence
    ├── tasks.js             # Task Manager logic (CRUD, filtering, sorting, validation)
    ├── planner.js           # Study session scheduling, tracking, and completion
    ├── pomodoro.js          # Countdown timer, circular SVG progress, Web Audio chime
    ├── analytics.js         # Pure HTML5 Canvas charts (Donut, Bar) & progress calculations
    ├── notes.js             # Quick notes & cheatsheet management with pinning
    ├── settings.js          # Profile config, timer settings, JSON import/export
    ├── dashboard.js         # Aggregates KPI cards, greeting, today's schedule, mini-timer
    └── app.js               # App router, modal controller, toast notifications, keyboard shortcuts
```

---

## 🚀 How to Run Locally

Because this project is built using standard HTML5, CSS3, and modern JavaScript without build-step dependencies, you can run it in multiple ways:

### Option 1: Direct File Opening (Easiest)
1. Double-click `index.html` or right-click `index.html` → **Open with** → **Google Chrome**, **Microsoft Edge**, or **Firefox**.
2. That's it! Everything works immediately offline.

### Option 2: Using Python's Built-in HTTP Server (Recommended)
1. Open PowerShell or Terminal in the project directory:
   ```powershell
   cd "c:\Users\shrey\OneDrive\Desktop\Student Productivity and Study Planner"
   ```
2. Start the local server:
   ```bash
   python -m http.server 8080
   ```
3. Open your web browser and visit:
   ```
   http://localhost:8080
   ```

---

## 💾 How Task-Saving & Data Persistence Works

All application data is managed locally in your browser through `localStorage`:

1. **Central Storage Key**: `STUDYFLOW_DATA_v1`
2. **Data Structure**:
   ```json
   {
     "tasks": [
       {
         "id": "task-1714200000000",
         "title": "Implement Dijkstra's Algorithm",
         "subject": "Data Structures & Algorithms",
         "priority": "high",
         "dueDate": "2026-10-28T18:00",
         "status": "pending",
         "notes": "Use heapq min-heap.",
         "createdAt": "2026-10-27T14:00:00.000Z"
       }
     ],
     "sessions": [ ... ],
     "notes": [ ... ],
     "settings": {
       "theme": "dark",
       "studentName": "Alex Rivera",
       "major": "B.Tech CS (Data Science)",
       "dailyGoalMinutes": 120,
       "pomodoro": { "focusDuration": 25, "shortBreak": 5, "longBreak": 15, "soundEnabled": true }
     },
     "stats": {
       "totalFocusMinutes": 75,
       "completedPomodoros": 3,
       "dailyFocusLogs": { "2026-10-27": 50 }
     }
   }
   ```
3. **Reactive Updates**: Whenever any task or session is created, edited, checked off, or deleted, `storageService.saveRawData()` updates `localStorage` and dispatches a custom browser event:
   ```javascript
   window.dispatchEvent(new CustomEvent('studyflow:data-updated'));
   ```
   All components (Dashboard metrics, Task lists, Sidebar badges, and Canvas Analytics) subscribe to this event and instantly synchronize in real time!
4. **Offline & Private**: No data leaves your machine. You can back up your data anytime using the **Export Data as JSON** button in the Settings tab.

---

## 🧪 How to Test the Features

1. **Theme Switcher**:
   - Click the Moon/Sun icon in the top right header to instantly toggle between Dark and Light mode.
   - Refresh the page and confirm your selected theme remains active.
2. **Creating & Managing Tasks**:
   - Press `T` on your keyboard (or click **+ New Task**).
   - Enter a title, choose a subject (or type a custom one like `Machine Learning`), set priority to `High`, and click **Add Task**.
   - Notice the toast confirmation and the sidebar counter badge updating.
   - Click the checkbox to mark the task completed; notice the satisfying strikethrough animation and the dashboard completion rate updating.
   - Use the filter pills (*Pending*, *Completed*) and the search bar to test filtering.
3. **Pomodoro Timer**:
   - Click **Pomodoro Timer** in the sidebar.
   - Select your target task in the dropdown.
   - Click **Start** to watch the countdown and circular progress bar move.
   - Switch to **Short Break** (5m) and test **Reset** or **Skip**.
4. **Study Planner**:
   - Go to **Study Planner** → **Schedule Session**.
   - Add a subject (e.g. `Computer Networks Lab`) for 45 minutes.
   - Click **Study Now** to jump directly to Pomodoro, or **Mark Done** to log 45 minutes to your focus time.
5. **Progress & Analytics**:
   - Open **Progress & Stats**.
   - Check the Donut chart and bar charts. They are drawn live on HTML5 canvas and reflect your actual saved coursework data.
6. **Data Backup & Sample Data**:
   - Go to **Settings & Data** → Click **Export Data as JSON** to download a backup file.
   - Click **Restore Sample Demo Data** to reload clean B.Tech Computer Science demo coursework at any time.
