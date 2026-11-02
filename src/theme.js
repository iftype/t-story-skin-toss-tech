import { escapeHtml } from './utils.js'

// 예전 키('docs-theme')는 페이지를 열 때마다 자동으로 저장돼서, 고르지 않은 사람도 다크로 고정됐다.
// 새 키는 테마 버튼을 직접 눌렀을 때만 저장한다. 고르지 않았으면 라이트로 시작한다.
const STORAGE_KEY = 'docs-theme-choice'

export function getSavedTheme() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch (_) {
    return 'light'
  }
}

export function cleanInlineStyles() {
  const article = document.querySelector('[data-docs-article]')
  if (!article) return

  const isDark = document.documentElement.getAttribute('data-ui-theme') === 'dark'
  const styledElements = article.querySelectorAll('[style]')

  styledElements.forEach(el => {
    // Preserve custom source-code blocks or math blocks if present
    if (el.closest('pre') || el.closest('.hljs') || el.closest('.code-frame') || el.closest('.container_postbtn')) return

    const style = el.getAttribute('style')
    if (!style) return

    // Standardize list-style-type and text-align properties if unset
    if (el.style.listStyleType === 'unset') el.style.listStyleType = ''
    if (el.style.textAlign === 'unset') el.style.textAlign = ''

    const inlineBg = el.style.backgroundColor
    const inlineColor = el.style.color

    const parseColor = (colorStr) => {
      if (!colorStr) return null
      const trimmed = colorStr.trim().toLowerCase()
      if (trimmed === 'transparent' || trimmed === 'initial' || trimmed === 'inherit' || trimmed === 'unset') return null

      // Hexadecimal parsing
      if (trimmed.startsWith('#')) {
        let hex = trimmed.slice(1)
        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('')
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        return {
          r, g, b,
          brightness: 0.299 * r + 0.587 * g + 0.114 * b,
          isGrayscale: Math.max(r, g, b) - Math.min(r, g, b) <= 20
        }
      }

      // RGB / RGBA parsing
      const match = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
      if (match) {
        const r = parseInt(match[1], 10)
        const g = parseInt(match[2], 10)
        const b = parseInt(match[3], 10)
        const a = match[4] !== undefined ? parseFloat(match[4]) : 1
        if (a === 0) return null
        return {
          r, g, b,
          brightness: 0.299 * r + 0.587 * g + 0.114 * b,
          isGrayscale: Math.max(r, g, b) - Math.min(r, g, b) <= 20
        }
      }

      // Common color keywords
      const colors = {
        'black': { r: 0, g: 0, b: 0, brightness: 0, isGrayscale: true },
        'white': { r: 255, g: 255, b: 255, brightness: 255, isGrayscale: true },
        'gray': { r: 128, g: 128, b: 128, brightness: 128, isGrayscale: true },
        'darkgray': { r: 169, g: 169, b: 169, brightness: 169, isGrayscale: true },
        'lightgray': { r: 211, g: 211, b: 211, brightness: 211, isGrayscale: true }
      }
      return colors[trimmed] || null
    }

    const bg = parseColor(inlineBg)
    const color = parseColor(inlineColor)

    // Grayscale background logic (remove contrast hazards in either theme)
    if (bg && bg.isGrayscale) {
      if (isDark) {
        // Under dark theme, remove bright background highlights
        if (bg.brightness > 100) el.style.backgroundColor = ''
      } else {
        // Under light theme, remove very dark background highlights
        if (bg.brightness < 150) el.style.backgroundColor = ''
      }
    }

    // Grayscale text color logic (remove text visibility issues)
    if (color && color.isGrayscale) {
      if (isDark) {
        // Under dark theme, remove dark text (it would blend into dark background)
        if (color.brightness < 150) el.style.color = ''
      } else {
        // Under light theme, remove white/very light text (it would blend into white background)
        if (color.brightness > 100) el.style.color = ''
      }
    }

    // High-Contrast Safeguard for highlighted backgrounds
    const activeBg = parseColor(el.style.backgroundColor)
    const activeColor = parseColor(el.style.color)

    if (activeBg) {
      if (isDark) {
        // Under dark theme, if the background is bright, ensure the text is dark
        if (activeBg.brightness > 130) {
          if (!activeColor || activeColor.brightness > 120) {
            el.style.color = '#191f28' // Elegant Toss-style dark gray text color
          }
        } else {
          // If background is very dark, make sure the text is bright
          if (activeColor && activeColor.brightness < 100) {
            el.style.color = '#f9fafb'
          }
        }
      } else {
        // Under light theme, if the background is dark, ensure the text is bright (e.g. white)
        if (activeBg.brightness <= 130) {
          if (!activeColor || activeColor.brightness < 130) {
            el.style.color = '#ffffff'
          }
        } else {
          // If background is very bright, make sure the text is dark
          if (activeColor && activeColor.brightness > 150) {
            el.style.color = '#191f28'
          }
        }
      }
    }

    // Clean up empty style attribute altogether
    if (el.getAttribute('style') === '') {
      el.removeAttribute('style')
    }
  })
}

