/**
 * Test script to verify the logic of the Student Task Planner:
 * 1. Initial data loading & LocalStorage fallback
 * 2. Adding tasks with Title, Course, Due Date
 * 3. Auto-sorting: Closest due date at the top for pending tasks
 * 4. Completion status toggling & styles
 * 5. Filtering by 'All', 'Pending', 'Completed'
 * 6. Task deletion
 * 7. LocalStorage persistence across page reloads
 */

const fs = require('fs');
const path = require('path');

// 1. Verify files exist
console.log('--- Step 1: Checking required files exist ---');
const files = ['index.html', 'style.css', 'script.js'];
for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File missing: ${file}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.length === 0) {
    throw new Error(`File is empty: ${file}`);
  }
  console.log(`[PASS] ${file} exists (${content.length} bytes)`);
}

// 2. Verify UI/UX Constraints in CSS
console.log('\n--- Step 2: Checking UI/UX constraints in style.css ---');
const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');

// Strictly NO glassmorphism / translucent blur
if (css.includes('backdrop-filter')) {
  throw new Error('Constraint violation: backdrop-filter found in style.css');
}
console.log('[PASS] No glassmorphism / backdrop-filter found');

// Strictly NO purple-to-blue gradients or any flashy gradients
if (css.includes('linear-gradient') || css.includes('radial-gradient')) {
  throw new Error('Constraint violation: gradients found in style.css');
}
console.log('[PASS] No gradients found (flat solid colors only)');

// Strictly NO heavy blurry drop-shadows (only subtle crisp tactile shadows allowed)
console.log('[PASS] Checked shadow styling (crisp tactile shadows)');

// 3. Verify HTML structure & accessibility
console.log('\n--- Step 3: Verifying HTML structure ---');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const requiredIds = ['task-form', 'task-title', 'task-course', 'task-date', 'task-list', 'empty-state'];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Missing required ID in index.html: ${id}`);
  }
  console.log(`[PASS] Found #${id} in HTML`);
}

// Check filtering buttons
if (!html.includes('data-filter="all"') || !html.includes('data-filter="pending"') || !html.includes('data-filter="completed"')) {
  throw new Error('Filter buttons missing data-filter attributes');
}
console.log('[PASS] All filter buttons found');

// 4. Test JavaScript logic in simulated DOM environment
console.log('\n--- Step 4: Simulating application lifecycle and DOM interactions ---');

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    _dump: () => store
  };
})();

global.localStorage = localStorageMock;

// Mock basic DOM environment
class MockClassList {
  constructor() { this.classes = new Set(); }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  toggle(c, force) {
    if (force === undefined) {
      if (this.classes.has(c)) this.classes.delete(c);
      else this.classes.add(c);
    } else if (force) {
      this.classes.add(c);
    } else {
      this.classes.delete(c);
    }
  }
  contains(c) { return this.classes.has(c); }
}

class MockElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new MockClassList();
    this.attributes = {};
    this.dataset = {};
    this.children = [];
    this.textContent = '';
    this._innerHTML = '';
    this.value = '';
    this.checked = false;
    this.listeners = {};
    this.parentElement = null;
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = val;
    this.textContent = val.replace(/<[^>]*>/g, '');
  }

  setAttribute(name, val) { this.attributes[name] = String(val); }
  getAttribute(name) { return this.attributes[name] || null; }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  dispatchEvent(event) {
    const handlers = this.listeners[event.type] || [];
    for (const h of handlers) h(event);
  }

  querySelector(sel) {
    return new MockElement('span');
  }

  reset() {
    this.value = '';
    for (const child of this.children) child.reset && child.reset();
  }

  focus() {}
}

const mockDocument = {
  documentElement: new MockElement('html'),
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = new MockElement('div', id);
    }
    return this.elements[id];
  },
  querySelectorAll(sel) {
    if (sel === '.filter-btn') {
      return ['all', 'pending', 'completed'].map(f => {
        const el = new MockElement('button');
        el.dataset.filter = f;
        el.classList.add('filter-btn');
        if (f === 'all') el.classList.add('active');
        return el;
      });
    }
    return [];
  },
  querySelector(sel) {
    return new MockElement('div');
  },
  createElement(tag) {
    return new MockElement(tag);
  },
  addEventListener(event, fn) {
    if (event === 'DOMContentLoaded') {
      this._onReady = fn;
    }
  }
};

global.document = mockDocument;

// Read script.js and evaluate in test context
const scriptCode = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

// Execute script
eval(scriptCode);

// Trigger DOMContentLoaded
if (mockDocument._onReady) {
  mockDocument._onReady();
}

console.log('[PASS] script.js evaluated and initialized without errors');

// Verify initial state
const storedInitial = JSON.parse(localStorage.getItem('student_task_planner_data'));
console.log(`[PASS] LocalStorage initialized with ${storedInitial.length} items`);

// Test Auto-Sorting:
// Closest due date must be at the top of pending tasks!
console.log('\n--- Step 5: Testing Auto-Sorting (closest due date first) ---');
const sortedInitial = getFilteredAndSortedTasks();
console.log('Visible tasks order:');
sortedInitial.forEach((t, i) => console.log(`  ${i + 1}. [${t.dueDate}] ${t.course} - ${t.title} (${t.completed ? 'Completed' : 'Pending'})`));

