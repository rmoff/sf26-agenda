import { describe, expect, it } from 'vitest'
import { buildIcs } from '../src/ics'
import { trim } from '../src/trim'
import { sessionRaw } from './fixture'

const agenda = trim(
  [
    sessionRaw({ title: 'Commas, semicolons; and\nnewlines', description: '<p>' + 'Long text '.repeat(20) + '</p>' }),
    sessionRaw({ friendly_id: 'SESS-2', starts_at: null, ends_at: null }),
  ],
  '2026-10-01T17:00:00.000Z',
)

describe('buildIcs', () => {
  const ics = buildIcs(agenda.sessions, agenda.speakers, 'https://example.test/')

  it('wraps events in a calendar with CRLF line endings', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n')
  })

  it('includes only scheduled sessions, in UTC', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1)
    expect(ics).toContain('DTSTART:20261104T170000Z')
    expect(ics).toContain('DTEND:20261104T174500Z')
    expect(ics).toContain('LOCATION:Room 2004')
    expect(ics).toContain('UID:SESS-1@sf26-agenda')
  })

  it('escapes text values', () => {
    expect(ics).toContain('SUMMARY:Commas\\, semicolons\; and\\nnewlines')
  })

  it('folds lines at 75 octets', () => {
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  })

  it('omits DTEND when the end is not after the start', () => {
    const zero = trim([sessionRaw({ ends_at: '2026-11-04T17:00:00.000Z' })], '2026-10-01T17:00:00.000Z')
    expect(buildIcs(zero.sessions, zero.speakers, 'https://example.test/')).not.toContain('DTEND')
  })
})
