import type { Session } from './types'

export interface Block {
  start: string
  end: string
  typicalEnd: string
  sessions: Session[]
}

const MAJOR_START = 3

export function byTitle(a: Session, b: Session): number {
  return a.title.localeCompare(b.title)
}

export function byRoomThenTitle(a: Session, b: Session): number {
  return (a.room ?? '\uffff').localeCompare(b.room ?? '\uffff', 'en', { numeric: true }) || byTitle(a, b)
}

export function blocks(sorted: Session[]): Block[] {
  const startCounts = new Map<string, number>()
  for (const s of sorted) startCounts.set(s.start!, (startCounts.get(s.start!) ?? 0) + 1)
  const out: Block[] = []
  for (const s of sorted) {
    const current = out[out.length - 1]
    if (current && (s.start === current.start || (s.start! < current.end && startCounts.get(s.start!)! < MAJOR_START))) {
      current.sessions.push(s)
      continue
    }
    const end = sorted.filter((o) => o.start === s.start).reduce((max, o) => (o.end && o.end > max ? o.end : max), s.start!)
    out.push({ start: s.start!, end, typicalEnd: end, sessions: [s] })
  }
  for (const b of out) {
    b.end = b.sessions.reduce((max, o) => (o.end && o.end > max ? o.end : max), b.end)
    const ends = new Map<string, number>()
    for (const s of b.sessions) if (s.start === b.start) ends.set(s.end ?? b.start, (ends.get(s.end ?? b.start) ?? 0) + 1)
    b.typicalEnd = [...ends].sort((x, y) => y[1] - x[1])[0]?.[0] ?? b.end
    b.sessions.sort((x, y) => x.start!.localeCompare(y.start!) || byRoomThenTitle(x, y))
  }
  return out
}
