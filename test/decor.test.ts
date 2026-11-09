import { describe, expect, it } from 'vitest'
import { withExtras } from '../src/extras'
import { AFTERPARTY_DECOR, PARTY_DECOR, RECEPTION_DECOR, RUN_DECOR } from '../src/html'
import { renderPage } from '../src/list'
import { renderSessionPage } from '../src/session'
import { trim } from '../src/trim'
import { sessionRaw } from './fixture'

const DECOR = [PARTY_DECOR, AFTERPARTY_DECOR, RECEPTION_DECOR, RUN_DECOR]
const classes = (html: string) => new Set([...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean))
const withoutDecor = (html: string) => DECOR.reduce((h, d) => h.split(d).join(''), html)

describe('card decorations', () => {
  const agenda = withExtras(trim([sessionRaw()], '2026-10-01T17:00:00.000Z'))
  const opts = { officialUrl: 'https://official.test/sessions', timeZone: 'America/Los_Angeles', siteUrl: 'https://agenda.test' }
  const decorClasses = new Set(DECOR.flatMap((d) => [...classes(d)]))

  // The Pong paddles were once class="bar", which restyled the page header.
  it.each([
    ['the list page', renderPage(agenda, opts)],
    ['a session page', renderSessionPage(agenda, agenda.sessions[0], opts)],
  ])('share no class names with %s', (_, html) => {
    const shared = [...classes(withoutDecor(html))].filter((c) => decorClasses.has(c))
    expect(shared).toEqual([])
  })
})
