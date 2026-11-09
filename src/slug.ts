import type { Agenda, Session } from './types'

const MAX = 60

export function slugify(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (base.length <= MAX) return base
  const cut = base.slice(0, MAX + 1)
  return cut.slice(0, cut.lastIndexOf('-') > 0 ? cut.lastIndexOf('-') : MAX)
}

function number(s: Session): string {
  return /^SESS-(\d+)$/.exec(s.id)?.[1] ?? s.id.toLowerCase()
}

export function slugFor(s: Session): string {
  const words = slugify(s.title)
  return words ? `${words}-${number(s)}` : number(s)
}

// Where a row links: its session page, or the page an extra was published on.
export function sessionHref(s: Session): string {
  return s.link ?? sessionPath(s)
}

export function sessionPath(s: Session): string {
  return `/s/${slugFor(s)}`
}

export function findSession(agenda: Agenda, segment: string): Session | undefined {
  const legacy = /^SESS-\d+$/.exec(segment)
  if (legacy) return agenda.sessions.find((s) => s.id === segment)
  const n = /(?:^|-)(\d+)$/.exec(segment)?.[1]
  return n ? agenda.sessions.find((s) => s.id === `SESS-${n}`) : undefined
}
