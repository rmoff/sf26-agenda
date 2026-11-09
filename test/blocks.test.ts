import { describe, expect, it } from 'vitest'
import { blocks } from '../src/blocks'
import type { Session } from '../src/types'

function s(id: string, start: string, end: string): Session {
  return { id, title: id, description: '', format: '', level: '', track: '', trackColor: '#000', start: `2026-11-04T${start}:00.000Z`, end: `2026-11-04T${end}:00.000Z`, room: null, speakerIds: [] }
}

describe('blocks', () => {
  it('puts sessions that start during a block into that block', () => {
    const result = blocks([s('a', '18:00', '18:45'), s('b', '18:00', '18:45'), s('c', '18:20', '18:35'), s('d', '19:00', '19:45')])
    expect(result.map((b) => b.sessions.map((x) => x.id))).toEqual([['a', 'b', 'c'], ['d']])
    expect(result[0].end).toBe('2026-11-04T18:45:00.000Z')
  })

  it('extends the block end to cover a joined session that runs longer', () => {
    const [block] = blocks([s('a', '18:00', '18:45'), s('b', '18:30', '19:00')])
    expect(block.end).toBe('2026-11-04T19:00:00.000Z')
  })

  it('starts a new block when a session starts after the current one ends', () => {
    expect(blocks([s('a', '18:00', '18:15'), s('b', '18:20', '18:35')])).toHaveLength(2)
  })
})

describe('blocks with a long session', () => {
  it('starts a new block for a start time shared by several sessions, even mid-block', () => {
    const result = blocks([s('long', '18:00', '19:30'), s('x', '18:30', '19:15'), s('y', '18:30', '19:15'), s('z', '18:30', '19:15')])
    expect(result.map((b) => b.sessions.map((x) => x.id))).toEqual([['long'], ['x', 'y', 'z']])
  })
})
