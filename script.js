/**
 * Student Task Planner - script.js
 * 
 * Premium Vanilla JavaScript task planner with smooth micro-interactions,
 * auto-sorting (closest due date first), filtering, and localStorage persistence.
 */

// =============================================================================
// Constants & Application State
// =============================================================================
const STORAGE_KEY = 'student_task_planner_data';
const THEME_STORAGE_KEY = 'student_task_planner_theme';

// Initial sample data loaded when opening the application for the very first time
const INITIAL_SAMPLE_TASKS = [
  {
    id: 'sample-1',
    title: 'Read Operating Systems Chapters 4-5',
    course: 'CS 301',
    dueDate: '2026-11-12',
    completed: false,
    createdAt: Date.now() - 20000
  },
  {
    id: 'sample-2',
    title: 'Linear Algebra Problem Set 4',
    course: 'MATH 210',
    dueDate: '2026-11-09',
    completed: false,
    createdAt: Date.now() - 10000
  },
  {
    id: 'sample-3',
    title: 'Submit Academic Integrity Acknowledgement',
    course: 'ENG 101',
    dueDate: '2026-10-30',
    completed: true,
    createdAt: Date.now() - 30000
  }
];

let tasks = [];
let currentFilter = 'all'; // 'all' | 'pending' | 'completed'
let lastAddedTaskId = null; // Tracks newly added task for entrance slide-in animation

// =============================================================================
// DOM References
// =============================================================================
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const courseInput = document.getElementById('task-course');
const dateInput = document.getElementById('task-date');
const formError = document.getElementById('form-error');

const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const filterButtons = document.querySelectorAll('.filter-btn');

const countAllEl = document.getElementById('count-all');
const countPendingEl = document.getElementById('count-pending');
const countCompletedEl = document.getElementById('count-completed');

const themeToggleBtn = document.getElementById('theme-toggle');

// =============================================================================
// Local Storage Operations
// =============================================================================
function loadTasks() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData === null) {
      saveTasks(INITIAL_SAMPLE_TASKS);
      return [...INITIAL_SAMPLE_TASKS];
    }
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse localStorage data:', error);
    return [];
  }
}

function saveTasks(tasksToSave = tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// =============================================================================
// Theme Switcher Logic
// =============================================================================
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', activeTheme);
      localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
      updateThemeUI(activeTheme);
    });
  }
}

function updateThemeUI(theme) {
  if (!themeToggleBtn) return;
  const isDark = theme === 'dark';
  const iconEl = themeToggleBtn.querySelector('.theme-icon');
  const textEl = themeToggleBtn.querySelector('.theme-text');
  
  if (iconEl) iconEl.textContent = isDark ? '☀️' : '🌙';
  if (textEl) textEl.textContent = isDark ? 'Light' : 'Dark';
}

// =============================================================================
// Sorting & Filtering Logic
// =============================================================================

/**
 * Filters tasks by active tab and auto-sorts pending tasks
 * so that the closest due date appears at the top.
 */
function getFilteredAndSortedTasks() {
  let filtered = tasks.filter(task => {
    if (currentFilter === 'pending') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true; // 'all'
  });

  filtered.sort((a, b) => {
    // When in 'all' view, pending tasks are prioritized at the top
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Closest due date first (ascending)
    const dateComparison = a.dueDate.localeCompare(b.dueDate);
    if (dateComparison !== 0) {
      return dateComparison;
    }

    // Secondary sort: title alphabetical
    return a.title.localeCompare(b.title);
  });

  return filtered;
}

// =============================================================================
// Date & Display Helpers
// =============================================================================
function formatDate(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, month, day);
  return dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getDeadlineStatus(dateString, isCompleted) {
  if (isCompleted || !dateString) return null;

  const parts = dateString.split('-');
  if (parts.length !== 3) return null;

  const dueDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Overdue', className: 'overdue' };
  } else if (diffDays === 0) {
    return { text: 'Due Today', className: 'today' };
  }
  return null;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateCounters() {
  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  if (countAllEl) countAllEl.textContent = tasks.length;
  if (countPendingEl) countPendingEl.textContent = pendingCount;
  if (countCompletedEl) countCompletedEl.textContent = completedCount;
}