export function cleanZeroWidthSpaces(container) {
  if (!container) return
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement
        if (parent && (
          parent.closest('pre') ||
          parent.closest('code') ||
          parent.closest('.hljs') ||
          parent.closest('.code-frame') ||
          parent.tagName === 'SCRIPT' ||
          parent.tagName === 'STYLE'
        )) {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  const nodes = []
  let currentNode = walker.nextNode()
  while (currentNode) {
    if (/[\u200b\u200c\u200d\ufeff\u00ad]/.test(currentNode.nodeValue) || (currentNode.nodeValue.includes('\u00a0') && /[^\s\u00a0]/.test(currentNode.nodeValue))) {
      nodes.push(currentNode)
    }
    currentNode = walker.nextNode()
  }

  nodes.forEach(node => {
    node.nodeValue = node.nodeValue.replace(/[\u200b\u200c\u200d\ufeff\u00ad]/g, '')
    // 에디터가 넣은 줄바꿈 금지 공백(&nbsp;)이 글자 사이에 있으면 문장 전체가 한 덩어리가 되어
    // "배운 점:" 뒤에서 통째로 다음 줄로 넘어간다. 글자가 있는 줄에서는 보통 공백으로 바꾼다.
    // (&nbsp; 만 있는 빈 문단은 간격용이라 그대로 둔다)
    if (/[^\s\u00a0]/.test(node.nodeValue)) node.nodeValue = node.nodeValue.replace(/\u00a0/g, ' ')
  })
}

export function preserveWordCombination() {
  const article = document.querySelector('[data-docs-article]')
  if (!article) return

  // Clean up any zero-width / invisible formatting spaces that bypass keep-all
  cleanZeroWidthSpaces(article)

  // Create a TreeWalker to safely scan only visible text nodes
  const walker = document.createTreeWalker(
    article,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement
        if (parent && (
          parent.closest('pre') ||
          parent.closest('code') ||
          parent.closest('.hljs') ||
          parent.closest('.code-frame') ||
          parent.closest('[data-word-keeper]') || // Ignore already wrapped keepers to avoid infinite nesting
          parent.tagName === 'SCRIPT' ||
          parent.tagName === 'STYLE'
        )) {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  const nodesToReplace = []
  let currentNode = walker.nextNode()
  
  // We want to match:
  // 1. English/digits/brackets/quotes followed by a Hangul particle (1-3 chars)
  // 2. Hyphenated English/digit words (e.g. Cross-Functional, using ASCII or Unicode dashes)
  // 3. Slashed words (e.g. CI/CD)
  const testRegex = /([A-Za-z0-9\-_\/\(\)\'\"\`\u2010-\u2015]+)([가-힣]{1,3})(?=\s|[.,!?:]|$)|(\b[A-Za-z0-9]+(?:[\-\u2010-\u2015][A-Za-z0-9]+)+)\b|(\b[A-Za-z0-9]{1,10}\/[A-Za-z0-9]{1,10}\b)/

  while (currentNode) {
    const text = currentNode.nodeValue
    if (testRegex.test(text)) {
      nodesToReplace.push(currentNode)
    }
    currentNode = walker.nextNode()
  }

  // Single-pass regex alternation that matches:
  // - HTML Entities (to preserve them without wrapping)
  // - English/digits/brackets/quotes + Hangul particle (supports Unicode dashes)
  // - Hyphenated English words (supports standard hyphen and Unicode dashes like en-dash/em-dash)
  // - Slashed English words
  const globalRegex = /(&[A-Za-z0-9#]+;)|([A-Za-z0-9\-_\/\(\)\'\"\`\u2010-\u2015]+)([가-힣]{1,3})(?=\s|[.,!?:]|$)|(\b[A-Za-z0-9]+(?:[\-\u2010-\u2015][A-Za-z0-9]+)+)\b|(\b[A-Za-z0-9]{1,10}\/[A-Za-z0-9]{1,10}\b)/g

  nodesToReplace.forEach(node => {
    const text = node.nodeValue
    const parent = node.parentElement
    if (!parent) return

    // Create a temporary element to safely inject the nowrap spans
    const tempDiv = document.createElement('div')
    const escapedText = escapeHtml(text)
    const newHtml = escapedText.replace(
      globalRegex,
      (match, entity, p1, p2, p3, p4) => {
        if (entity) {
          return entity
        }
        if (p1 && p2) {
          return `<span data-word-keeper="true" style="white-space: nowrap !important;">${p1}${p2}</span>`
        }
        if (p3) {
          return `<span data-word-keeper="true" style="white-space: nowrap !important;">${p3}</span>`
        }
        if (p4) {
          return `<span data-word-keeper="true" style="white-space: nowrap !important;">${p4}</span>`
        }
        return match
      }
    )
    
    tempDiv.innerHTML = newHtml
    
    while (tempDiv.firstChild) {
      parent.insertBefore(tempDiv.firstChild, node)
    }
    parent.removeChild(node)
  })
}

export function applyTheme(theme, { remember = false } = {}) {
  const normalized = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-ui-theme', normalized)
  if (remember) {
    try { window.localStorage.setItem(STORAGE_KEY, normalized) } catch (_) {}
  }
  cleanInlineStyles()
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-ui-theme') === 'dark' ? 'dark' : 'light'
  applyTheme(current === 'dark' ? 'light' : 'dark', { remember: true })
}