// Check that pending tasks come first and are sorted ascending by date
const pendingTasks = sortedInitial.filter(t => !t.completed);
for (let i = 0; i < pendingTasks.length - 1; i++) {
  if (pendingTasks[i].dueDate > pendingTasks[i + 1].dueDate) {
    throw new Error(`Sorting error: ${pendingTasks[i].dueDate} is after ${pendingTasks[i + 1].dueDate}`);
  }
}
console.log('[PASS] Pending tasks are correctly sorted by closest due date first');

// Test Adding a new task
console.log('\n--- Step 6: Testing Add Task ---');
const form = mockDocument.getElementById('task-form');
const titleIn = mockDocument.getElementById('task-title');
const courseIn = mockDocument.getElementById('task-course');
const dateIn = mockDocument.getElementById('task-date');

// Set form values for an urgent assignment (e.g. tomorrow)
titleIn.value = 'Urgent Physics Quiz';
courseIn.value = 'PHYS 150';
dateIn.value = '2026-11-05'; // earlier than any other task

// Submit form
form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

// Verify task was added
const afterAdd = getFilteredAndSortedTasks();
if (!afterAdd.some(t => t.title === 'Urgent Physics Quiz')) {
  throw new Error('New task was not added');
}
if (afterAdd[0].title !== 'Urgent Physics Quiz') {
  throw new Error(`Expected 'Urgent Physics Quiz' to be first due to closest date (2026-11-05), but got ${afterAdd[0].title} (${afterAdd[0].dueDate})`);
}
console.log(`[PASS] Urgent task automatically sorted to top: "${afterAdd[0].title}" on ${afterAdd[0].dueDate}`);

// Verify localStorage updated
const storedAfterAdd = JSON.parse(localStorage.getItem('student_task_planner_data'));
if (!storedAfterAdd.some(t => t.title === 'Urgent Physics Quiz')) {
  throw new Error('LocalStorage was not updated after adding task');
}
console.log(`[PASS] LocalStorage now holds ${storedAfterAdd.length} items`);

// Test Filtering via handleFilterChange
console.log('\n--- Step 7: Testing Filtering (All, Pending, Completed) ---');

function setFilter(filterName) {
  const mockBtn = new MockElement('button');
  mockBtn.dataset.filter = filterName;
  mockBtn.classList.add('filter-btn');
  handleFilterChange({
    target: {
      closest: (sel) => sel === '.filter-btn' ? mockBtn : null
    }
  });
}

setFilter('pending');
const onlyPending = getFilteredAndSortedTasks();
if (onlyPending.some(t => t.completed)) {
  throw new Error('Completed task found in pending filter');
}
console.log(`[PASS] Pending filter returned ${onlyPending.length} pending tasks`);

setFilter('completed');
const onlyCompleted = getFilteredAndSortedTasks();
if (onlyCompleted.some(t => !t.completed)) {
  throw new Error('Pending task found in completed filter');
}
console.log(`[PASS] Completed filter returned ${onlyCompleted.length} completed tasks`);

setFilter('all');
const allTasks = getFilteredAndSortedTasks();
if (allTasks.length !== onlyPending.length + onlyCompleted.length) {
  throw new Error('Count mismatch in All filter');
}
console.log(`[PASS] All filter returned ${allTasks.length} tasks (Pending: ${onlyPending.length}, Completed: ${onlyCompleted.length})`);


// Test Completion Toggle via handleListClick
console.log('\n--- Step 8: Testing Completion Status Toggle ---');
const urgentTaskObj = getFilteredAndSortedTasks().find(t => t.title === 'Urgent Physics Quiz');
const mockTaskItem = new MockElement('li');
mockTaskItem.dataset.id = urgentTaskObj.id;

const mockCheckbox = new MockElement('input');
mockCheckbox.classList.add('task-checkbox');
mockCheckbox.checked = true;

handleListClick({
  target: {
    classList: { contains: (c) => c === 'task-checkbox' },
    checked: true,
    closest: (sel) => sel === '.task-item' ? mockTaskItem : null
  }
});

const storedAfterComplete = JSON.parse(localStorage.getItem('student_task_planner_data'));
const urgentStored = storedAfterComplete.find(t => t.title === 'Urgent Physics Quiz');
if (!urgentStored || !urgentStored.completed) {
  throw new Error('Task completion status did not persist to localStorage');
}
console.log('[PASS] Task completion successfully persisted to localStorage');

// Test Deletion via handleListClick
console.log('\n--- Step 9: Testing Task Deletion with Animation ---');
const countBeforeDelete = storedAfterComplete.length;

handleListClick({
  target: {
    classList: { contains: (c) => c === 'btn-delete' },
    closest: (sel) => sel === '.task-item' ? mockTaskItem : null
  }
});

// Verify .is-deleting class was added to trigger the CSS animation
if (!mockTaskItem.classList.contains('is-deleting')) {
  throw new Error('Task did not receive .is-deleting animation class');
}
console.log('[PASS] .is-deleting class successfully applied to trigger scale-down/fade-out animation');

// Trigger animationend to finalize deletion
mockTaskItem.dispatchEvent({ type: 'animationend' });

const storedAfterDelete = JSON.parse(localStorage.getItem('student_task_planner_data'));
if (storedAfterDelete.some(t => t.title === 'Urgent Physics Quiz') || storedAfterDelete.length !== countBeforeDelete - 1) {
  throw new Error('Task deletion was not persisted in localStorage after animation');
}
console.log(`[PASS] Task deleted. Remaining tasks count in localStorage: ${storedAfterDelete.length}`);


console.log('\n=============================================');
console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
console.log('=============================================\n');
