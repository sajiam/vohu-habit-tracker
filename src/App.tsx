import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import {
  formatLongDate,
  formatSelectedDate,
  getGreeting,
  toDateKey,
} from './lib/date'
import { calculateStreaks } from './lib/streak'

type Habit = {
  id: string
  name: string
  completions: string[]
}

type StoredState = {
  version: 1
  userName: string
  habits: Habit[]
}

const STORAGE_KEY = 'vohu-habit-tracker-v1'

const createInitialState = (): StoredState => ({
  version: 1,
  userName: '',
  habits: [],
})

const readState = (): StoredState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as Partial<StoredState>
    if (parsed.version !== 1 || typeof parsed.userName !== 'string' || !Array.isArray(parsed.habits)) {
      return createInitialState()
    }
    return parsed as StoredState
  } catch {
    return createInitialState()
  }
}

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

function Welcome({ onContinue }: { onContinue: (name: string) => void }) {
  const [name, setName] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (clean) onContinue(clean)
  }

  return (
    <main className="welcome-shell">
      <section className="welcome-art" aria-hidden="true">
        <Logo inverse />
        <div>
          <p className="display-copy">Small habits.<br />Remarkable days.</p>
          <p className="welcome-art-copy">A calm place to show up, check in, and keep moving.</p>
        </div>
        <p className="eyebrow text-white">VOHU · DAILY PRACTICE</p>
      </section>

      <form className="welcome-form" onSubmit={submit}>
        <div className="md:hidden"><Logo /></div>
        <div>
          <h1 className="page-title">Welcome to Vohu</h1>
          <p className="muted mt-2">Start by telling us what to call you.</p>
        </div>
        <label className="field-label" htmlFor="user-name">Your name</label>
        <input
          id="user-name"
          className="text-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your name"
          autoComplete="name"
          autoFocus
          required
        />
        <button className="primary-button" type="submit">Continue</button>
        <p className="muted text-sm">Your progress stays on this device.</p>
      </form>
    </main>
  )
}

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`logo ${inverse ? 'logo-inverse' : ''}`} aria-label="Vohu">
      V
    </div>
  )
}

function App() {
  const [data, setData] = useState<StoredState>(() => readState())
  const [now, setNow] = useState(() => new Date())
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(now)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  if (!data.userName) {
    return <Welcome onContinue={(userName) => setData((state) => ({ ...state, userName }))} />
  }

  const todayKey = toDateKey(now)
  const activeDates = data.habits.flatMap((habit) => habit.completions)
  const streaks = calculateStreaks(activeDates, now)

  const toggleHabit = (habitId: string) => {
    setData((state) => ({
      ...state,
      habits: state.habits.map((habit) => {
        if (habit.id !== habitId) return habit
        const isComplete = habit.completions.includes(todayKey)
        return {
          ...habit,
          completions: isComplete
            ? habit.completions.filter((date) => date !== todayKey)
            : [...habit.completions, todayKey],
        }
      }),
    }))
  }

  const removeHabit = (habitId: string) => {
    setData((state) => ({ ...state, habits: state.habits.filter((habit) => habit.id !== habitId) }))
  }

  const addHabit = (name: string) => {
    setData((state) => ({
      ...state,
      habits: [...state.habits, { id: makeId(), name, completions: [] }],
    }))
    setModalOpen(false)
  }

  const completeCount = data.habits.filter((habit) => habit.completions.includes(todayKey)).length

  return (
    <main className="app-shell">
      <div className="dashboard-container">
        <header>
          <h1 className="dashboard-title">{getGreeting(now)}, {data.userName}!</h1>
          <p className="muted mt-1">{formatLongDate(now)}</p>
        </header>

        <section className="streak-grid" aria-label="Streak summary">
          <StreakCard label="Current streak" value={`${streaks.current} ${streaks.current === 1 ? 'day' : 'days'}`} tone="yellow" />
          <StreakCard label="Best streak" value={`${streaks.best} ${streaks.best === 1 ? 'day' : 'days'}`} tone="olive" />
        </section>

        <div className="dashboard-grid">
          <Calendar
            month={month}
            selectedDate={selectedDate}
            activeDates={new Set(activeDates)}
            today={now}
            onSelect={setSelectedDate}
            onPrevious={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            onNext={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          />

          <section className="card habit-card">
            <div className="section-heading">
              <h2>Today’s habits</h2>
              <span>{completeCount} of {data.habits.length}</span>
            </div>

            <div className="habit-list">
              {data.habits.length === 0 ? (
                <div className="empty-state">
                  <p className="font-semibold text-ink">No habits yet</p>
                  <p className="muted text-sm">Add your first habit and start today.</p>
                </div>
              ) : data.habits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  checked={habit.completions.includes(todayKey)}
                  onToggle={() => toggleHabit(habit.id)}
                  onDelete={() => removeHabit(habit.id)}
                />
              ))}
            </div>

            <button className="secondary-button" type="button" onClick={() => setModalOpen(true)}>
              <Plus size={18} aria-hidden="true" /> Add Habit
            </button>
          </section>
        </div>
      </div>

      {modalOpen && <AddHabitModal onAdd={addHabit} onClose={() => setModalOpen(false)} />}
    </main>
  )
}

