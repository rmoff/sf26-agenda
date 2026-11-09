import { describe, expect, it } from 'vitest'
import { trim } from '../src/trim'
import { sessionRaw, speakerRaw } from './fixture'

const NOW = '2026-10-01T17:00:00.000Z'

describe('trim', () => {
  it('drops every speaker field not on the allowlist', () => {
    const agenda = trim([sessionRaw()], NOW)
    const json = JSON.stringify(agenda)
    for (const value of ['unlisted value', 'second unlisted value']) {
      expect(json).not.toContain(value)
    }
    expect(Object.keys(agenda.speakers['CONT-1']).sort()).toEqual(['about', 'company', 'id', 'links', 'name', 'photo', 'title'])
  })

  it('maps sessions to the public shape', () => {
    const { sessions, fetchedAt } = trim([sessionRaw()], NOW)
    expect(fetchedAt).toBe(NOW)
    expect(sessions[0]).toEqual({
      id: 'SESS-1',
      title: 'Exactly-once & you',
      description: '<p>Hello world</p>',
      format: 'Breakout Session',
      level: 'Intermediate',
      track: 'Data Streaming',
      trackColor: '#329af0',
      start: '2026-11-04T17:00:00.000Z',
      end: '2026-11-04T17:45:00.000Z',
      room: 'Room 2004',
      speakerIds: ['CONT-1'],
    })
  })

  it('keeps only http(s) speaker links', () => {
    const { speakers } = trim([sessionRaw()], NOW)
    expect(speakers['CONT-1'].links).toEqual([{ label: 'LinkedIn', url: 'https://www.linkedin.com/in/ada-example/' }])
  })

  it('rejects a track colour that is not a hex value', () => {
    const { sessions } = trim([sessionRaw({ track_color: 'red;background:url(x)' })], NOW)
    expect(sessions[0].trackColor).toBe('#8a94a6')
  })

  it('treats missing times and rooms as null', () => {
    const { sessions } = trim([sessionRaw({ starts_at: null, ends_at: null, location: null })], NOW)
    expect(sessions[0]).toMatchObject({ start: null, end: null, room: null })
  })

  it('throws on a feed that is not a non-empty array', () => {
    expect(() => trim({}, NOW)).toThrow()
    expect(() => trim([], NOW)).toThrow()
  })
})
