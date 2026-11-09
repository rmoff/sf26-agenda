import { describe, expect, it } from 'vitest'
import { withExtras } from '../src/extras'
import { renderLlms } from '../src/llms'
import { trim } from '../src/trim'
import { sessionRaw, speakerRaw } from './fixture'

const OPTS = { timeZone: 'America/Los_Angeles', siteUrl: 'https://agenda.test', officialUrl: 'https://official.test/sessions', full: false }

const agenda = withExtras(
  trim(
    [
      sessionRaw({ title: 'Exactly-once [and] you', description: '<p>Hello <strong>world</strong> &amp; friends</p>' }),
      sessionRaw({ friendly_id: 'SESS-2', title: 'Thursday talk', starts_at: '2026-11-05T18:00:00.000Z', ends_at: '2026-11-05T18:30:00.000Z', location: null, track: '', speakers: [] }),
      sessionRaw({ friendly_id: 'SESS-3', title: 'Welcome Reception', format: 'Social', starts_at: '2026-11-04T01:00:00.000Z', ends_at: '2026-11-04T02:00:00.000Z' }),
      sessionRaw({ friendly_id: 'SESS-4', title: 'Hub chat', format: 'Meet-Up Hub', location: 'Meet-Up Hub', track: '', level: '', starts_at: '2026-11-05T19:00:00.000Z', ends_at: '2026-11-05T19:45:00.000Z', speakers: [{ ...speakerRaw, id: 'c521f01f-0000-0000-0000-000000000002', friendly_id: 'CONT-2', full_name: 'Bo  Spaced' }] }),
      sessionRaw({ friendly_id: 'SESS-5', title: 'Unscheduled talk', starts_at: null, ends_at: null, location: null }),
    ],
    '2026-10-01T17:00:00.000Z',
  ),
)

describe('renderLlms', () => {
  const index = renderLlms(agenda, OPTS)
  const full = renderLlms(agenda, { ...OPTS, full: true })

  it('starts with the title, the summary and the note for bots', () => {
    expect(index.startsWith(`# Unofficial Current SF 26 agenda

> The Current San Francisco 2026 sessions (Moscone West, 4–5 November), taken from the official schedule every hour.

To add sessions to a calendar, join their ids with commas:
https://agenda.test/calendar.ics?s=SESS-222,SESS-229

Not affiliated with the event organisers. Check the official
sessions page (https://official.test/sessions)
before you rely on a time or room.

Abstracts for every session: https://agenda.test/llms-full.txt

## `)).toBe(true)
  })

  it('does not point the full version at itself', () => {
    expect(full).toContain('To add sessions to a calendar')
    expect(full).not.toContain('Abstracts for every session')
  })

  it('lists sessions by day in event time, in order', () => {
    const tue = index.indexOf('## Tuesday, November 3')
    const wed = index.indexOf('## Wednesday, November 4')
    const thu = index.indexOf('## Thursday, November 5')
    expect(tue).toBeGreaterThan(-1)
    expect(tue).toBeLessThan(wed)
    expect(wed).toBeLessThan(thu)
    expect(index.indexOf('The unofficial Current San Francisco 2026 Run/Walk')).toBeLessThan(index.indexOf('Exactly-once'))
  })

  it('gives each session its link, time with zone, room, format, track, level, speakers and id', () => {
    expect(index).toContain(
      '- [Exactly-once \\[and\\] you](https://agenda.test/s/exactly-once-and-you-1): Wed Nov 4, 9:00–9:45 AM PST · Room 2004 · Breakout Session · Data Streaming · Intermediate · Ada Example (Acme) · SESS-1\n',
    )
  })

  it('leaves out what a session does not have', () => {
    expect(index).toContain('- [Thursday talk](https://agenda.test/s/thursday-talk-2): Thu Nov 5, 10:00–10:30 AM PST · Breakout Session · Intermediate · SESS-2\n')
  })

  it('names a room once when the format has the same name, and tidies spacing in names', () => {
    expect(index).toContain('- [Hub chat](https://agenda.test/s/hub-chat-4): Thu Nov 5, 11:00–11:45 AM PST · Meet-Up Hub · Bo Spaced (Acme) · SESS-4\n')
  })

  it('lists sessions without a time last, under their own heading', () => {
    const heading = index.indexOf('## Not scheduled yet')
    expect(heading).toBeGreaterThan(index.indexOf('## Thursday, November 5'))
    expect(index.slice(heading)).toContain('- [Unscheduled talk](https://agenda.test/s/unscheduled-talk-5): Breakout Session · Data Streaming · Intermediate · Ada Example (Acme) · SESS-5\n')
  })

  it('links extras to where they were published', () => {
    expect(index).toContain('- [The unofficial Current San Francisco 2026 Run/Walk](https://rmoff.net/2026/10/16/the-unofficial-current-san-francisco-2026-run/walk/): Wed Nov 4, 7:00 AM PST')
  })

  it('uses plain spaces, not the page’s non-breaking ones', () => {
    expect(index).not.toContain('\u00a0')
  })

  it('adds abstracts only in the full version', () => {
    expect(index).not.toContain('Hello world')
    expect(full).toContain('SESS-1\n\n  Hello world & friends\n')
  })
})
