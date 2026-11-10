import { describe, expect, it } from 'vitest'
import { calculateStreaks } from './streak'

describe('calculateStreaks', () => {
  it('counts a current streak ending today', () => {
    expect(
      calculateStreaks(
        ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'],
        new Date(2026, 10, 10),
      ),
    ).toEqual({ current: 4, best: 4 })
  })

  it('uses calendar adjacency and ignores duplicate completions', () => {
    expect(
      calculateStreaks(
        ['2026-11-01', '2026-11-02', '2026-11-02', '2026-11-05'],
        new Date(2026, 10, 5),
      ),
    ).toEqual({ current: 1, best: 2 })
  })
})
