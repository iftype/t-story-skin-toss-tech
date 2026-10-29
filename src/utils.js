import { highlighter } from './highlight/index.js'

// 이름은 예전(hljs) 그대로 두고, 실제로는 스킨에 넣은 Prism 하이라이터를 쓴다
export function getHljs() {
  return highlighter
}

const STORAGE_KEY = 'docs-theme'
let featuredAutoplayTimer = null

export function cleanTextContent(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

// token 색상 CSS를 JS에서 직접 inject → CSS 탭 상태와 무관하게 항상 동작 (Tokyo Night 테마 적용, Prism & Highlight.js 호환)

export function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char])
}
