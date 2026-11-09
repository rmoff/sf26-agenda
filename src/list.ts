import { blocks, byTitle } from './blocks'
import { ICON, esc, featureClass, featureDecor, footer, jsonForScript, page, sentence, speakerNames, when, type Fmt, formatters, type RenderOptions } from './html'
import { sessionHref } from './slug'
import type { Agenda, Session } from './types'

export function sessionRow(s: Session, agenda: Agenda, fmt: Fmt, block?: { start: string; typicalEnd: string }): string {
  // Meet-up hub talks have the same format and room; the room already says it.
  const sameAsRoom = s.format.toLowerCase() === s.room?.toLowerCase()
  const tag = s.format && s.format !== 'Breakout Session' && !sameAsRoom ? sentence(s.format) : ''
  const ownTime = block && s.start && (s.start !== block.start || (s.end ?? s.start) !== block.typicalEnd) ? when(s, fmt) : ''
  const extra = [tag, ownTime].filter(Boolean)
  const feature = featureClass(s)
  const tagClass = s.format === 'Sponsor Session' ? ' class="tag-sponsor"' : feature ? ' class="tag-feature"' : ''
  const full = s.start ? `${esc(fmt.dayShort(s.start))}, <strong>${esc(fmt.time(s.start))}</strong>` : 'Not scheduled yet'
  return `<article class="session${feature ? ` feature ${feature}` : ''}" id="${esc(s.id)}">
${feature ? `${featureDecor(feature)}\n` : ''}<a class="row" href="${esc(sessionHref(s))}">
  <span class="title">${esc(s.title)}</span>
  <span class="line"><span class="who">${speakerNames(s, agenda.speakers)}</span>${s.room ? `<span class="room">${esc(s.room)}</span>` : ''}</span>
  <span class="line2${extra.length ? '' : ' track-only'}"><span class="track-when">${full}</span>${extra.map((e, i) => (tag && i === 0 ? `<span${tagClass}>${esc(e)}</span>` : `<span class="time-only">${ICON.clock}${esc(e)}</span>`)).join('')}</span>
</a>
<button type="button" class="star" data-star="${esc(s.id)}" aria-pressed="false" aria-label="Star: ${esc(s.title)}" hidden>${ICON.star}</button>
<span class="row-now" hidden>On now</span>
<span class="row-done" hidden>Finished</span>
<p class="clash" hidden></p>
</article>`
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = map.get(k)
    if (list) list.push(item)
    else map.set(k, [item])
  }
  return map
}

function select(label: string, name: string, options: [string, string][]): string {
  return `<label class="select"><span class="visually-hidden">${label}</span><select name="${name}"><option value="">Any ${label.toLowerCase()}</option>${options
    .map(([value, text]) => `<option value="${esc(value)}">${esc(text)}</option>`)
    .join('')}</select></label>`
}

