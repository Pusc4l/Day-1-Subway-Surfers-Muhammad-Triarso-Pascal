/**
 * Student Task Planner - script.js
 * 
 * A clean, beginner-friendly vanilla JavaScript application to manage
 * university course assignments, deadlines, and completion statuses.
 */

// =============================================================================
// Constants & State
// =============================================================================
const STORAGE_KEY = 'student_task_planner_data';

// Initial sample data loaded only when the user opens the application for the very first time.
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

// In-memory application state
let tasks = [];
let currentFilter = 'all'; // 'all' | 'pending' | 'completed'

// =============================================================================
// DOM Elements
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

// =============================================================================
// Local Storage Operations
// =============================================================================

/**
 * Loads tasks from localStorage.
 * If no stored data exists, populates the planner with sample tasks.
 * Returns an array of task objects.
 */
function loadTasks() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData === null) {
      // First visit: use sample tasks and persist them
      saveTasks(INITIAL_SAMPLE_TASKS);
      return [...INITIAL_SAMPLE_TASKS];
    }
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse tasks from localStorage:', error);
    return [];
  }
}

/**
 * Saves current task array to localStorage.
 */
function saveTasks(tasksToSave = tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

// =============================================================================
// Sorting & Filtering Logic
// =============================================================================

/**
 * Auto-Sorting rule:
 * - Pending tasks appear with the closest due date at the top (ascending order).
 * - When in the 'All' view, pending tasks are prioritized at the top,
 *   followed by completed tasks.
 */
function getFilteredAndSortedTasks() {
  // Step 1: Filter tasks by active tab
  let filtered = tasks.filter(task => {
    if (currentFilter === 'pending') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true; // 'all'
  });

  // Step 2: Auto-Sort
  filtered.sort((a, b) => {
    // If viewing 'All', keep pending tasks at the top
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Both are pending or both are completed: sort by closest due date first (ascending)
    const dateComparison = a.dueDate.localeCompare(b.dueDate);
    if (dateComparison !== 0) {
      return dateComparison;
    }

    // Tie-breaker: sort alphabetically by title
    return a.title.localeCompare(b.title);
  });

  return filtered;
}

// =============================================================================
// Date & Text Helpers
// =============================================================================

/**
 * Formats a "YYYY-MM-DD" string into a clean readable date (e.g. "Nov 9, 2026")
 * without timezone offset errors.
 */
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

/**
 * Computes whether a pending task is overdue or due today.
 */
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

/**
 * Prevents HTML injection by escaping user input.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// =============================================================================
// Render Function
// =============================================================================

/**
 * Re-renders the list of tasks, count badges, and empty state.
 */
function render() {
  const visibleTasks = getFilteredAndSortedTasks();

  // Update counter badges
  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  countAllEl.textContent = tasks.length;
  countPendingEl.textContent = pendingCount;
  countCompletedEl.textContent = completedCount;

  // Toggle empty state
  if (visibleTasks.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.add('is-visible');
    return;
  }

  emptyState.classList.remove('is-visible');

  // Build task items
  taskList.innerHTML = visibleTasks.map(task => {
    const formattedDate = formatDate(task.dueDate);
    const deadlineStatus = getDeadlineStatus(task.dueDate, task.completed);
    const statusBadgeHtml = deadlineStatus 
      ? `<span class="task-status-badge ${deadlineStatus.className}">${deadlineStatus.text}</span>` 
      : '';

    return `
      <li class="task-item ${task.completed ? 'is-completed' : ''}" data-id="${task.id}">
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
}

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handles adding a new task via the form.
 */
function handleAddTask(event) {
  event.preventDefault();
  formError.textContent = '';

  const title = titleInput.value.trim();
  const course = courseInput.value.trim();
  const dueDate = dateInput.value;

  // Basic validation
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

  tasks.push(newTask);
  saveTasks();
  render();

  // Reset form inputs
  taskForm.reset();
  titleInput.focus();
}

/**
 * Handles toggling completion status and deleting a task using event delegation.
 */
function handleListClick(event) {
  const target = event.target;
  const taskItem = target.closest('.task-item');
  if (!taskItem) return;

  const taskId = taskItem.dataset.id;
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;

  // Toggle completion checkbox
  if (target.classList.contains('task-checkbox')) {
    tasks[taskIndex].completed = target.checked;
    saveTasks();
    render();
    return;
  }

  // Delete task button
  if (target.classList.contains('btn-delete')) {
    tasks.splice(taskIndex, 1);
    saveTasks();
    render();
    return;
  }
}

/**
 * Handles switching the active filter tab ('all', 'pending', 'completed').
 */
function handleFilterChange(event) {
  const button = event.target.closest('.filter-btn');
  if (!button) return;

  const selectedFilter = button.dataset.filter;
  if (!selectedFilter || selectedFilter === currentFilter) return;

  currentFilter = selectedFilter;

  // Update active state in UI
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
  // Load initial tasks from storage
  tasks = loadTasks();

  // Attach event listeners
  taskForm.addEventListener('submit', handleAddTask);
  taskList.addEventListener('click', handleListClick);

  const filterContainer = document.querySelector('.filter-group');
  if (filterContainer) {
    filterContainer.addEventListener('click', handleFilterChange);
  }

  // Initial render
  render();
}

// Run application on DOM ready
document.addEventListener('DOMContentLoaded', init);
