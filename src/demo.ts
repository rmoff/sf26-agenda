import type { Agenda, Session } from './types'

const BREAKOUT_ROOMS = ['Room 2001', 'Room 2002', 'Room 2003', 'Room 2004', 'Room 2005', 'Room 2006']
const BREAKOUT_SLOTS = [
  '2026-11-04T18:30', '2026-11-04T19:30', '2026-11-04T21:30', '2026-11-04T22:30', '2026-11-04T23:45', '2026-11-05T00:45',
  '2026-11-05T17:30', '2026-11-05T18:30', '2026-11-05T19:30', '2026-11-05T21:30', '2026-11-05T22:30',
]
const LIGHTNING_STARTS = ['2026-11-04T20:00', '2026-11-05T20:00']

function at(utc: string, plusMinutes = 0): string {
  return new Date(Date.parse(`${utc}:00.000Z`) + plusMinutes * 60_000).toISOString()
}

export function withDemoSchedule(agenda: Agenda): Agenda {
  const sessions = agenda.sessions.map((s) => ({ ...s }))
  const byId = (a: Session, b: Session) => a.id.localeCompare(b.id, 'en', { numeric: true })
  const untimed = sessions.filter((s) => !s.start).sort(byId)

  for (const s of sessions) if (s.start && !s.room) s.room = s.format === 'Innovation Theater' ? 'Expo theater' : 'Room 2007'

  const lightning = untimed.filter((s) => s.format === 'Lightning Talk')
  lightning.forEach((s, i) => {
    const day = i % LIGHTNING_STARTS.length
    const n = Math.floor(i / LIGHTNING_STARTS.length)
    s.start = at(LIGHTNING_STARTS[day], n * 20)
    s.end = at(LIGHTNING_STARTS[day], n * 20 + 15)
    s.room = 'Lightning stage'
  })

  const theater = untimed.filter((s) => s.format === 'Innovation Theater')
  theater.forEach((s, i) => {
    s.start = at('2026-11-05T18:00', i * 30)
    s.end = at('2026-11-05T18:00', i * 30 + 20)
    s.room = 'Expo theater'
  })

  const rest = untimed.filter((s) => !s.start)
  rest.forEach((s, i) => {
    const slot = BREAKOUT_SLOTS[Math.floor(i / BREAKOUT_ROOMS.length) % BREAKOUT_SLOTS.length]
    s.start = at(slot)
    s.end = at(slot, 45)
    s.room = BREAKOUT_ROOMS[i % BREAKOUT_ROOMS.length]
  })

  return { ...agenda, sessions }
}
