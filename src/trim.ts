import { safeUrl, sanitizeHtml } from './sanitize'
import type { Agenda, Link, Session, Speaker } from './types'

const FALLBACK_COLOUR = '#8a94a6'

type Raw = Record<string, unknown>

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function iso(value: unknown): string | null {
  const s = str(value)
  return s && !Number.isNaN(Date.parse(s)) ? s : null
}

function trimSpeaker(raw: Raw): Speaker {
  const links: Link[] = []
  for (const [label, key] of [['LinkedIn', 'linkedin_url'], ['X', 'twitter_url'], ['Website', 'website']] as const) {
    const url = safeUrl(raw[key])
    if (url) links.push({ label, url })
  }
  return {
    id: str(raw.friendly_id) || str(raw.id),
    name: str(raw.full_name) || `${str(raw.first_name)} ${str(raw.last_name)}`.trim(),
    title: str(raw.title),
    company: str(raw.company_name),
    photo: safeUrl(raw.photo) ?? '',
    about: sanitizeHtml(str(raw.about)),
    links,
  }
}

export function trim(feed: unknown, fetchedAt: string): Agenda {
  if (!Array.isArray(feed) || feed.length === 0) throw new Error('Feed is not a non-empty array')
  const speakers: Record<string, Speaker> = {}
  const sessions: Session[] = feed.map((raw: Raw) => {
    const speakerIds: string[] = []
    for (const s of Array.isArray(raw.speakers) ? (raw.speakers as Raw[]) : []) {
      const speaker = trimSpeaker(s)
      speakers[speaker.id] = speaker
      speakerIds.push(speaker.id)
    }
    const colour = str(raw.track_color)
    return {
      id: str(raw.friendly_id) || str(raw.id),
      title: str(raw.title),
      description: sanitizeHtml(str(raw.description)),
      format: str(raw.format),
      level: str(raw.level),
      track: str(raw.track),
      trackColor: /^#[0-9a-f]{3,8}$/i.test(colour) ? colour : FALLBACK_COLOUR,
      start: iso(raw.starts_at),
      end: iso(raw.ends_at),
      room: str(raw.location) || null,
      speakerIds,
    }
  })
  return { fetchedAt, sessions, speakers }
}
