import { withDemoSchedule } from './demo'
import { withExtras } from './extras'
import { buildIcs } from './ics'
import { esc } from './html'
import { renderPage } from './list'
import { renderLlms } from './llms'
import { renderSessionPage } from './session'
import { findSession, sessionPath, slugFor } from './slug'
import { trim } from './trim'
import type { Agenda } from './types'

interface Env {
  AGENDA: KVNamespace
  FEED_URL: string
  OFFICIAL_URL: string
  EVENT_TIMEZONE: string
  DEMO_SCHEDULE?: string
}

const KEY = 'agenda'

const PAGE_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'public, max-age=0, must-revalidate',
  'content-security-policy':
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://content-cdn.sessionboard.com; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'referrer-policy': 'same-origin',
  'x-content-type-options': 'nosniff',
}

async function refresh(env: Env): Promise<Agenda> {
  const res = await fetch(env.FEED_URL, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Feed returned ${res.status}`)
  const agenda = trim(await res.json(), new Date().toISOString())
  await env.AGENDA.put(KEY, JSON.stringify(agenda))
  console.log(`Stored ${agenda.sessions.length} sessions`)
  return agenda
}

async function load(env: Env): Promise<Agenda | null> {
  const cached = await env.AGENDA.get<Agenda>(KEY, 'json')
  if (cached) return cached
  try {
    return await refresh(env)
  } catch (err) {
    console.error('Initial refresh failed', err)
    return null
  }
}

function message(status: number, text: string): Response {
  const body = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Agenda</title><link rel="stylesheet" href="/app.css"><main class="notice"><p>${esc(text)}</p><p><a href="/">Back to the agenda</a></p></main></html>`
  return new Response(body, { status, headers: { ...PAGE_HEADERS, 'cache-control': 'no-store' } })
}

function calendar(agenda: Agenda, ids: string[], origin: string, filename: string): Response {
  const wanted = new Set(ids)
  const sessions = agenda.sessions.filter((s) => wanted.has(s.id) && s.start)
  if (sessions.length === 0) return message(404, 'None of those sessions have a time yet, so there is nothing to add to your calendar.')
  return new Response(buildIcs(sessions, agenda.speakers, origin, agenda.fetchedAt), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'public, max-age=300',
    },
  })
}

function pickDemo(request: Request, url: URL, allowed: boolean): { demo: boolean; cookie?: string } {
  if (!allowed) return { demo: false }
  const asked = url.searchParams.get('demo')
  if (asked === '0' || asked === '1') return { demo: asked === '1', cookie: `demo=${asked}; Path=/; SameSite=Lax` }
  return { demo: !/(?:^|;\s*)demo=0/.test(request.headers.get('cookie') ?? '') }
}

function html(body: string, ...cookies: (string | undefined)[]): Response {
  const headers = new Headers(PAGE_HEADERS)
  for (const c of cookies) if (c) headers.append('set-cookie', c)
  return new Response(body, { headers })
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 })
    const url = new URL(request.url)
    const loaded = await load(env)
    if (!loaded) return message(503, "The agenda hasn't loaded yet. Try again in a minute.")
    const devTools = env.DEMO_SCHEDULE === '1'
    const { demo, cookie: demoCookie } = pickDemo(request, url, devTools)
    const agenda = withExtras(demo ? withDemoSchedule(loaded) : loaded)

    if (url.pathname === '/') {
      return html(renderPage(agenda, { officialUrl: env.OFFICIAL_URL, timeZone: env.EVENT_TIMEZONE, demo, devTools, siteUrl: url.origin }), demoCookie)
    }
    if (url.pathname === '/llms.txt' || url.pathname === '/llms-full.txt') {
      const body = renderLlms(agenda, { timeZone: env.EVENT_TIMEZONE, siteUrl: url.origin, officialUrl: env.OFFICIAL_URL, full: url.pathname === '/llms-full.txt' })
      return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate', 'x-content-type-options': 'nosniff' } })
    }
    if (url.pathname === '/calendar.ics') {
      return calendar(agenda, (url.searchParams.get('s') ?? '').split(','), url.origin, 'starred-sessions.ics')
    }
    const sessionRoute = /^\/s\/([A-Za-z0-9-]+?)(\.ics)?\/?$/.exec(url.pathname)
    if (sessionRoute) {
      const [, segment, ics] = sessionRoute
      const session = findSession(agenda, segment)
      if (!session) return message(404, "That session isn't in the agenda. It may have been removed or renamed.")
      const canonical = sessionPath(session) + (ics ?? '')
      if (url.pathname !== canonical) return Response.redirect(new URL(canonical + url.search, url.origin).href, 301)
      if (ics) return calendar(agenda, [session.id], url.origin, `${slugFor(session)}.ics`)
      return html(renderSessionPage(agenda, session, { officialUrl: env.OFFICIAL_URL, timeZone: env.EVENT_TIMEZONE, demo, devTools, siteUrl: url.origin }), demoCookie)
    }

    return message(404, "Offset out of range. There's no page here.")
  },

  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(refresh(env).catch((err) => console.error('Scheduled refresh failed; keeping last good copy', err)))
  },
} satisfies ExportedHandler<Env>
