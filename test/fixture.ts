export const speakerRaw = {
  id: 'c521f01f-0000-0000-0000-000000000001',
  friendly_id: 'CONT-1',
  full_name: 'Ada Example',
  first_name: 'Ada',
  last_name: 'Example',
  title: 'Principal Engineer',
  company_name: 'Acme',
  photo: 'https://content-cdn.sessionboard.com/ada.jpg',
  about: '<p>Ada builds <strong>things</strong>.</p>',
  linkedin_url: 'https://www.linkedin.com/in/ada-example/',
  twitter_url: 'javascript:alert(1)',
  website: '',
  not_on_allowlist: 'unlisted value',
  also_not_on_allowlist: 'second unlisted value',
}

export function sessionRaw(over: Record<string, unknown> = {}) {
  return {
    id: '242df842-0000-0000-0000-000000000001',
    friendly_id: 'SESS-1',
    title: 'Exactly-once & you',
    description: '<p>Hello <span style="color:red">world</span></p>',
    format: 'Breakout Session',
    level: 'Intermediate',
    track: 'Data Streaming',
    track_color: '#329af0',
    starts_at: '2026-11-04T17:00:00.000Z',
    ends_at: '2026-11-04T17:45:00.000Z',
    location: 'Room 2004',
    company: 'Acme',
    speakers: [speakerRaw],
    ...over,
  }
}
