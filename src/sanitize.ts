const ALLOWED = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a'])
const DROP_WITH_CONTENT = /<(script|style|iframe|object|template)\b[\s\S]*?<\/\1\s*>/gi
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g

export function safeUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  return /^https?:\/\/[^\s"'<>]+$/i.test(trimmed) ? trimmed : null
}

function escapeText(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''
  const src = html.replace(DROP_WITH_CONTENT, '').replace(/<!--[\s\S]*?-->/g, '')
  let out = ''
  let last = 0
  const openLinks: boolean[] = []
  for (const m of src.matchAll(TAG)) {
    out += escapeText(src.slice(last, m.index))
    last = m.index + m[0].length
    const closing = m[1] === '/'
    let name = m[2].toLowerCase()
    if (name === 'div') name = 'p'
    if (!ALLOWED.has(name)) continue
    if (name === 'a') {
      if (closing) {
        if (openLinks.pop()) out += '</a>'
        continue
      }
      const href = safeUrl(/href\s*=\s*["']([^"']*)["']/i.exec(m[3])?.[1])
      openLinks.push(Boolean(href))
      if (href) out += `<a href="${href.replace(/&(?!amp;)/g, '&amp;')}" rel="nofollow noopener">`
      continue
    }
    if (name === 'br') {
      if (!closing) out += '<br>'
      continue
    }
    out += closing ? `</${name}>` : `<${name}>`
  }
  out += escapeText(src.slice(last))
  return out
    .replace(/<p>(?:\s|&nbsp;|<br>)+/g, '<p>')
    .replace(/(?:\s|&nbsp;|<br>)+<\/p>/g, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<p>/g, '<p>')
    .replace(/<\/p>\s*<\/p>/g, '</p>')
    .trim()
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }

export function textOf(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<(br|\/p|\/li|\/div)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#?\w+);/g, (whole, name: string) => {
      if (name in ENTITIES) return ENTITIES[name]
      const code = name.startsWith('#x') ? parseInt(name.slice(2), 16) : name.startsWith('#') ? parseInt(name.slice(1), 10) : NaN
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    })
    .replace(/\s+/g, ' ')
    .trim()
}
