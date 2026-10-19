const STORAGE_KEY = 'calendarEvents';

const gridEl = document.getElementById('grid');
const monthLabel = document.getElementById('monthLabel');
const monthMeta = document.getElementById('monthMeta');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const todayBtn = document.getElementById('todayBtn');
const selectedLabel = document.getElementById('selectedLabel');
const eventCount = document.getElementById('eventCount');
const eventForm = document.getElementById('eventForm');
const eventInput = document.getElementById('eventInput');
const eventsEl = document.getElementById('events');
const emptyEl = document.getElementById('empty');

const today = new Date();
today.setHours(0, 0, 0, 0);

let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedKey = dateKey(today);
let events = loadEvents();

function pad(value) {
  return String(value).padStart(2, '0');
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseKey(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function seedEvents() {
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 2);

  return {
    [dateKey(today)]: [{ id: 'seed-1', text: 'Team stand-up at 9:00' }],
    [dateKey(soon)]: [{ id: 'seed-2', text: 'Dentist appointment' }],
  };
}

function loadEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) return saved;
  } catch (error) {
    return seedEvents();
  }

  return seedEvents();
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

if (!localStorage.getItem(STORAGE_KEY)) saveEvents();

function eventsFor(key) {
  return Array.isArray(events[key]) ? events[key] : [];
}

function renderGrid() {
  gridEl.innerHTML = '';
  const first = new Date(viewYear, viewMonth, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(viewYear, viewMonth, 1 - offset);

  for (let index = 0; index < 42; index++) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    const key = dateKey(date);
    const muted = date.getMonth() !== viewMonth;
    const isToday = key === dateKey(today);
    const dayEvents = eventsFor(key);

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell'
      + (muted ? ' muted' : '')
      + (isToday ? ' today' : '')
      + (key === selectedKey ? ' selected' : '');
    cell.dataset.date = key;
    cell.setAttribute('aria-label', date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }));

    const number = document.createElement('span');
    number.className = 'num';
    number.textContent = date.getDate();
    cell.appendChild(number);

    if (dayEvents.length) {
      const dots = document.createElement('span');
      dots.className = 'dots';

      for (let dot = 0; dot < Math.min(dayEvents.length, 3); dot++) {
        dots.appendChild(document.createElement('i'));
      }

      cell.appendChild(dots);
    }

    cell.addEventListener('click', () => {
      selectedKey = key;

      if (muted) {
        viewYear = date.getFullYear();
        viewMonth = date.getMonth();
      }

      render();
    });

    gridEl.appendChild(cell);
  }
}

function renderHeader() {
  monthLabel.textContent = new Date(viewYear, viewMonth, 1)
    .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const prefix = `${viewYear}-${pad(viewMonth + 1)}`;
  const count = Object.keys(events)
    .filter((key) => key.startsWith(prefix))
    .reduce((total, key) => total + eventsFor(key).length, 0);

  monthMeta.textContent = `${count} event${count === 1 ? '' : 's'} this month`;
}

function renderPanel() {
  const date = parseKey(selectedKey);
  const list = eventsFor(selectedKey);

  selectedLabel.textContent = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  eventCount.textContent = `${list.length} event${list.length === 1 ? '' : 's'}`;
  eventsEl.innerHTML = '';

  list.forEach((item) => {
    const row = document.createElement('li');

    const text = document.createElement('span');
    text.textContent = item.text;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${item.text}`);
    remove.addEventListener('click', () => {
      events[selectedKey] = eventsFor(selectedKey).filter((entry) => entry.id !== item.id);
      if (!events[selectedKey].length) delete events[selectedKey];
      saveEvents();
      render();
    });

    row.append(text, remove);
    eventsEl.appendChild(row);
  });

  emptyEl.hidden = list.length > 0;
}

function render() {
  renderHeader();
  renderGrid();
  renderPanel();
}

prevBtn.addEventListener('click', () => {
  viewMonth--;

  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }

  selectedKey = dateKey(new Date(viewYear, viewMonth, 1));
  render();
});

nextBtn.addEventListener('click', () => {
  viewMonth++;

  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }

  selectedKey = dateKey(new Date(viewYear, viewMonth, 1));
  render();
});

todayBtn.addEventListener('click', () => {
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();
  selectedKey = dateKey(today);
  render();
});

eventForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = eventInput.value.trim();
  if (!text) return;

  const list = eventsFor(selectedKey);
  list.push({
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    text,
  });
  events[selectedKey] = list;

  saveEvents();
  eventInput.value = '';
  render();
});

render();
