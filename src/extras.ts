import type { Agenda, Session } from './types'

// Agenda items that aren't in the Sessionboard feed. Each one is public
// somewhere else and links there instead of to a session page.
export const EXTRAS: Session[] = [
  {
    id: 'RUN-2026',
    title: 'The unofficial Current San Francisco 2026 Run/Walk',
    description: '',
    format: '',
    level: '',
    track: '',
    trackColor: '',
    start: '2026-11-04T15:00:00.000Z',
    end: null,
    room: 'Golden Gate Bridge Welcome Center car park',
    speakerIds: [],
    link: 'https://rmoff.net/2026/10/16/the-unofficial-current-san-francisco-2026-run/walk/',
    calendarEnd: '2026-11-04T16:00:00.000Z',
    kind: 'run',
  },
]

export function withExtras(agenda: Agenda): Agenda {
  return { ...agenda, sessions: [...agenda.sessions, ...EXTRAS] }
}
