import { describe, expect, it } from 'vitest'
import { findSession, slugFor, slugify } from '../src/slug'
import { trim } from '../src/trim'
import { sessionRaw } from './fixture'

describe('slugify', () => {
  it('makes readable ASCII slugs', () => {
    expect(slugify("Kafka & Flink: What's new in 2.x?")).toBe('kafka-and-flink-whats-new-in-2-x')
    expect(slugify('Café résumé')).toBe('cafe-resume')
  })

  it('cuts long titles at a word boundary', () => {
    const slug = slugify('The Partition Tax: A Playbook for Right-Sizing Your Kafka Clusters in Production at Scale')
    expect(slug.length).toBeLessThanOrEqual(60)
    expect(slug).toBe('the-partition-tax-a-playbook-for-right-sizing-your-kafka')
  })
})

describe('slugFor and findSession', () => {
  const agenda = trim([sessionRaw({ friendly_id: 'SESS-32', title: 'Exactly-once & you' })], '2026-10-01T17:00:00.000Z')
  const s = agenda.sessions[0]

  it('appends the session number', () => {
    expect(slugFor(s)).toBe('exactly-once-and-you-32')
  })

  it('finds a session by its number whatever the words say', () => {
    expect(findSession(agenda, 'exactly-once-and-you-32')).toBe(s)
    expect(findSession(agenda, 'an-old-title-32')).toBe(s)
    expect(findSession(agenda, '32')).toBe(s)
    expect(findSession(agenda, 'SESS-32')).toBe(s)
    expect(findSession(agenda, 'exactly-once-and-you-33')).toBeUndefined()
    expect(findSession(agenda, 'no-number')).toBeUndefined()
  })
})