// =============================================================================
// Render Function
// =============================================================================
function render() {
  const visibleTasks = getFilteredAndSortedTasks();
  updateCounters();

  // Toggle empty state
  if (visibleTasks.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.add('is-visible');
    return;
  }

  emptyState.classList.remove('is-visible');

  // Render list items with entrance animation class if newly created
  taskList.innerHTML = visibleTasks.map(task => {
    const formattedDate = formatDate(task.dueDate);
    const deadlineStatus = getDeadlineStatus(task.dueDate, task.completed);
    const statusBadgeHtml = deadlineStatus 
      ? `<span class="task-status-badge ${deadlineStatus.className}">${deadlineStatus.text}</span>` 
      : '';

    const isEntering = (task.id === lastAddedTaskId) ? 'is-entering' : '';

    return `
      <li class="task-item ${task.completed ? 'is-completed' : ''} ${isEntering}" data-id="${task.id}">
        <div class="task-main">
          <label class="task-checkbox-wrap" title="${task.completed ? 'Mark as pending' : 'Mark as completed'}">
            <input 
              type="checkbox" 
              class="task-checkbox" 
              ${task.completed ? 'checked' : ''} 
              aria-label="Mark '${escapeHtml(task.title)}' as completed"
            >
          </label>
          <div class="task-content">
            <span class="task-title">${escapeHtml(task.title)}</span>
            <div class="task-meta">
              <span class="task-tag">${escapeHtml(task.course)}</span>
              <span class="task-date">Due: ${formattedDate}</span>
              ${statusBadgeHtml}
            </div>
          </div>
        </div>
        <button 
          type="button" 
          class="btn-delete" 
          title="Delete assignment"
          aria-label="Delete '${escapeHtml(task.title)}'"
        >
          Delete
        </button>
      </li>
    `;
  }).join('');

  // Clear newly-added reference after render cycle
  if (lastAddedTaskId) {
    setTimeout(() => {
      lastAddedTaskId = null;
    }, 400);
  }
}

// =============================================================================
// Event Handlers with Motion Support
// =============================================================================

/**
 * Handles adding a new task with slide-in animation.
 */
function handleAddTask(event) {
  event.preventDefault();
  formError.textContent = '';

  const title = titleInput.value.trim();
  const course = courseInput.value.trim();
  const dueDate = dateInput.value;

  if (!title || !course || !dueDate) {
    formError.textContent = 'Please fill out all fields (Title, Course, and Due Date).';
    return;
  }

  const newTask = {
    id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    title: title,
    course: course.toUpperCase(),
    dueDate: dueDate,
    completed: false,
    createdAt: Date.now()
  };

  // Flag this task so it receives the .is-entering slide-in animation
  lastAddedTaskId = newTask.id;

  tasks.push(newTask);
  saveTasks();
  render();

  taskForm.reset();
  titleInput.focus();
}

/**
 * Handles toggling completion (animating strikethrough) and deletion (scale-down/fade-out).
 */
function handleListClick(event) {
  const target = event.target;
  const taskItem = target.closest('.task-item');
  if (!taskItem) return;

  const taskId = taskItem.dataset.id;
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;

  // 1. Completion status toggle with smooth left-to-right strikethrough animation
  if (target.classList.contains('task-checkbox')) {
    const isChecked = target.checked;
    tasks[taskIndex].completed = isChecked;
    saveTasks();

    // Toggle .is-completed directly on current DOM element to trigger the CSS strikethrough transition
    taskItem.classList.toggle('is-completed', isChecked);
    updateCounters();

    // Re-render after the strikethrough line has completed its transition
    setTimeout(() => {
      render();
    }, 280);
    return;
  }

  // 2. Delete task with scale-down and fade-out animation
  if (target.classList.contains('btn-delete')) {
    taskItem.classList.add('is-deleting');

    let hasExecuted = false;
    const finalizeDeletion = () => {
      if (hasExecuted) return;
      hasExecuted = true;
      const freshIndex = tasks.findIndex(t => t.id === taskId);
      if (freshIndex !== -1) {
        tasks.splice(freshIndex, 1);
        saveTasks();
        render();
      }
    };

    // Wait for the CSS animation to complete before removing from DOM/state
    taskItem.addEventListener('animationend', finalizeDeletion, { once: true });
    // Safety fallback timeout in case animationend is suppressed
    setTimeout(finalizeDeletion, 320);
    return;
  }
}

/**
 * Handles switching active filter tab ('all', 'pending', 'completed').
 */
function handleFilterChange(event) {
  const button = event.target.closest('.filter-btn');
  if (!button) return;

  const selectedFilter = button.dataset.filter;
  if (!selectedFilter || selectedFilter === currentFilter) return;

  currentFilter = selectedFilter;

  filterButtons.forEach(btn => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  render();
}

// =============================================================================
// Initialization
// =============================================================================
function init() {
  initTheme();
  tasks = loadTasks();

  taskForm.addEventListener('submit', handleAddTask);
  taskList.addEventListener('click', handleListClick);

  const filterContainer = document.querySelector('.filter-group');
  if (filterContainer) {
    filterContainer.addEventListener('click', handleFilterChange);
  }

  render();
}

document.addEventListener('DOMContentLoaded', init);
