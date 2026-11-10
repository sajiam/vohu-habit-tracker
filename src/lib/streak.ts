import { fromDateKey, shiftDate, toDateKey } from './date'

const uniqueSorted = (dates: string[]) =>
  [...new Set(dates)].sort((a, b) => a.localeCompare(b))

export const calculateStreaks = (dates: string[], today: Date) => {
  const active = new Set(uniqueSorted(dates))
  let current = 0
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  while (active.has(toDateKey(cursor))) {
    current += 1
    cursor = shiftDate(cursor, -1)
  }

  let best = 0
  let run = 0
  let previous: Date | null = null

  for (const key of uniqueSorted(dates)) {
    const date = fromDateKey(key)
    run = previous && toDateKey(shiftDate(previous, 1)) === key ? run + 1 : 1
    best = Math.max(best, run)
    previous = date
  }

  return { current, best }
}
