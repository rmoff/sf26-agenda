export interface Link {
  label: string
  url: string
}

export interface Speaker {
  id: string
  name: string
  title: string
  company: string
  photo: string
  about: string
  links: Link[]
}

export interface Session {
  id: string
  title: string
  description: string
  format: string
  level: string
  track: string
  trackColor: string
  start: string | null
  end: string | null
  room: string | null
  speakerIds: string[]
  // Items from outside the feed (see extras.ts).
  link?: string
  calendarEnd?: string
  kind?: 'run'
}

export interface Agenda {
  fetchedAt: string
  sessions: Session[]
  speakers: Record<string, Speaker>
}
