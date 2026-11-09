import { describe, expect, it } from 'vitest'
import { withDemoSchedule } from '../src/demo'
import { trim } from '../src/trim'
import { sessionRaw } from './fixture'

describe('withDemoSchedule', () => {
  const agenda = trim(
    [
      sessionRaw({ friendly_id: 'SESS-1', starts_at: null, ends_at: null, location: null }),
      sessionRaw({ friendly_id: 'SESS-2', starts_at: null, ends_at: null, location: null, format: 'Lightning Talk' }),
      sessionRaw({ friendly_id: 'SESS-3', location: null }),
    ],
    '2026-10-01T17:00:00.000Z',
  )
  const demo = withDemoSchedule(agenda)

  it('gives every session a time and room', () => {
    for (const s of demo.sessions) {
      expect(s.start).not.toBeNull()
      expect(s.end! > s.start!).toBe(true)
      expect(s.room).toBeTruthy()
    }
  })

  it('keeps real times and does not mutate the input', () => {
    expect(demo.sessions[2].start).toBe('2026-11-04T17:00:00.000Z')
    expect(agenda.sessions[0].start).toBeNull()
  })
})
