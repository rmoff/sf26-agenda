import { describe, expect, it } from 'vitest'
import { renderPage } from '../src/list'
import { trim } from '../src/trim'
import { sessionRaw } from './fixture'

const OPTS = { officialUrl: 'https://official.test/sessions', timeZone: 'America/Los_Angeles', siteUrl: 'https://agenda.test' }

function page(raws: Record<string, unknown>[]) {
  return renderPage(trim(raws, '2026-10-01T17:00:00.000Z'), OPTS)
}

describe('renderPage', () => {
  const html = page([
    sessionRaw({ title: '<img src=x onerror=alert(1)> Streams & tables' }),
    sessionRaw({ friendly_id: 'SESS-2', title: 'Later talk', starts_at: '2026-11-05T18:00:00.000Z', ends_at: '2026-11-05T18:30:00.000Z' }),
    sessionRaw({ friendly_id: 'SESS-3', title: 'Unscheduled talk', starts_at: null, ends_at: null, location: null }),
  ])

  it('escapes session text', () => {
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt; Streams &amp; tables')
    expect(html).not.toContain('<img src=x')
  })

  it('renders one article per session with a linkable id', () => {
    expect(html.match(/<article /g)).toHaveLength(3)
    for (const id of ['SESS-1', 'SESS-2', 'SESS-3']) expect(html).toContain(`id="${id}"`)
  })

  it('groups scheduled sessions by day in event time, then unscheduled', () => {
    const wed = html.indexOf('Wednesday, November 4')
    const thu = html.indexOf('Thursday, November 5')
    const tba = html.indexOf('Not scheduled yet</h2>')
    expect(wed).toBeGreaterThan(-1)
    expect(wed).toBeLessThan(thu)
    expect(thu).toBeLessThan(tba)
    expect(html).toContain('<time datetime="2026-11-04T17:00:00.000Z"><span class="slot-day">Wed</span> 9:00–9:45\u00a0AM</time>')
  })

  it('offers a day filter with only the days that have sessions', () => {
    expect(html).toContain('<option value="">Any day</option>')
    expect(html).toContain('<option value="2026-11-04">Wed, Nov 4</option>')
    expect(html).toContain('<option value="2026-11-05">Thu, Nov 5</option>')
    expect(html).toContain('<option value="unscheduled">Not scheduled yet</option>')
  })

  it('embeds filter data the browser can parse', () => {
    const json = /<script type="application\/json" id="agenda-data">([\s\S]*?)<\/script>/.exec(html)?.[1]
    expect(json).toBeDefined()
    const data = JSON.parse(json!)
    expect(data.sessions).toHaveLength(3)
    expect(data.sessions[0]).toMatchObject({ id: 'SESS-1', day: '2026-11-04', track: 'Data Streaming' })
  })

  it('never ends the data script early', () => {
    const evil = page([sessionRaw({ title: '</script><script>alert(1)</script>' })])
    const json = /<script type="application\/json" id="agenda-data">([\s\S]*?)<\/script>/.exec(evil)![1]
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('links each row to its session page and carries no track colour', () => {
    expect(html).toContain('<a class="row" href="/s/later-talk-2">')
    expect(html).not.toContain('--track')
  })

  it('gives every row its day and time for the by-track view, without slot counts', () => {
    expect(html).toContain('<span class="track-when">Wed, Nov 4, <strong>9:00\u00a0AM</strong></span>')
    expect(html).toContain('<span class="track-when">Not scheduled yet</span>')
    expect(html).not.toContain('slot-count')
  })

  it('says it is unofficial and links to the official page', () => {
    expect(html).toContain('Not affiliated')
    expect(html).toContain('href="https://official.test/sessions"')
  })

  it('leaves out speaker fields that are not on the allowlist', () => {
    expect(html).not.toContain('unlisted value')
  })

  it('marks sponsor sessions with a badge', () => {
    const sponsored = page([sessionRaw({ format: 'Sponsor Session' })])
    expect(sponsored).toContain('<span class="tag-sponsor">Sponsor session</span>')
    expect(html).not.toContain('tag-sponsor')
  })

  it('gives the keynote and the party full-width cards, with fireworks only for the party', () => {
    const featured = page([
      sessionRaw({ format: 'Keynote', title: 'Opening keynote' }),
      sessionRaw({ friendly_id: 'SESS-2', format: 'Social', title: 'Current Party' }),
    ])
    expect(featured).toContain('class="session feature feature-keynote" id="SESS-1"')
    expect(featured).toContain('class="session feature feature-party" id="SESS-2"')
    expect(featured.match(/class="fireworks"/g)).toHaveLength(1)
    expect(featured).toContain('<span class="tag-feature">Keynote</span>')
    expect(html).not.toContain('feature')
  })

  it('gives the after party its own card, not a copy of the party', () => {
    const late = page([sessionRaw({ format: 'Social', title: 'Current After Party @ SPIN 🌙' })])
    expect(late).toContain('class="session feature feature-afterparty" id="SESS-1"')
    expect(late).toContain('class="afterparty-decor"')
    expect(late).not.toContain('class="party-decor"')
  })

  it('gives a welcome reception a quiet card, with none of the party decorations', () => {
    const quiet = page([sessionRaw({ format: 'Social', title: 'Current Welcome Reception @ The Howard 🎉' })])
    expect(quiet).toContain('class="session feature feature-reception" id="SESS-1"')
    expect(quiet).toContain('class="reception-decor"')
    expect(quiet).not.toContain('party-decor')
  })

  it('names the day sections by weekday so each day can colour its slot headers', () => {
    expect(html).toContain('<section class="part day-wed" data-part="2026-11-04">')
    expect(html).toContain('<section class="part day-thu" data-part="2026-11-05">')
  })

  it('keeps the Wed and Thu colours when something is on the day before', () => {
    const withTue = page([
      sessionRaw({ friendly_id: 'SESS-0', title: 'Welcome reception', format: 'Social', starts_at: '2026-11-04T01:00:00.000Z', ends_at: '2026-11-04T02:00:00.000Z' }),
      sessionRaw(),
      sessionRaw({ friendly_id: 'SESS-2', starts_at: '2026-11-05T18:00:00.000Z', ends_at: '2026-11-05T18:30:00.000Z' }),
    ])
    expect(withTue).toContain('<section class="part day-tue" data-part="2026-11-03">')
    expect(withTue).toContain('<section class="part day-wed" data-part="2026-11-04">')
    expect(withTue).toContain('<section class="part day-thu" data-part="2026-11-05">')
  })

  it('shows the venue once when the format is the same as the room', () => {
    const hub = page([sessionRaw({ format: 'Meet-Up Hub', location: 'Meet-Up Hub' })])
    const row = /<article[\s\S]*?<\/article>/.exec(hub)![0]
    expect(row).toContain('<span class="room">Meet-Up Hub</span>')
    expect(row.match(/meet-up hub/gi)).toHaveLength(1)
    const other = page([sessionRaw({ format: 'Lightning Talk', location: 'Innovation Theater' })])
    expect(other).toContain('<span>Lightning talk</span>')
  })
})
