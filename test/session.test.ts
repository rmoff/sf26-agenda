import { describe, expect, it } from 'vitest'
import { renderSessionPage } from '../src/session'
import { trim } from '../src/trim'
import { sessionRaw } from './fixture'

const OPTS = { officialUrl: 'https://official.test/sessions', timeZone: 'America/Los_Angeles', siteUrl: 'https://agenda.test' }

const agenda = trim(
  [
    sessionRaw({ friendly_id: 'SESS-1', title: 'Streams <b>&</b> tables' }),
    sessionRaw({ friendly_id: 'SESS-2', title: 'Same slot talk', location: 'Room 2002' }),
    sessionRaw({ friendly_id: 'SESS-3', title: 'Later talk', starts_at: '2026-11-04T19:00:00.000Z', ends_at: '2026-11-04T19:45:00.000Z' }),
    sessionRaw({ friendly_id: 'SESS-4', title: 'Unscheduled A', starts_at: null, ends_at: null, location: null }),
    sessionRaw({ friendly_id: 'SESS-5', title: 'Unscheduled B', starts_at: null, ends_at: null, location: null }),
  ],
  '2026-10-01T17:00:00.000Z',
)

describe('renderSessionPage', () => {
  const byId = (id: string) => agenda.sessions.find((s) => s.id === id)!
  const html = renderSessionPage(agenda, byId('SESS-1'), OPTS)

  it('escapes the title and shows when and where', () => {
    expect(html).toContain('<h1>Streams &lt;b&gt;&amp;&lt;/b&gt; tables</h1>')
    expect(html).toContain('<span>Wed, Nov 4, 9:00\u2060–\u20609:45\u00a0AM</span><span>Room 2004</span>')
  })

  it('lists the other sessions in the same block, not later ones', () => {
    expect(html).toContain('Also on at this time')
    expect(html).toContain('href="/s/same-slot-talk-2"')
    expect(html).not.toContain('href="/s/later-talk-3"')
  })

  it('links back to the session row on the agenda', () => {
    expect(html).toContain('href="/#SESS-1"')
  })

  it('suggests the rest of the track for an unscheduled session', () => {
    const tba = renderSessionPage(agenda, byId('SESS-4'), OPTS)
    expect(tba).toContain('<span>Not scheduled yet</span>')
    expect(tba).toContain('More in Data Streaming')
    expect(tba).toContain('href="/s/unscheduled-b-5"')
    expect(tba).not.toContain('Add to calendar')
  })

  it('leaves out speaker fields that are not on the allowlist', () => {
    expect(html).not.toContain('unlisted value')
  })

  it('gives keynote and party pages the same header card as their agenda rows', () => {
    const plain = renderSessionPage(agenda, byId('SESS-1'), OPTS)
    expect(plain).toContain('<div class="detail-head">')
    const party = trim([sessionRaw({ format: 'Social', title: 'Current Party' })], '2026-10-01T17:00:00.000Z')
    const partyPage = renderSessionPage(party, party.sessions[0], OPTS)
    expect(partyPage).toContain('<div class="detail-head feature feature-party">')
    expect(partyPage).toContain('class="fireworks"')
    expect(partyPage).toContain('<span class="tag-feature">Social</span>')
    const reception = trim([sessionRaw({ format: 'Social', title: 'Current Welcome Reception' })], '2026-10-01T17:00:00.000Z')
    const receptionPage = renderSessionPage(reception, reception.sessions[0], OPTS)
    expect(receptionPage).toContain('<div class="detail-head feature feature-reception">')
    expect(receptionPage).toContain('class="reception-decor"')
    expect(receptionPage).not.toContain('party-decor')
    const late = trim([sessionRaw({ format: 'Social', title: 'Current After Party' })], '2026-10-01T17:00:00.000Z')
    const latePage = renderSessionPage(late, late.sessions[0], OPTS)
    expect(latePage).toContain('<div class="detail-head feature feature-afterparty">')
    expect(latePage).toContain('class="afterparty-decor"')
  })

  it('names the speakers under the title and shows neighbours as agenda rows', () => {
    expect(html).toMatch(/<h1>[^<]*<\/h1>\s*<p class="detail-who"><span class="person">/)
    expect(html).toContain('<section class="also">')
    expect(html).toContain('<article class="session" id="SESS-2">')
    expect(html).toContain('data-star="SESS-2"')
  })

  it('gives link previews the when, where and who, with an absolute image', () => {
    expect(html).toContain('<meta property="og:title" content="Streams &lt;b&gt;&amp;&lt;/b&gt; tables">')
    expect(html).toMatch(/<meta property="og:description" content="Wed, Nov 4, 9:00\u00a0AM · Room 2004 · Ada Example">/)
    expect(html).toContain('<meta property="og:image" content="https://agenda.test/og.png">')
    expect(html).toContain('<meta property="og:url" content="https://agenda.test/s/')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">')
  })
})
