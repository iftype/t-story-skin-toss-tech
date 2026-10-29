// 코드 하이라이터를 스킨 안에 직접 넣는다.
// 예전에는 티스토리가 띄워 주는 highlight.js(window.hljs)에 기대서, 그게 없거나 늦게 뜨는 페이지에서는 색이 안 입혀졌다.
// 기존 코드가 쓰던 hljs 형태(getLanguage / highlightElement / highlightAuto)를 그대로 흉내 낸다.
import './prism-manual.js'
import Prism from './prism-global.js'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-kotlin'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-diff'

// 화면 이름/hljs 이름 → Prism 문법 이름
const ALIASES = {
  javascript: 'jsx', js: 'jsx', jsx: 'jsx',
  typescript: 'tsx', ts: 'tsx', tsx: 'tsx',
  xml: 'markup', html: 'markup', svg: 'markup', markup: 'markup',
  sh: 'bash', shell: 'bash', zsh: 'bash', bash: 'bash',
  yml: 'yaml', md: 'markdown', py: 'python', kt: 'kotlin',
}

const grammarName = (name) => {
  const key = String(name || '').toLowerCase()
  const mapped = ALIASES[key] || key
  return Prism.languages[mapped] ? mapped : null
}

const escapeHtml = (text) => text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

function highlightTo(element, lang) {
  const name = grammarName(lang)
  if (!name) return false
  element.innerHTML = Prism.highlight(element.textContent || '', Prism.languages[name], name)
  element.classList.add(`language-${name}`)
  return true
}

// 언어 표시가 없는 블록용 간단 추측: JSON 은 파싱해 보고, 나머지는 흔한 문법 단서로만 판단한다
function guessLanguage(text) {
  const trimmed = text.trim()
  if (/^[[{]/.test(trimmed)) { try { JSON.parse(trimmed); return 'json' } catch (_) {} }
  if (/^\s*<([a-z][\w-]*)[\s>][\s\S]*<\/\1>\s*$/i.test(trimmed) && !/\b(const|let|return|import)\b/.test(trimmed)) return 'markup'
  if (/^\s*(\$ |npm |npx |yarn |pnpm |git |cd |curl )/m.test(trimmed)) return 'bash'
  if (/\b(SELECT|INSERT|UPDATE|CREATE TABLE)\b/.test(trimmed)) return 'sql'
  if (/^\s*[\w-]+:\s.+$/m.test(trimmed) && /^\s*-\s|\n\s+[\w-]+:/m.test(trimmed) && !/[;{}()]/.test(trimmed)) return 'yaml'
  if (/\b(const|let|function|return|import|export|=>)\b|=>/.test(trimmed)) return /:\s*(string|number|boolean)\b|interface |<\w+>\(/.test(trimmed) ? 'tsx' : 'jsx'
  return null
}

export const highlighter = {
  getLanguage: (name) => Boolean(grammarName(name)),
  highlightElement: (element) => {
    const lang = Array.from(element.classList).map((c) => c.replace(/^language-/, '')).find((c) => grammarName(c))
    if (lang) highlightTo(element, lang)
  },
  highlightAuto: (text) => {
    const lang = guessLanguage(text)
    if (!lang) return { language: null, relevance: 0, value: escapeHtml(text) }
    const name = grammarName(lang)
    return { language: name, relevance: 10, value: Prism.highlight(text, Prism.languages[name], name) }
  },
}
