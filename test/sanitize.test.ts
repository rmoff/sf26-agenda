import { describe, expect, it } from 'vitest'
import { sanitizeHtml, textOf } from '../src/sanitize'

describe('sanitizeHtml', () => {
  it('keeps allowed tags without attributes', () => {
    expect(sanitizeHtml('<p class="x" onclick="evil()">Hi <strong style="a">there</strong></p>')).toBe('<p>Hi <strong>there</strong></p>')
  })

  it('removes scripts and their contents', () => {
    expect(sanitizeHtml('<p>a</p><script>alert(1)</script><style>p{}</style>')).toBe('<p>a</p>')
  })

  it('unwraps unknown tags and turns divs into paragraphs', () => {
    expect(sanitizeHtml('<div><span>x</span> <u>y</u></div>')).toBe('<p>x y</p>')
  })

  it('keeps http links and drops others', () => {
    expect(sanitizeHtml('<a href="https://kafka.apache.org" target="_blank">k</a>')).toBe('<a href="https://kafka.apache.org" rel="nofollow noopener">k</a>')
    expect(sanitizeHtml('<a href="javascript:alert(1)">k</a>')).toBe('k')
  })

  it('escapes stray angle brackets in text', () => {
    expect(sanitizeHtml('<p>a < b > c</p>')).toBe('<p>a &lt; b &gt; c</p>')
  })

  it('trims line breaks at the edges of paragraphs', () => {
    expect(sanitizeHtml('<p><br>Hello<br></p><p><br/> world</p>')).toBe('<p>Hello</p><p>world</p>')
  })

  it('drops empty paragraphs', () => {
    expect(sanitizeHtml('<p></p><p>&nbsp;</p><p>x</p>')).toBe('<p>x</p>')
  })
})

describe('textOf', () => {
  it('strips tags and decodes common entities', () => {
    expect(textOf('<p>Fish &amp; chips&nbsp;&lt;3</p><p>next</p>')).toBe('Fish & chips <3 next')
  })
})
