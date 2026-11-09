import { formatters, when } from './html'
import { textOf } from './sanitize'
import { sessionHref } from './slug'
import type { Agenda, Session } from './types'

const TITLE = 'Unofficial Current SF 26 agenda'
const SUMMARY = 'The Current San Francisco 2026 sessions (Moscone West, 4–5 November), taken from the official schedule every hour.'

function linkText(value: string): string {
  return value.replace(/([\\[\]])/g, '\\$1')
}

export function renderLlms(agenda: Agenda, opts: { timeZone: string; siteUrl: string; officialUrl: string; full: boolean }): string {
  const fmt = formatters(opts.timeZone)
  const zone = new Intl.DateTimeFormat('en-US', { timeZone: opts.timeZone, timeZoneName: 'short' })
  const zoneOf = (iso: string) => zone.formatToParts(new Date(iso)).find((p) => p.type === 'timeZoneName')?.value ?? ''
  const plain = (value: string) => value.replace(/[\s\u00a0]+/g, ' ').trim()
  const line = (s: Session) => {
    const who = s.speakerIds
      .map((id) => agenda.speakers[id])
      .filter(Boolean)
      .map((p) => (p.company ? `${plain(p.name)} (${plain(p.company)})` : plain(p.name)))
      .join(', ')
    const at = s.start ? `${fmt.dayShort(s.start).replace(/^(\w+),/, '$1')}, ${plain(when(s, fmt))} ${zoneOf(s.start)}` : ''
    const facts = [at, s.room, s.format === s.room ? '' : s.format, s.track, s.level, who, s.id].filter(Boolean).join(' · ')
    const about = opts.full ? textOf(s.description) : ''
    return `- [${linkText(s.title)}](${new URL(sessionHref(s), opts.siteUrl).href}): ${facts}${about ? `\n\n  ${about}\n` : ''}`
  }

  const scheduled = agenda.sessions.filter((s) => s.start).sort((a, b) => a.start!.localeCompare(b.start!) || a.title.localeCompare(b.title))
  const days = new Map<string, Session[]>()
  for (const s of scheduled) {
    const key = fmt.dayKey(s.start!)
    days.set(key, [...(days.get(key) ?? []), s])
  }
  const site = (path: string) => new URL(path, opts.siteUrl).href

  const out = [
    `# ${TITLE}`,
    '',
    `> ${SUMMARY}`,
    '',
    'To add sessions to a calendar, join their ids with commas:',
    site('/calendar.ics?s=SESS-222,SESS-229'),
    '',
    'Not affiliated with the event organisers. Check the official',
    `sessions page (${opts.officialUrl})`,
    'before you rely on a time or room.',
    '',
    ...(opts.full ? [] : [`Abstracts for every session: ${site('/llms-full.txt')}`, '']),
  ]
  for (const sessions of days.values()) {
    out.push(`## ${fmt.dayLong(sessions[0].start!)}`, '', ...sessions.map(line), '')
  }
  const unscheduled = agenda.sessions.filter((s) => !s.start).sort((a, b) => a.title.localeCompare(b.title))
  if (unscheduled.length) out.push('## Not scheduled yet', '', ...unscheduled.map(line), '')
  return out.join('\n')
}
