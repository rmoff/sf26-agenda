import { textOf } from './sanitize'
import { sessionHref } from './slug'
import type { Session, Speaker } from './types'

const encoder = new TextEncoder()

function escape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function fold(line: string): string {
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    const limit = parts.length === 0 ? 75 : 74
    if (bytes + size > limit) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += char
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

function stamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function buildIcs(sessions: Session[], speakers: Record<string, Speaker>, siteUrl: string, now = new Date().toISOString()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//sf26-agenda//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const s of sessions) {
    if (!s.start) continue
    const who = s.speakerIds.map((id) => speakers[id]?.name).filter(Boolean).join(', ')
    const description = [who, textOf(s.description)].filter(Boolean).join('\n\n')
    lines.push('BEGIN:VEVENT', `UID:${s.id}@sf26-agenda`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(s.start)}`)
    const end = s.end ?? s.calendarEnd
    if (end && Date.parse(end) > Date.parse(s.start)) lines.push(`DTEND:${stamp(end)}`)
    lines.push(`SUMMARY:${escape(s.title)}`)
    if (s.room) lines.push(`LOCATION:${escape(s.room)}`)
    if (description) lines.push(`DESCRIPTION:${escape(description)}`)
    lines.push(`URL:${new URL(sessionHref(s), siteUrl).href}`, 'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