export function renderPage(agenda: Agenda, opts: RenderOptions): string {
  const fmt = formatters(opts.timeZone)
  const scheduled = agenda.sessions.filter((s) => s.start).sort((a, b) => a.start!.localeCompare(b.start!))
  const unscheduled = agenda.sessions.filter((s) => !s.start)
  const days = groupBy(scheduled, (s) => fmt.dayKey(s.start!))
  const uniq = (pick: (s: Session) => string) => [...new Set(agenda.sessions.map(pick).filter(Boolean))].sort()

  const dayParts = [...days].map(([key, sessions]) => {
    const slots = blocks(sessions).map(
      (b) => `<div class="group" data-start="${b.start}" data-end="${b.typicalEnd}">
<h3 class="slot"><time datetime="${b.start}"><span class="slot-day">${esc(fmt.weekday(b.start))}</span> ${esc(b.typicalEnd > b.start ? fmt.range(b.start, b.typicalEnd) : fmt.time(b.start))}</time><span class="badge" hidden>On now</span></h3>
<div class="sessions">
${b.sessions.map((s) => sessionRow(s, agenda, fmt, b)).join('\n')}
</div>
</div>`,
    )
    return `<section class="part day-${fmt.weekday(sessions[0].start!).toLowerCase()}" data-part="${key}">
<h2 class="part-title">${fmt.dayLong(sessions[0].start!)}</h2>
${slots.join('\n')}
</section>`
  })

  const tracks = [...groupBy(unscheduled, (s) => s.track)].sort(([a], [b]) => a.localeCompare(b))
  const tbaPart = unscheduled.length
    ? `<section class="part" data-part="unscheduled">
<h2 class="part-title">Not scheduled yet</h2>
<p class="part-note">These sessions don't have a time or room yet. They're grouped by track.</p>
${tracks
  .map(
    ([track, list]) => `<div class="group">
<h3 class="slot"><span class="slot-name">${esc(track)}</span></h3>
<div class="sessions">
${list.sort(byTitle).map((s) => sessionRow(s, agenda, fmt)).join('\n')}
</div>
</div>`,
  )
  .join('\n')}
</section>`
    : ''

  const dayOptions: [string, string][] = [
    ...[...days].map(([key, list]) => [key, fmt.dayShort(list[0].start!)] as [string, string]),
    ...(unscheduled.length ? [['unscheduled', 'Not scheduled yet'] as [string, string]] : []),
  ]
  const asOptions = (values: string[]): [string, string][] => values.map((v) => [v, v])

  const clientData = {
    timeZone: opts.timeZone,
    demo: Boolean(opts.demo),
    sessions: agenda.sessions.map((s) => ({
      id: s.id,
      title: s.title,
      day: s.start ? fmt.dayKey(s.start) : 'unscheduled',
      start: s.start,
      end: s.end,
      track: s.track,
      level: s.level,
      format: s.format,
      room: s.room,
    })),
  }

  const body = `<header class="bar" id="bar">
  <div class="bar-inner">
    <h1 class="brand"><a href="/">Current SF 2026</a></h1>
    <div class="bar-actions" hidden>
      <button type="button" class="bar-button" id="starred-toggle" aria-pressed="false" aria-label="Show only starred sessions">${ICON.star}<span class="bar-label">Starred</span><span class="count" id="star-count" hidden></span></button>
      <button type="button" class="bar-link" id="now" aria-label="What's on now?"><span class="now-long">What's on now?</span><span class="now-short">Now?</span></button>
    </div>
  </div>
</header>
<div class="tools" id="tools" hidden>
  <form class="search-row" id="search-form" role="search">
    <label class="search">${ICON.search}<span class="visually-hidden">Search</span><input type="search" name="q" placeholder="Search talks, speakers, companies" autocomplete="off" enterkeyhint="search"></label>
    <button type="button" class="reset" id="clear" aria-label="Clear search and filters" title="Clear search and filters" disabled>${ICON.reset}</button>
  </form>
  <div class="row-shape">
    <div class="grouping" id="grouping" role="group" aria-label="Group sessions by">
      <span class="grouping-label">Group by</span>
      <button type="button" data-group="time" aria-pressed="true">Time</button>
      <button type="button" data-group="track" aria-pressed="false">Track</button>
      <button type="button" data-group="room" aria-pressed="false">Room</button>
    </div>
  </div>
  <div class="panel" id="filters">
    ${select('Day', 'day', dayOptions)}
    ${select('Track', 'track', asOptions(uniq((s) => s.track)))}
    ${select('Level', 'level', asOptions(uniq((s) => s.level)))}
    ${select('Format', 'format', asOptions(uniq((s) => s.format)))}
  </div>
  <div class="status-row">
    <p class="status" id="status" aria-live="polite"></p>
    <a class="link" id="export" href="/calendar.ics" hidden>Add starred to calendar</a>
  </div>
</div>
<main id="agenda">
${dayParts.join('\n')}
${tbaPart}
<p class="empty" id="empty" hidden></p>
</main>
<div class="note" id="now-note" popover>
  <div class="note-art" id="now-note-art" aria-hidden="true"></div>
  <p class="note-big" id="now-note-big" hidden></p>
  <p id="now-note-text"></p>
  <button type="button" class="button" id="now-note-ok" popovertarget="now-note" popovertargetaction="hide">OK</button>
</div>
<p class="pill" id="pill" role="status" hidden></p>
${footer(agenda.fetchedAt, fmt, opts.officialUrl)}
<script type="application/json" id="agenda-data">${jsonForScript(clientData)}</script>`

  return page({
    ...opts,
    title: 'Unofficial Current SF 26 agenda',
    description: 'Unofficial Current SF 26 agenda',
    path: '/',
    body,
    bodyClass: 'list-page',
  })
}