function StreakCard({ label, value, tone }: { label: string; value: string; tone: 'yellow' | 'olive' }) {
  return (
    <article className={`streak-card ${tone}`}>
      <p className="eyebrow">{label}</p>
      <p className="streak-value">{value}</p>
    </article>
  )
}

function HabitRow({ habit, checked, onToggle, onDelete }: {
  habit: Habit
  checked: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className="habit-row">
      <label className="habit-check">
        <input className="sr-only" type="checkbox" checked={checked} onChange={onToggle} />
        <span className={`checkbox ${checked ? 'checked' : ''}`} aria-hidden="true">
          {checked && <Check size={15} strokeWidth={3} />}
        </span>
        <span className={checked ? 'habit-complete' : ''}>{habit.name}</span>
      </label>
      <button className="icon-button danger" type="button" onClick={onDelete} aria-label={`Delete ${habit.name}`}>
        <Trash2 size={18} />
      </button>
    </div>
  )
}

function Calendar({ month, selectedDate, activeDates, today, onSelect, onPrevious, onNext }: {
  month: Date
  selectedDate: Date
  activeDates: Set<string>
  today: Date
  onSelect: (date: Date) => void
  onPrevious: () => void
  onNext: () => void
}) {
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const start = new Date(first)
    start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [month])

  const todayKey = toDateKey(today)
  const selectedKey = toDateKey(selectedDate)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month)

  return (
    <section className="card calendar-card">
      <div className="calendar-heading">
        <button className="icon-button" type="button" onClick={onPrevious} aria-label="Previous month"><ChevronLeft /></button>
        <h2>{monthLabel}</h2>
        <button className="icon-button" type="button" onClick={onNext} aria-label="Next month"><ChevronRight /></button>
      </div>
      <p className="selected-date">Selected · {formatSelectedDate(selectedDate)}</p>
      <div className="calendar-grid weekday-row" aria-hidden="true">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
      </div>
      <div className="calendar-grid">
        {days.map((date) => {
          const key = toDateKey(date)
          const outside = date.getMonth() !== month.getMonth()
          const future = key > todayKey
          const active = activeDates.has(key)
          const selected = key === selectedKey
          return (
            <button
              key={key}
              type="button"
              className={`calendar-day ${outside || future ? 'future' : ''} ${active ? 'active' : ''} ${selected ? 'selected' : ''}`}
              onClick={() => onSelect(date)}
              aria-label={`${formatSelectedDate(date)}${active ? ', activity recorded' : ''}`}
              aria-pressed={selected}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function AddHabitModal({ onAdd, onClose }: { onAdd: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (clean) onAdd(clean)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="add-habit-title" onSubmit={submit}>
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close dialog"><X /></button>
        <h2 id="add-habit-title" className="modal-title">Add a new habit</h2>
        <label className="field-label" htmlFor="habit-name">Habit name</label>
        <input
          ref={inputRef}
          id="habit-name"
          className="text-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Meditate for 10 minutes"
          required
        />
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-button" type="submit">Add</button>
        </div>
      </form>
    </div>
  )
}

export default App
