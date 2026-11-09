import type { Session, Speaker } from './types'

export interface RenderOptions {
  officialUrl: string
  timeZone: string
  demo?: boolean
  devTools?: boolean
  siteUrl: string
}

export function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function sentence(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : ''
}

export function formatters(timeZone: string) {
  const time = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' })
  const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
  const dayLong = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric' })
  const dayShort = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', month: 'short', day: 'numeric' })
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' })
  const updated = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
  const t = (iso: string) => time.format(new Date(iso)).replace(/\s(AM|PM)$/, '\u00a0$1')
  return {
    time: t,
    range: (start: string, end: string) => {
      const [a, b] = [t(start), t(end)]
      return a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)}–${b}` : `${a}–${b}`
    },
    dayKey: (iso: string) => dayKey.format(new Date(iso)),
    dayLong: (iso: string) => dayLong.format(new Date(iso)),
    dayShort: (iso: string) => dayShort.format(new Date(iso)),
    weekday: (iso: string) => weekday.format(new Date(iso)),
    updated: (iso: string) => updated.format(new Date(iso)),
  }
}

export type Fmt = ReturnType<typeof formatters>

export function when(s: Session, fmt: Fmt): string {
  if (!s.start) return ''
  return s.end && s.end > s.start ? fmt.range(s.start, s.end) : fmt.time(s.start)
}

// Formats that get a card of their own: full width on the agenda, and a
// matching header on their session page.
const FEATURE: Record<string, string> = { Keynote: 'feature-keynote', Social: 'feature-party' }

export function featureClass(s: Session): string | undefined {
  if (s.kind === 'run') return 'feature-run'
  if (s.format === 'Social' && /welcome reception/i.test(s.title)) return 'feature-reception'
  if (s.format === 'Social' && /after.?party/i.test(s.title)) return 'feature-afterparty'
  return FEATURE[s.format ?? '']
}

// Decorations for a card, by its feature class.
export function featureDecor(feature: string | undefined): string {
  const decor: Record<string, string> = { 'feature-party': PARTY_DECOR, 'feature-afterparty': AFTERPARTY_DECOR, 'feature-reception': RECEPTION_DECOR, 'feature-run': RUN_DECOR }
  return decor[feature ?? ''] ?? ''
}

// The party card: Mission papel picado, Chinatown lanterns, fireworks, and a
// skyline with Coit Tower, the Transamerica Pyramid and the Bay Lights over
// the water, for the neighbourhoods in the party's description.
// The run/walk card: sunrise over the Golden Gate from Marin to the Presidio,
// a runner crossing the deck with the Chrome dino in pursuit, fog below.
export const RUN_DECOR = `<span class="run-decor" aria-hidden="true"><span class="sun"></span><span class="bay-water"></span><span class="bridge"><svg class="cables" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="hill" d="M0 100V48Q60 30 120 52Q150 62 175 78V100Z"/><path class="hill" d="M1000 100V56Q950 46 900 64Q870 74 850 82V100Z"/><path class="hangers" d="M270 12.3V72M290 16.2V72M310 19.8V72M330 23.1V72M350 25.9V72M370 28.4V72M390 30.6V72M410 32.4V72M430 33.8V72M450 34.9V72M470 35.6V72M490 36.0V72M510 36.0V72M530 35.6V72M550 34.9V72M570 33.8V72M590 32.4V72M610 30.6V72M630 28.4V72M650 25.9V72M670 23.1V72M690 19.8V72M710 16.2V72M730 12.3V72M40 44.6V72M60 39.5V72M80 34.8V72M100 30.4V72M120 26.3V72M140 22.6V72M160 19.2V72M180 16.1V72M200 13.4V72M220 11.0V72M240 8.9V72M760 8.9V72M780 11.0V72M800 13.4V72M820 16.1V72M840 19.2V72M860 22.6V72M880 26.3V72M900 30.4V72M920 34.8V72M940 39.5V72M960 44.6V72"/><path class="cable" d="M20 50Q135 18 250 8Q500 64 750 8Q865 18 980 50"/><rect class="deck" x="0" y="72" width="1000" height="3"/></svg><span class="tower-at" style="left:25%"><svg class="tower" viewBox="0 0 20 100" preserveAspectRatio="xMidYMax meet"><rect x="3" y="7" width="4" height="93"/><rect x="13" y="7" width="4" height="93"/><rect x="2.5" y="4" width="5" height="3"/><rect x="12.5" y="4" width="5" height="3"/><rect x="3.5" y="2" width="3" height="2"/><rect x="13.5" y="2" width="3" height="2"/><rect x="3" y="13" width="14" height="2.5"/><rect x="3" y="30" width="14" height="2.5"/><rect x="3" y="48" width="14" height="2.5"/><rect x="3" y="78" width="14" height="3"/></svg></span><span class="tower-at" style="left:75%"><svg class="tower" viewBox="0 0 20 100" preserveAspectRatio="xMidYMax meet"><rect x="3" y="7" width="4" height="93"/><rect x="13" y="7" width="4" height="93"/><rect x="2.5" y="4" width="5" height="3"/><rect x="12.5" y="4" width="5" height="3"/><rect x="3.5" y="2" width="3" height="2"/><rect x="13.5" y="2" width="3" height="2"/><rect x="3" y="13" width="14" height="2.5"/><rect x="3" y="30" width="14" height="2.5"/><rect x="3" y="48" width="14" height="2.5"/><rect x="3" y="78" width="14" height="3"/></svg></span><span class="chase"><span class="mover"><svg class="runner" viewBox="0 0 10 11" width="10" height="11" shape-rendering="crispEdges"><rect x="4" y="0" width="1" height="1"/><rect x="5" y="0" width="1" height="1"/><rect x="4" y="1" width="1" height="1"/><rect x="5" y="1" width="1" height="1"/><rect x="5" y="2" width="1" height="1"/><rect x="3" y="3" width="1" height="1"/><rect x="4" y="3" width="1" height="1"/><rect x="5" y="3" width="1" height="1"/><rect x="6" y="3" width="1" height="1"/><rect x="2" y="4" width="1" height="1"/><rect x="4" y="4" width="1" height="1"/><rect x="5" y="4" width="1" height="1"/><rect x="7" y="4" width="1" height="1"/><rect x="1" y="5" width="1" height="1"/><rect x="4" y="5" width="1" height="1"/><rect x="5" y="5" width="1" height="1"/><rect x="8" y="5" width="1" height="1"/><rect x="4" y="6" width="1" height="1"/><rect x="5" y="6" width="1" height="1"/><rect x="4" y="7" width="1" height="1"/><rect x="5" y="7" width="1" height="1"/><g class="step-a"><rect x="3" y="8" width="1" height="1"/><rect x="6" y="8" width="1" height="1"/><rect x="2" y="9" width="1" height="1"/><rect x="7" y="9" width="1" height="1"/><rect x="1" y="10" width="1" height="1"/><rect x="8" y="10" width="1" height="1"/></g><g class="step-b"><rect x="4" y="8" width="1" height="1"/><rect x="5" y="8" width="1" height="1"/><rect x="4" y="9" width="1" height="1"/><rect x="6" y="9" width="1" height="1"/><rect x="4" y="10" width="1" height="1"/><rect x="7" y="10" width="1" height="1"/></g></svg></span><span class="mover chaser"><svg class="dino" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><rect x="10" y="0" width="1" height="1"/><rect x="11" y="0" width="1" height="1"/><rect x="12" y="0" width="1" height="1"/><rect x="13" y="0" width="1" height="1"/><rect x="14" y="0" width="1" height="1"/><rect x="15" y="0" width="1" height="1"/><rect x="9" y="1" width="1" height="1"/><rect x="10" y="1" width="1" height="1"/><rect x="12" y="1" width="1" height="1"/><rect x="13" y="1" width="1" height="1"/><rect x="14" y="1" width="1" height="1"/><rect x="15" y="1" width="1" height="1"/><rect x="9" y="2" width="1" height="1"/><rect x="10" y="2" width="1" height="1"/><rect x="11" y="2" width="1" height="1"/><rect x="12" y="2" width="1" height="1"/><rect x="13" y="2" width="1" height="1"/><rect x="14" y="2" width="1" height="1"/><rect x="15" y="2" width="1" height="1"/><rect x="9" y="3" width="1" height="1"/><rect x="10" y="3" width="1" height="1"/><rect x="11" y="3" width="1" height="1"/><rect x="12" y="3" width="1" height="1"/><rect x="13" y="3" width="1" height="1"/><rect x="14" y="3" width="1" height="1"/><rect x="15" y="3" width="1" height="1"/><rect x="9" y="4" width="1" height="1"/><rect x="10" y="4" width="1" height="1"/><rect x="11" y="4" width="1" height="1"/><rect x="12" y="4" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="11" y="5" width="1" height="1"/><rect x="12" y="5" width="1" height="1"/><rect x="13" y="5" width="1" height="1"/><rect x="14" y="5" width="1" height="1"/><rect x="0" y="6" width="1" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="9" y="6" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/><rect x="11" y="6" width="1" height="1"/><rect x="12" y="6" width="1" height="1"/><rect x="0" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/><rect x="8" y="7" width="1" height="1"/><rect x="9" y="7" width="1" height="1"/><rect x="10" y="7" width="1" height="1"/><rect x="11" y="7" width="1" height="1"/><rect x="12" y="7" width="1" height="1"/><rect x="13" y="7" width="1" height="1"/><rect x="0" y="8" width="1" height="1"/><rect x="1" y="8" width="1" height="1"/><rect x="6" y="8" width="1" height="1"/><rect x="7" y="8" width="1" height="1"/><rect x="8" y="8" width="1" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="10" y="8" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/><rect x="12" y="8" width="1" height="1"/><rect x="14" y="8" width="1" height="1"/><rect x="0" y="9" width="1" height="1"/><rect x="1" y="9" width="1" height="1"/><rect x="2" y="9" width="1" height="1"/><rect x="5" y="9" width="1" height="1"/><rect x="6" y="9" width="1" height="1"/><rect x="7" y="9" width="1" height="1"/><rect x="8" y="9" width="1" height="1"/><rect x="9" y="9" width="1" height="1"/><rect x="10" y="9" width="1" height="1"/><rect x="11" y="9" width="1" height="1"/><rect x="12" y="9" width="1" height="1"/><rect x="13" y="9" width="1" height="1"/><rect x="0" y="10" width="1" height="1"/><rect x="1" y="10" width="1" height="1"/><rect x="2" y="10" width="1" height="1"/><rect x="3" y="10" width="1" height="1"/><rect x="4" y="10" width="1" height="1"/><rect x="5" y="10" width="1" height="1"/><rect x="6" y="10" width="1" height="1"/><rect x="7" y="10" width="1" height="1"/><rect x="8" y="10" width="1" height="1"/><rect x="9" y="10" width="1" height="1"/><rect x="10" y="10" width="1" height="1"/><rect x="1" y="11" width="1" height="1"/><rect x="2" y="11" width="1" height="1"/><rect x="3" y="11" width="1" height="1"/><rect x="4" y="11" width="1" height="1"/><rect x="5" y="11" width="1" height="1"/><rect x="6" y="11" width="1" height="1"/><rect x="7" y="11" width="1" height="1"/><rect x="8" y="11" width="1" height="1"/><rect x="9" y="11" width="1" height="1"/><rect x="2" y="12" width="1" height="1"/><rect x="3" y="12" width="1" height="1"/><rect x="4" y="12" width="1" height="1"/><rect x="5" y="12" width="1" height="1"/><rect x="6" y="12" width="1" height="1"/><rect x="7" y="12" width="1" height="1"/><rect x="8" y="12" width="1" height="1"/><g class="step-a"><rect x="3" y="13" width="1" height="1"/><rect x="4" y="13" width="1" height="1"/><rect x="7" y="13" width="1" height="1"/><rect x="8" y="13" width="1" height="1"/><rect x="3" y="14" width="1" height="1"/><rect x="9" y="14" width="1" height="1"/><rect x="10" y="14" width="1" height="1"/><rect x="3" y="15" width="1" height="1"/><rect x="4" y="15" width="1" height="1"/></g><g class="step-b"><rect x="3" y="13" width="1" height="1"/><rect x="4" y="13" width="1" height="1"/><rect x="7" y="13" width="1" height="1"/><rect x="8" y="13" width="1" height="1"/><rect x="4" y="14" width="1" height="1"/><rect x="5" y="14" width="1" height="1"/><rect x="8" y="14" width="1" height="1"/><rect x="8" y="15" width="1" height="1"/><rect x="9" y="15" width="1" height="1"/></g></svg></span></span></span><span class="fog"></span></span>`

export const PARTY_DECOR = `<span class="party-decor" aria-hidden="true">
<svg class="bunting" width="100%" height="20"><defs><pattern id="papel" width="180" height="20" patternUnits="userSpaceOnUse"><path transform="translate(0 0)" d="M3 3h24v10l-4 4-4-4-4 4-4-4-4 4-4-4z" fill="#ff5fa2"/><path transform="translate(0 0)" d="M15 6l2.5 2.5-2.5 2.5-2.5-2.5z" fill="#1a1240" opacity=".55"/><path transform="translate(30 0)" d="M3 3h24v10l-4 4-4-4-4 4-4-4-4 4-4-4z" fill="#ffcd00"/><path transform="translate(30 0)" d="M15 6l2.5 2.5-2.5 2.5-2.5-2.5z" fill="#1a1240" opacity=".55"/><path transform="translate(60 0)" d="M3 3h24v10l-4 4-4-4-4 4-4-4-4 4-4-4z" fill="#5fd4ff"/><path transform="translate(60 0)" d="M15 6l2.5 2.5-2.5 2.5-2.5-2.5z" fill="#1a1240" opacity=".55"/><path transform="translate(90 0)" d="M3 3h24v10l-4 4-4-4-4 4-4-4-4 4-4-4z" fill="#9dff7a"/><path transform="translate(90 0)" d="M15 6l2.5 2.5-2.5 2.5-2.5-2.5z" fill="#1a1240" opacity=".55"/><path transform="translate(120 0)" d="M3 3h24v10l-4 4-4-4-4 4-4-4-4 4-4-4z" fill="#ff8a3d"/><path transform="translate(120 0)" d="M15 6l2.5 2.5-2.5 2.5-2.5-2.5z" fill="#1a1240" opacity=".55"/><path transform="translate(150 0)" d="M3 3h24v10l-4 4-4-4-4 4-4-4-4 4-4-4z" fill="#b98cff"/><path transform="translate(150 0)" d="M15 6l2.5 2.5-2.5 2.5-2.5-2.5z" fill="#1a1240" opacity=".55"/></pattern></defs><path d="M0 3H4000" stroke="rgb(255 255 255 / 0.5)"/><rect width="100%" height="20" fill="url(#papel)"/></svg>
<span class="lanterns">${'<span class="lantern"><svg viewBox="0 0 20 40" width="20" height="40"><path d="M10 0v8" stroke="#ffcd00"/><rect x="6" y="7" width="8" height="3" rx="1" fill="#ffcd00"/><ellipse cx="10" cy="19" rx="9" ry="9" fill="#e8262b"/><path d="M10 10v18M5 11.5q-2.5 7.5 0 15M15 11.5q2.5 7.5 0 15" stroke="#9e1016" fill="none" stroke-width=".8"/><rect x="6" y="27" width="8" height="3" rx="1" fill="#ffcd00"/><path d="M10 30v8" stroke="#ffcd00" stroke-width="1.5"/></svg></span>'.repeat(3)}</span>
<span class="fireworks">${'<i></i>'.repeat(8)}</span>
<svg class="skyline" viewBox="0 0 400 60" width="400" height="60"><g fill="#140b30"><rect x="38" y="10" width="4" height="40"/><rect x="118" y="10" width="4" height="40"/><rect x="0" y="42" width="175" height="3"/><path d="M168 60Q215 26 262 60Z"/><rect x="209" y="20" width="12" height="26"/><rect x="207" y="17" width="16" height="4"/><path d="M300 60L309 2 318 60Z"/><rect x="262" y="34" width="18" height="26"/><rect x="282" y="26" width="14" height="34"/><rect x="322" y="22" width="20" height="38"/><rect x="344" y="32" width="16" height="28"/><rect x="362" y="18" width="14" height="42"/><rect x="378" y="30" width="22" height="30"/></g><path d="M0 34Q20 14 40 11Q80 40 120 11Q140 14 170 36" fill="none" stroke="#140b30" stroke-width="1.5"/><g class="bay-lights" fill="#ffffff"><circle cx="48" cy="16.2" r="1.2"/><circle cx="56" cy="20.3" r="1.2"/><circle cx="64" cy="23.2" r="1.2"/><circle cx="72" cy="24.9" r="1.2"/><circle cx="80" cy="25.5" r="1.2"/><circle cx="88" cy="24.9" r="1.2"/><circle cx="96" cy="23.2" r="1.2"/><circle cx="104" cy="20.3" r="1.2"/><circle cx="112" cy="16.2" r="1.2"/></g><g fill="#ffcd00" opacity=".6"><rect x="266" y="40" width="2" height="2"/><rect x="286" y="30" width="2" height="2"/><rect x="290" y="38" width="2" height="2"/><rect x="326" y="28" width="2" height="2"/><rect x="334" y="36" width="2" height="2"/><rect x="326" y="44" width="2" height="2"/><rect x="348" y="38" width="2" height="2"/><rect x="366" y="24" width="2" height="2"/><rect x="370" y="34" width="2" height="2"/><rect x="382" y="36" width="2" height="2"/><rect x="390" y="44" width="2" height="2"/></g></svg>
<span class="bay"></span>
</span>`


// The welcome reception: golden hour after the travel day, with festoon
// lights and drinks. Warm, but still, so the party keeps the fireworks.
export const RECEPTION_DECOR = `<span class="reception-decor" aria-hidden="true"><svg class="festoon" width="100%" height="22"><defs><pattern id="festoon" width="60" height="22" patternUnits="userSpaceOnUse"><path d="M0 4Q30 14 60 4" fill="none" stroke="#5a3a26" stroke-width="1"/><rect x="13.8" y="7.25" width="2.4" height="2.2" fill="#5a3a26"/><circle cx="15" cy="11.35" r="2.6" fill="#ffd36b"/><rect x="28.8" y="8.5" width="2.4" height="2.2" fill="#5a3a26"/><circle cx="30" cy="12.6" r="2.6" fill="#ffd36b"/><rect x="43.8" y="7.25" width="2.4" height="2.2" fill="#5a3a26"/><circle cx="45" cy="11.35" r="2.6" fill="#ffd36b"/></pattern></defs><rect width="100%" height="22" fill="url(#festoon)"/></svg><svg class="skyline" viewBox="160 0 240 60" width="240" height="60"><g fill="currentColor"><path d="M168 60Q215 26 262 60Z"/><rect x="209" y="20" width="12" height="26"/><rect x="207" y="17" width="16" height="4"/><path d="M300 60L309 2 318 60Z"/><rect x="262" y="34" width="18" height="26"/><rect x="282" y="26" width="14" height="34"/><rect x="322" y="22" width="20" height="38"/><rect x="344" y="32" width="16" height="28"/><rect x="362" y="18" width="14" height="42"/><rect x="378" y="30" width="22" height="30"/></g></svg></span>`

// The after party: late night at a ping-pong club. Neon tubes, and a neon
// table with a game of Pong going over the net.
export const AFTERPARTY_DECOR = `<span class="afterparty-decor" aria-hidden="true"><span class="neon neon-a"></span><span class="neon neon-b"></span><span class="pong"><svg class="table" viewBox="0 0 200 60"><path class="top" d="M24 38H176M100 38V33M40 38V58M160 38V58"/></svg><span class="paddle paddle-l"></span><span class="paddle paddle-r"></span><span class="ball-x"><span class="ball"></span></span></span></span>`

export const ICON = {
  star: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/></svg>',
  calendarAdd: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4M12 12.5v5M9.5 15h5"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7 10.5H5.5v10h13v-10H17"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
}

export function speakerNames(s: Session, speakers: Record<string, Speaker>): string {
  return s.speakerIds
    .map((id) => speakers[id])
    .filter(Boolean)
    .map((p) => `<span class="person">${esc(p.name)}${p.company ? `<span class="org">, ${esc(p.company)}</span>` : ''}</span>`)
    .join('')
}

export function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

export function page(opts: RenderOptions & { title: string; shareTitle?: string; description: string; path: string; body: string; bodyClass: string }): string {
  const abs = (path: string) => esc(new URL(path, opts.siteUrl).href)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Unofficial Current SF 26 agenda">
<meta property="og:title" content="${esc(opts.shareTitle ?? opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:url" content="${abs(opts.path)}">
<meta property="og:image" content="${abs('/og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="color-scheme" content="light dark">
<meta name="robots" content="noindex">
<link rel="preload" href="/fonts/overpass-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/app.css">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
</head>
<body class="${opts.bodyClass}">
${opts.devTools ? devBanner(Boolean(opts.demo)) : ''}
${opts.body}
<script src="/app.js" defer></script>
</body>
</html>
`
}

function devBanner(demo: boolean): string {
  const note = demo ? 'Demo schedule: times and rooms are made up.' : 'Real feed.'
  const toggle = demo ? '<strong>on</strong> <a href="?demo=0">off</a>' : '<a href="?demo=1">on</a> <strong>off</strong>'
  return `<p class="demo-banner">${note} <span class="switch">Demo: ${toggle}</span></p>`
}

export function footer(fetchedAt: string, fmt: Fmt, officialUrl: string): string {
  return `<footer class="foot">
  <p>Session list last updated ${esc(fmt.updated(fetchedAt))}. Not affiliated with the event organisers. Check the <a href="${esc(officialUrl)}">official sessions page</a> before you rely on a time or room.</p>
</footer>`
}
