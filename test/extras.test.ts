import { describe, expect, it } from 'vitest'
import { calendarLinks } from '../src/calendar-links'
import { withExtras } from '../src/extras'
import { buildIcs } from '../src/ics'
import { renderPage } from '../src/list'
import { trim } from '../src/trim'
import { sessionRaw } from './fixture'

const agenda = withExtras(trim([sessionRaw()], '2026-10-01T17:00:00.000Z'))
const run = agenda.sessions.find((s) => s.id === 'RUN-2026')!
const POST = 'https://rmoff.net/2026/10/16/the-unofficial-current-san-francisco-2026-run/walk/'

describe('the run/walk', () => {
  const html = renderPage(agenda, { officialUrl: 'https://official.test/sessions', timeZone: 'America/Los_Angeles', siteUrl: 'https://agenda.test' })

  it('is a full-width card on Wednesday at 7 AM that links to the post', () => {
    expect(html).toContain('class="session feature feature-run" id="RUN-2026"')
    expect(html).toContain(`<a class="row" href="${POST}">`)
    expect(html).toContain('Wed</span> 7:00')
    expect(html).toContain('class="run-decor"')
  })

  it('shows no end time, but gives calendars 7–8 AM', () => {
    expect(run.end).toBeNull()
    const ics = buildIcs([run], agenda.speakers, 'https://agenda.test', '2026-10-01T17:00:00.000Z')
    expect(ics).toContain('DTSTART:20261104T150000Z')
    expect(ics).toContain('DTEND:20261104T160000Z')
    expect(ics.replace(/\r\n /g, '')).toContain(`URL:${POST}`)
    expect(new URL(calendarLinks(run, agenda.speakers, 'https://agenda.test')!.google).searchParams.get('dates')).toBe('20261104T150000Z/20261104T160000Z')
  })
})
