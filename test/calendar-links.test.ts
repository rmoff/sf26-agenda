import { describe, expect, it } from 'vitest'
import { calendarLinks } from '../src/calendar-links'
import { trim } from '../src/trim'
import { sessionRaw } from './fixture'

const agenda = trim(
  [sessionRaw(), sessionRaw({ friendly_id: 'SESS-2', starts_at: null, ends_at: null, location: null }), sessionRaw({ friendly_id: 'SESS-3', description: `<p>${'word '.repeat(300)}</p>` })],
  '2026-10-01T17:00:00.000Z',
)
const [timed, unscheduled, long] = agenda.sessions
const links = calendarLinks(timed, agenda.speakers, 'https://agenda.test')!

describe('calendarLinks', () => {
  it('builds a Google Calendar template link with UTC times, room and a link back', () => {
    const url = new URL(links.google)
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('text')).toBe('Exactly-once & you')
    expect(url.searchParams.get('dates')).toBe('20261104T170000Z/20261104T174500Z')
    expect(url.searchParams.get('location')).toBe('Room 2004')
    expect(url.searchParams.get('details')).toBe('https://agenda.test/s/exactly-once-and-you-1\n\nAda Example\n\nHello world')
    expect(links.google).toContain('dates=20261104T170000Z/20261104T174500Z')
    expect(links.google).not.toContain('+')
  })

  it('builds Outlook compose links for personal and work accounts', () => {
    for (const [href, host] of [
      [links.outlook, 'outlook.live.com'],
      [links.office, 'outlook.office.com'],
    ]) {
      const url = new URL(href)
      expect(url.host).toBe(host)
      expect(url.searchParams.get('rru')).toBe('addevent')
      expect(url.searchParams.get('startdt')).toBe('2026-11-04T17:00:00Z')
      expect(url.searchParams.get('enddt')).toBe('2026-11-04T17:45:00Z')
      expect(url.searchParams.get('subject')).toBe('Exactly-once & you')
    }
  })

  it('trims long abstracts so the links stay a sensible length', () => {
    const details = new URL(calendarLinks(long, agenda.speakers, 'https://agenda.test')!.google).searchParams.get('details')!
    expect(details.endsWith('word…')).toBe(true)
    expect(details.length).toBeLessThan(700)
  })

  it('has nothing to offer for an unscheduled session', () => {
    expect(calendarLinks(unscheduled, agenda.speakers, 'https://agenda.test')).toBeNull()
  })
})
