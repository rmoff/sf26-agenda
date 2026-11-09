(() => {
  const $ = (id) => document.getElementById(id)
  console.log('Unofficial agenda. No brokers were harmed in the making of this site.')

  const STORE_KEY = 'starred'
  function loadStars() {
    try {
      const ids = JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
      return new Set(Array.isArray(ids) ? ids : [])
    } catch {
      return new Set()
    }
  }
  function saveStars() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify([...starred]))
    } catch {}
  }
  const starred = loadStars()
  const starListeners = []

  function paintStar(btn) {
    const on = starred.has(btn.dataset.star)
    btn.setAttribute('aria-pressed', String(on))
    btn.closest('.session')?.classList.toggle('is-starred', on)
  }

  for (const btn of document.querySelectorAll('[data-star]')) {
    btn.hidden = false
    paintStar(btn)
    btn.addEventListener('click', () => {
      const id = btn.dataset.star
      if (starred.has(id)) starred.delete(id)
      else starred.add(id)
      saveStars()
      paintStar(btn)
      for (const fn of starListeners) fn()
    })
  }

  // Safari can restore this page from its back/forward cache after a star changed
  // on another page; reload them, or the next tap here saves the stale set over it.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return
    const fresh = loadStars()
    starred.clear()
    for (const id of fresh) starred.add(id)
    for (const btn of document.querySelectorAll('[data-star]')) paintStar(btn)
    for (const fn of starListeners) fn()
  })

  if (document.body.classList.contains('session-page')) {
    const back = $('back')
    try {
      const ref = document.referrer ? new URL(document.referrer) : null
      if (ref && ref.origin === location.origin && ref.pathname === '/' && history.length > 1) {
        back.addEventListener('click', (e) => {
          e.preventDefault()
          history.back()
        })
      }
    } catch {}

    // Picking a calendar opens it in a new tab or downloads the file, so close the menu.
    const calMenu = $('cal-menu')
    calMenu?.addEventListener('click', (e) => {
      if (e.target.closest('a')) calMenu.hidePopover()
    })

    const share = $('share')
    const shareStatus = $('share-status')
    const canShare = typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches
    // The phone's share sheet where there is one, otherwise copy the link.
    share.classList.toggle('can-share', canShare)
    share.title = canShare ? 'Share' : 'Copy link'
    share.setAttribute('aria-label', share.title)
    share.hidden = false
    share.addEventListener('click', async () => {
      const url = location.href.split('#')[0]
      if (canShare) {
        try {
          await navigator.share({ title: document.querySelector('h1').textContent, url })
        } catch {}
        return
      }
      try {
        await navigator.clipboard.writeText(url)
        shareStatus.textContent = 'Link copied'
      } catch {
        shareStatus.textContent = 'Copy the address from your browser bar'
      }
      shareStatus.hidden = false
      setTimeout(() => (shareStatus.hidden = true), 2500)
    })
    return
  }

  const dataEl = $('agenda-data')
  const bar = $('bar')
  const tools = $('tools')
  if (!dataEl || !bar || !tools) return

  const data = JSON.parse(dataEl.textContent)
  const byId = new Map(data.sessions.map((s) => [s.id, s]))
  const starCount = $('star-count')
  const starredToggle = $('starred-toggle')
  const nowBtn = $('now')
  const searchForm = $('search-form')
  const search = searchForm.elements.q
  const panel = $('filters')
  const selects = [...panel.querySelectorAll('select')]
  const status = $('status')
  const clearBtn = $('clear')
  const exportLink = $('export')
  const empty = $('empty')
  const agenda = $('agenda')
  const articles = [...document.querySelectorAll('article.session')]
  const timeGroups = [...document.querySelectorAll('.group')]
  const parts = [...document.querySelectorAll('.part')]
  const groupButtons = [...$('grouping').querySelectorAll('[data-group]')]
  const home = new Map(articles.map((a) => [a, a.parentElement]))
  let grouped = null
  let groups = timeGroups

  for (const article of articles) {
    const s = byId.get(article.id)
    s.text = `${article.querySelector('.row').textContent} ${s.track}`.toLowerCase()
  }

  const params = new URLSearchParams(location.search)
  let clockOffset = 0
  if (data.demo && params.get('now')) {
    const raw = params.get('now')
    const parsed = Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(raw) ? raw : `${raw}-08:00`)
    if (!Number.isNaN(parsed)) clockOffset = parsed - Date.now()
  }
  const now = () => new Date(Date.now() + clockOffset)

  const GROUPINGS = ['time', 'track', 'room']
  const SELECTS = ['day', 'track', 'level', 'format']
  const state = {
    group: GROUPINGS.includes(params.get('group')) ? params.get('group') : 'time',
    day: '',
    starredOnly: params.get('starred') === '1',
    q: params.get('q') || '',
    track: '',
    level: '',
    format: '',
  }
  for (const sel of selects) {
    const v = params.get(sel.name) || ''
    state[sel.name] = [...sel.options].some((o) => o.value === v) ? v : ''
    sel.value = state[sel.name]
  }
  search.value = state.q

  const endOf = (s) => (s.end && s.end > s.start ? s.end : new Date(Date.parse(s.start) + 60_000).toISOString())
  const isRunning = (s, t) => Boolean(s.start) && s.start <= t && t < endOf(s)
  const hasEnded = (s, t) => Boolean(s.start) && endOf(s) <= t

  function passesFilters(s, terms) {
    return (
      (!state.day || s.day === state.day) &&
      (!state.track || s.track === state.track) &&
      (!state.level || s.level === state.level) &&
      (!state.format || s.format === state.format) &&
      terms.every((t) => s.text.includes(t))
    )
  }

  // The session starred later carries the note; the one it clashes with,
  // starred earlier, just gets a tint. Stars are kept in the order they were
  // tapped.
  function updateClashes() {
    const order = [...starred]
    const mine = data.sessions.filter((s) => s.start && starred.has(s.id))
    for (const article of articles) {
      const note = article.querySelector('.clash')
      const s = byId.get(article.id)
      const clashes = starred.has(s.id) && s.start ? mine.filter((o) => o.id !== s.id && o.start < endOf(s) && s.start < endOf(o)) : []
      const earlier = clashes.filter((o) => order.indexOf(o.id) < order.indexOf(s.id))
      article.classList.toggle('is-clash', clashes.length > earlier.length)
      note.hidden = earlier.length === 0
      note.replaceChildren()
      if (earlier.length) {
        const quip = document.createElement('em')
        quip.textContent = "Unless you bring friends and form a consumer group, you'll have to pick one."
        note.append(`Clashes with ${earlier.map((o) => o.title).join(' and ')}. `, quip)
      }
    }
  }

  function syncUrl() {
    const next = new URLSearchParams()
    if (state.group !== 'time') next.set('group', state.group)
    if (state.starredOnly) next.set('starred', '1')
    if (state.q) next.set('q', state.q)
    for (const key of SELECTS) if (state[key]) next.set(key, state[key])
    if (clockOffset) next.set('now', params.get('now'))
    const qs = next.toString()
    history.replaceState(history.state, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`)
  }

  const NO_ROOM = 'Room not announced'
  const groupKey = {
    track: (s) => s.track || 'Other',
    room: (s) => s.room || NO_ROOM,
  }
  const groupOrder = {
    track: (a, b) => a.localeCompare(b),
    room: (a, b) => (a === NO_ROOM) - (b === NO_ROOM) || a.localeCompare(b, 'en', { numeric: true }),
  }

  function buildGroupedView(kind) {
    const view = document.createElement('section')
    view.className = 'part track-view'
    const byKey = new Map()
    const order = [...articles].sort((a, b) => {
      const x = byId.get(a.id)
      const y = byId.get(b.id)
      return (x.start ?? '\uffff').localeCompare(y.start ?? '\uffff') || x.title.localeCompare(y.title)
    })
    for (const article of order) {
      const key = groupKey[kind](byId.get(article.id))
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key).push(article)
    }
    const made = []
    for (const key of [...byKey.keys()].sort(groupOrder[kind])) {
      const group = document.createElement('div')
      group.className = 'group'
      const head = document.createElement('h3')
      head.className = 'slot'
      const name = document.createElement('span')
      name.className = 'slot-name'
      name.textContent = key
      head.append(name)
      const list = document.createElement('div')
      list.className = 'sessions'
      group.append(head, list)
      view.append(group)
      made.push({ list, articles: byKey.get(key) })
    }
    agenda.prepend(view)
    return { kind, view, made }
  }

  function setGrouping() {
    const kind = state.group
    document.body.classList.toggle('by-track', kind !== 'time')
    document.body.classList.toggle('by-room', kind === 'room')
    if (grouped && grouped.kind !== kind) {
      for (const article of articles) home.get(article).append(article)
      grouped.view.remove()
      grouped = null
      groups = timeGroups
    }
    if (kind !== 'time' && !grouped) {
      grouped = buildGroupedView(kind)
      for (const { list, articles: items } of grouped.made) list.append(...items)
      groups = [...grouped.view.querySelectorAll('.group')]
    }
  }

  function apply() {
    setGrouping()
    const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean)
    const t = now().toISOString()

    let shown = 0
    for (const article of articles) {
      const s = byId.get(article.id)
      const ok = passesFilters(s, terms) && (!state.starredOnly || starred.has(s.id))
      article.hidden = !ok
      if (ok) shown++
      const live = isRunning(s, t)
      const done = hasEnded(s, t)
      article.classList.toggle('is-live', live)
      article.classList.toggle('is-done', done)
      article.querySelector('.row-now').hidden = !(state.group !== 'time' && live)
      article.querySelector('.row-done').hidden = !done
    }

    for (const g of groups) g.hidden = !g.querySelector('article:not([hidden])')
    for (const g of timeGroups) {
      const live = g.dataset.start <= t && t < g.dataset.end
      g.classList.toggle('is-live', live)
      const badge = g.querySelector('.badge')
      if (badge) badge.hidden = !live
    }
    for (const p of parts) p.hidden = Boolean(grouped) || !p.querySelector('.group:not([hidden])')
    document.body.classList.toggle('one-day', parts.filter((p) => !p.hidden).length <= 1)

    for (const b of groupButtons) b.setAttribute('aria-pressed', String(b.dataset.group === state.group))

    const filtering = Boolean(terms.length || SELECTS.some((k) => state[k]))
    if (state.starredOnly && starred.size === 0) {
      empty.textContent = "You haven't starred any sessions yet. Tap the star next to a session to keep it here."
    } else if (/^zoo-?keeper$/.test(terms.join(''))) {
      empty.textContent = 'ZooKeeper retired in Kafka 4.0. Try searching for KRaft.'
    } else {
      empty.textContent = 'No sessions match.'
    }
    empty.hidden = shown > 0

    status.hidden = !filtering
    status.textContent = `${shown} ${shown === 1 ? 'match' : 'matches'}`
    if (shown > 0 && /^exactly-?once$/.test(terms.join(''))) status.textContent += shown === 1 ? ', delivered exactly once' : ', each delivered exactly once'
    clearBtn.disabled = !filtering

    starredToggle.setAttribute('aria-pressed', String(state.starredOnly))
    starCount.textContent = String(starred.size)
    starCount.hidden = starred.size === 0
    const scheduledStars = data.sessions.filter((s) => s.start && starred.has(s.id)).map((s) => s.id)
    exportLink.hidden = !state.starredOnly || scheduledStars.length === 0
    exportLink.href = `/calendar.ics?s=${scheduledStars.join(',')}`
    exportLink.textContent = `Add ${scheduledStars.length} starred to calendar`

    for (const sel of selects) sel.classList.toggle('is-set', Boolean(sel.value))
    syncUrl()
  }

  function jumpToNow() {
    const t = now().toISOString()
    const target = timeGroups.find((g) => !g.hidden && g.dataset.end > t) ?? timeGroups.find((g) => !g.hidden)
    if (!target) return
    const top = target.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 16
    window.scrollTo({ top })
    for (const g of timeGroups) g.classList.toggle('is-jumped', g === target)
  }

  const BEFORE = [
    (wait) => `Nothing's on yet. The brokers are still warming up: Current kicks off in ${wait}.`,
    (wait) => `Too early! Not even the coffee has been produced yet. First session in ${wait}.`,
    (wait) => `Nothing to consume yet, the topic's empty. Check back in ${wait}.`,
  ]
  const AFTER = [
    "That's a wrap. All offsets committed. See you at the next Current!",
    "You've reached the end of the stream. This conference's retention period has expired.",
    'Consumer lag: infinite. Current SF 2026 is over, but the recordings live on.',
  ]
  const pick = (list) => list[Math.floor(Math.random() * list.length)]

  // [count, unit], e.g. [19, 'day'].
  function until(ms) {
    const mins = Math.ceil(ms / 60_000)
    if (mins < 60) return [mins, 'minute']
    if (Math.round(mins / 60) < 24) return [Math.round(mins / 60), 'hour']
    return [Math.round(mins / 1440), 'day']
  }
  const untilText = ([n, unit]) => (n === 1 ? (unit === 'hour' ? 'an hour' : `a ${unit}`) : `${n} ${unit}s`)

  // Each mood borrows a card style: the keynote's spotlight before the
  // conference, the party's sky after it, and a quiet night
  // sky for the small hours.
  const NOTE_ART = {
    before: () => `<span class="log">${'<i></i>'.repeat(8)}</span>`,
    after: () => `<span class="log is-full">${'<i></i>'.repeat(8)}</span>`,
    night: () =>
      `<span class="moon"></span>${Array.from(
        { length: 14 },
        () => `<i class="twinkle" style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:-${Math.random() * 3}s"></i>`,
      ).join('')}`,
  }

  const nowNote = $('now-note')
  function showNote(text, { button = 'OK', mood, big } = {}) {
    nowNote.dataset.mood = mood ?? ''
    $('now-note-art').innerHTML = mood ? NOTE_ART[mood]() : ''
    const bigEl = $('now-note-big')
    bigEl.hidden = !big
    if (big) bigEl.innerHTML = `<span class="note-count">${big[0]}</span> <span class="note-unit">${big[1]}${big[0] === 1 ? '' : 's'} to go</span>`
    $('now-note-text').textContent = text
    $('now-note-ok').textContent = button
    nowNote.showPopover()
  }

  const pill = $('pill')
  let pillTimer = 0
  function showPill(text, ms = 2000) {
    pill.textContent = text
    pill.hidden = false
    clearTimeout(pillTimer)
    pillTimer = setTimeout(() => (pill.hidden = true), ms)
  }

  // Before the first session or after the last one there is no "now" to show,
  // so say so and stay put.
  function noteOutsideConference() {
    const t = now().toISOString()
    const timed = data.sessions.filter((s) => s.start)
    if (timed.length === 0) return false
    const first = timed.reduce((a, s) => (s.start < a ? s.start : a), timed[0].start)
    if (t < first) {
      const wait = until(Date.parse(first) - Date.parse(t))
      showNote(pick(BEFORE)(untilText(wait)), { mood: 'before', big: wait })
      return true
    }
    if (timed.every((s) => hasEnded(s, t))) {
      showNote(pick(AFTER), { mood: 'after' })
      return true
    }
    return false
  }

  function toTop() {
    const top = agenda.getBoundingClientRect().top + window.scrollY - bar.offsetHeight
    if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top) })
  }

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault()
    search.blur()
  })
  search.addEventListener('input', () => {
    state.q = search.value.trim()
    apply()
  })
  // Escape empties the box first, then leaves it.
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    if (!search.value) return search.blur()
    e.preventDefault()
    search.value = ''
    state.q = ''
    apply()
  })
  document.addEventListener('keydown', (e) => {
    // Cmd-K / Ctrl-K works from anywhere, like most sites; '/' only outside fields.
    const cmdK = (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k'
    if (!cmdK) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.closest('input, select, textarea')) return
    }
    e.preventDefault()
    search.focus()
    if (cmdK) search.select()
  })

  for (const sel of selects) {
    sel.addEventListener('change', () => {
      state[sel.name] = sel.value
      apply()
    })
  }
  clearBtn.addEventListener('click', () => {
    for (const key of SELECTS) state[key] = ''
    for (const sel of selects) sel.value = ''
    if (state.q) {
      state.q = ''
      search.value = ''
    }
    apply()
  })

  for (const b of groupButtons) {
    b.addEventListener('click', () => {
      state.group = b.dataset.group
      apply()
      toTop()
    })
  }

  starredToggle.addEventListener('click', () => {
    state.starredOnly = !state.starredOnly
    apply()
    toTop()
  })

  nowBtn.addEventListener('click', () => {
    if (noteOutsideConference()) return
    if (state.day) {
      state.day = ''
      panel.querySelector('select[name="day"]').value = ''
    }
    state.group = 'time'
    apply()
    jumpToNow()
  })


  starListeners.push(() => {
    updateClashes()
    apply()
  })

  function showTarget() {
    const id = decodeURIComponent(location.hash.slice(1))
    const article = id && document.getElementById(id)
    if (!article || !article.matches('article.session')) return
    if (article.hidden) {
      state.day = ''
      panel.querySelector('select[name="day"]').value = ''
      state.starredOnly = false
      apply()
    }
    article.scrollIntoView({ block: 'center' })
  }
  window.addEventListener('hashchange', showTarget)

  const setBarHeight = () => document.documentElement.style.setProperty('--bar-h', `${bar.offsetHeight}px`)
  bar.querySelector('.bar-actions').hidden = false
  tools.hidden = false
  setBarHeight()
  if ('ResizeObserver' in window) new ResizeObserver(setBarHeight).observe(bar)

  const scrollKey = () => `scroll:${location.pathname}${location.search}`
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  let leftAt = null
  window.addEventListener('pagehide', () => {
    leftAt = window.scrollY
    try {
      sessionStorage.setItem(scrollKey(), String(window.scrollY))
    } catch {}
  })
  function restoreScroll() {
    if (location.hash) return
    const nav = performance.getEntriesByType('navigation')[0]
    if (nav && nav.type !== 'back_forward') return
    let saved = null
    try {
      saved = sessionStorage.getItem(scrollKey())
    } catch {}
    if (saved !== null) window.scrollTo({ top: Number(saved) })
  }
  // Safari keeps this page in its back/forward cache, so the script doesn't run
  // again on Back, and with scrollRestoration manual it doesn't restore the
  // position itself either. The cached page remembers where it was left.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && leftAt !== null) window.scrollTo({ top: leftAt })
  })

  // Up between midnight and 5 AM on a conference day? Suggest bed, once a night.
  function nightCheck() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: data.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(now())
    const part = (type) => parts.find((p) => p.type === type).value
    const day = `${part('year')}-${part('month')}-${part('day')}`
    const hour = Number(part('hour'))
    if (hour >= 5 || !data.sessions.some((s) => s.day === day)) return
    try {
      if (sessionStorage.getItem(`night:${day}`)) return
      sessionStorage.setItem(`night:${day}`, '1')
    } catch {}
    const when = hour === 0 ? "It's past midnight" : `It's ${hour} AM`
    showNote(`${when}. The brokers are fine. Go to sleep.`, { button: 'Show me the agenda anyway', mood: 'night' })
  }

  // Three quick taps on the title start the digital rain. On a clean URL the
  // link would only reload the same view, so scroll to the top instead.
  let taps = []
  bar.querySelector('.brand a').addEventListener('click', (e) => {
    if (location.search || location.hash) return
    e.preventDefault()
    window.scrollTo({ top: 0 })
    const t = Date.now()
    taps = [...taps.filter((x) => t - x < 1500), t]
    if (taps.length < 3) return
    taps = []
    digitalRain()
  })

  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
  let konami = 0
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea')) return
    // Shift for a capital B or A arrives as its own keydown; don't let it reset the sequence.
    if (['Shift', 'CapsLock', 'Control', 'Alt', 'Meta'].includes(e.key)) return
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    if (key === KONAMI[konami]) konami++
    else if (key === 'ArrowUp') konami = konami === 2 ? 2 : 1
    else konami = 0
    if (konami < KONAMI.length) return
    konami = 0
    digitalRain()
  })

  // The visible rows dissolve into digital rain, a message types out, then
  // everything reassembles. Any tap or key ends it early.
  const RAIN_LINES = [
    "DÉJÀ VU? THAT'S JUST A REPLAYED OFFSET.",
    'THERE IS NO BATCH.',
    'I KNOW KAFKA.',
    'WAKE UP, NEO. THE BROKER HAS YOU.',
  ]
  let raining = false
  function digitalRain() {
    const message = pick(RAIN_LINES)
    if (raining) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return showPill(message)
    raining = true

    const w = window.innerWidth
    const h = window.innerHeight
    const rows = articles.filter((a) => {
      const r = a.getBoundingClientRect()
      return a.offsetParent !== null && r.bottom > 0 && r.top < h
    })
    for (const a of rows) {
      a.style.setProperty('--delay', `${Math.floor(Math.random() * 700)}ms`)
      a.classList.add('dissolve')
    }

    const canvas = document.createElement('canvas')
    canvas.className = 'rain'
    const text = document.createElement('p')
    text.className = 'rain-text'
    text.setAttribute('role', 'status')
    document.body.append(canvas, text)
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const size = 16
    const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789KAFKA'
    const drops = Array.from({ length: Math.ceil(w / size) }, () => -Math.random() * (h / size))
    ctx.font = `${size}px ui-monospace, Menlo, monospace`

    const TYPE_FROM = 600
    const TYPE_EVERY = 50
    const started = performance.now()
    let last = 0
    let frame = requestAnimationFrame(function draw(t) {
      frame = requestAnimationFrame(draw)
      if (t - last < 33) return
      last = t
      ctx.fillStyle = 'rgb(0 0 0 / 0.1)'
      ctx.fillRect(0, 0, w, h)
      drops.forEach((d, i) => {
        ctx.fillStyle = Math.random() < 0.04 ? '#e6ffe6' : '#00e060'
        ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * size, d * size)
        drops[i] = d * size > h && Math.random() > 0.97 ? 0 : d + 1
      })
      text.textContent = message.slice(0, Math.max(0, Math.floor((t - started - TYPE_FROM) / TYPE_EVERY)))
    })

    let ended = false
    const end = () => {
      if (ended) return
      ended = true
      clearTimeout(timer)
      document.removeEventListener('keydown', end, true)
      document.removeEventListener('pointerdown', end, true)
      canvas.classList.add('rain-out')
      text.classList.add('rain-out')
      for (const a of rows) {
        a.classList.remove('dissolve')
        a.classList.add('reassemble')
        a.addEventListener('animationend', () => a.classList.remove('reassemble'), { once: true })
      }
      setTimeout(() => {
        cancelAnimationFrame(frame)
        canvas.remove()
        text.remove()
        raining = false
      }, 700)
    }
    // Fully typed, then left up for a few seconds to read.
    const timer = setTimeout(end, TYPE_FROM + message.length * TYPE_EVERY + 4000)
    // Armed after a beat, so an extra tap on the title doesn't end it at once.
    setTimeout(() => {
      document.addEventListener('keydown', end, true)
      document.addEventListener('pointerdown', end, true)
    }, 800)
  }

  updateClashes()
  apply()
  setInterval(() => {
    if (document.visibilityState === 'visible') apply()
  }, 30_000)
  restoreScroll()
  showTarget()
  nightCheck()
})()
