import { textOf } from './sanitize'
import { sessionHref } from './slug'
import type { Session, Speaker } from './types'

export interface CalendarLinks {
  google: string
  outlook: string
  office: string
}

// One-off "add event" links for the web calendars. Apple Calendar and
// everything else get the .ics file instead.
export function calendarLinks(s: Session, speakers: Record<string, Speaker>, siteUrl: string): CalendarLinks | null {
  if (!s.start) return null
  const start = new Date(s.start).toISOString().replace(/\.\d{3}Z$/, 'Z')
  const until = s.end ?? s.calendarEnd
  const end = new Date(until && Date.parse(until) > Date.parse(s.start) ? until : s.start).toISOString().replace(/\.\d{3}Z$/, 'Z')
  const who = s.speakerIds.map((id) => speakers[id]?.name).filter(Boolean).join(', ')
  let about = textOf(s.description).replace(/\s+/g, ' ').trim()
  if (about.length > 600) about = `${about.slice(0, 600).replace(/\s+\S*$/, '')}…`
  const details = [new URL(sessionHref(s), siteUrl).href, who, about].filter(Boolean).join('\n\n')

  // encodeURIComponent, not URLSearchParams: Google reads '+' as a literal
  // plus and wants the '/' between the dates left as it is.
  const query = (params: Record<string, string>) =>
    Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%2F/g, '/')}`)
      .join('&')
  const compact = (iso: string) => iso.replace(/[-:]/g, '')
  const google = `https://calendar.google.com/calendar/render?${query({ action: 'TEMPLATE', text: s.title, dates: `${compact(start)}/${compact(end)}`, details, location: s.room ?? '' })}`
  const compose = (host: string) =>
    `https://${host}/calendar/0/action/compose?${query({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: s.title,
      startdt: start,
      enddt: end,
      location: s.room ?? '',
      body: details,
    })}`
  return { google, outlook: compose('outlook.live.com'), office: compose('outlook.office.com') }
}
