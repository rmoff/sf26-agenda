import { blocks, byTitle } from './blocks'
import { ICON, esc, featureClass, featureDecor, footer, formatters, page, sentence, speakerNames, when, type RenderOptions } from './html'
import { calendarLinks } from './calendar-links'
import { sessionRow } from './list'
import { sessionPath } from './slug'
import type { Agenda, Session, Speaker } from './types'

function speakerDetail(p: Speaker): string {
  const role = [p.title, p.company].filter(Boolean).map(esc).join(', ')
  const links = p.links.map((l) => `<a href="${esc(l.url)}" rel="nofollow noopener">${esc(l.label)}</a>`).join('')
  return `<li class="speaker">
  ${p.photo ? `<img src="${esc(p.photo)}" alt="" width="64" height="64" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '<span class="nophoto" aria-hidden="true"></span>'}
  <div>
    <h3 class="speaker-name">${esc(p.name)}</h3>
    ${role ? `<p class="speaker-role">${role}</p>` : ''}
    ${links ? `<p class="speaker-links">${links}</p>` : ''}
    ${p.about ? `<div class="bio">${p.about}</div>` : ''}
  </div>
</li>`
}

function neighbours(
  s: Session,
  agenda: Agenda,
  dayKey: (iso: string) => string,
): { heading: string; sessions: Session[]; block?: { start: string; typicalEnd: string } } {
  if (!s.start) {
    return { heading: `More in ${s.track}`, sessions: agenda.sessions.filter((o) => !o.start && o.track === s.track && o.id !== s.id).sort(byTitle) }
  }
  const sameDay = agenda.sessions.filter((o) => o.start && dayKey(o.start) === dayKey(s.start!)).sort((a, b) => a.start!.localeCompare(b.start!))
  const block = blocks(sameDay).find((b) => b.sessions.some((o) => o.id === s.id))
  return { heading: 'Also on at this time', sessions: (block?.sessions ?? []).filter((o) => o.id !== s.id), block }
}

export function renderSessionPage(agenda: Agenda, s: Session, opts: RenderOptions): string {
  const fmt = formatters(opts.timeZone)
  const people = s.speakerIds.map((pid) => agenda.speakers[pid]).filter(Boolean)
  const whenText = s.start ? `${fmt.dayShort(s.start)}, ${when(s, fmt).replace(/–/g, '\u2060–\u2060')}` : 'Not scheduled yet'
  const whereText = s.room ?? 'Room not announced yet'
  const meta = [s.track, s.level, sentence(s.format)].filter(Boolean)
  const others = neighbours(s, agenda, fmt.dayKey)
  const feature = featureClass(s)
  const cal = calendarLinks(s, agenda.speakers, opts.siteUrl)
  const ics = `${sessionPath(s)}.ics`
  const tagClass = s.format === 'Sponsor Session' ? ' class="tag-sponsor"' : feature ? ' class="tag-feature"' : ''

  const body = `<header class="bar">
  <div class="bar-inner">
    <a class="bar-back" id="back" href="/#${esc(s.id)}">${ICON.back}Agenda</a>
    <div class="bar-actions detail-actions">
      <button type="button" class="icon-button star-button" data-star="${esc(s.id)}" aria-pressed="false" aria-label="Star" title="Star" hidden>${ICON.star}</button>
      ${cal ? `<button type="button" class="icon-button" popovertarget="cal-menu" aria-label="Add to calendar" title="Add to calendar">${ICON.calendarAdd}</button>` : ''}
      <button type="button" class="icon-button" id="share" aria-label="Copy link" title="Copy link" hidden><span class="icon-link">${ICON.link}</span><span class="icon-share">${ICON.share}</span></button>
    </div>
  </div>
</header>
<main class="detail">
  <div class="detail-head${feature ? ` feature ${feature}` : ''}">
    ${featureDecor(feature)}
    <h1>${esc(s.title)}</h1>
    ${people.length ? `<p class="detail-who">${speakerNames(s, agenda.speakers)}</p>` : ''}
    <p class="when-where"><span>${esc(whenText)}</span><span>${esc(whereText)}</span></p>
    ${meta.length ? `<p class="meta">${meta.map((m) => `<span${m === sentence(s.format) ? tagClass : ''}>${esc(m)}</span>`).join('')}</p>` : ''}
  </div>
  <div class="abstract">${s.description}</div>
  ${people.length ? `<section><h2>${people.length === 1 ? 'Speaker' : 'Speakers'}</h2><ul class="speakers">${people.map(speakerDetail).join('')}</ul></section>` : ''}
  ${
    others.sessions.length
      ? `<section class="also"><h2>${esc(others.heading)}</h2><div class="sessions">
${others.sessions.map((o) => sessionRow(o, agenda, fmt, others.block)).join('\n')}
</div></section>`
      : ''
  }
</main>
${
  cal
    ? `<div class="cal-menu" id="cal-menu" popover>
  <p class="cal-menu-title">Add to calendar</p>
  <a href="${esc(cal.google)}" target="_blank" rel="noopener">Google Calendar</a>
  <a href="${esc(cal.outlook)}" target="_blank" rel="noopener">Outlook.com</a>
  <a href="${esc(cal.office)}" target="_blank" rel="noopener">Outlook (work or school)</a>
  <a href="${esc(ics)}">Apple Calendar (.ics)</a>
</div>`
    : ''
}
<p class="pill" id="share-status" role="status" hidden></p>
${footer(agenda.fetchedAt, fmt, opts.officialUrl)}`

  return page({
    ...opts,
    title: `${s.title} (Current SF 2026, unofficial agenda)`,
    shareTitle: s.title,
    // What a link preview should answer: when, where, who.
    description: [s.start ? `${fmt.dayShort(s.start)}, ${fmt.time(s.start)}` : 'Not scheduled yet', s.room, people.map((p) => p.name).join(', ')].filter(Boolean).join(' · '),
    path: sessionPath(s),
    body,
    bodyClass: 'session-page',
  })
}
