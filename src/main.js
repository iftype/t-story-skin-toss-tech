import { marked } from 'marked'
// Prism은 skin.html 헤드에서 CDN으로 로드됨 (window.Prism)
import './styles.css'

// CDN Prism이 로드되지 않았을 경우 대비 폴백을 제공하는 동적 게터
function getPrism() {
  return window.Prism || { highlightElement: () => {}, languages: {} }
}

const STORAGE_KEY = 'docs-theme'

// token 색상 CSS를 JS에서 직접 inject → CSS 탭 상태와 무관하게 항상 동작 (Tokyo Night 테마 적용)
function injectCodeCSS() {
  if (document.getElementById('docs-prism-colors')) return
  const style = document.createElement('style')
  style.id = 'docs-prism-colors'
  style.textContent = `
    /* Tokyo Night Dark Theme (Default) */
    .code-frame {
      background: #1a1b26 !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
    }
    .code-header {
      background: rgba(255, 255, 255, 0.02) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
    }
    .code-title {
      color: #7982a9 !important;
    }
    .code-frame code {
      color: #a9b1d6 !important;
    }
    .code-frame .token { background: transparent !important; }
    .code-frame .token.comment,
    .code-frame .token.prolog,
    .code-frame .token.doctype,
    .code-frame .token.cdata { color: #565f89 !important; font-style: italic !important; }
    .code-frame .token.keyword,
    .code-frame .token.important { color: #bb9af3 !important; }
    .code-frame .token.number,
    .code-frame .token.boolean,
    .code-frame .token.constant,
    .code-frame .token.symbol,
    .code-frame .token.deleted { color: #ff9e64 !important; }
    .code-frame .token.string,
    .code-frame .token.char,
    .code-frame .token.attr-value,
    .code-frame .token.builtin,
    .code-frame .token.inserted { color: #9ece6a !important; }
    .code-frame .token.operator,
    .code-frame .token.entity,
    .code-frame .token.url { color: #89ddff !important; }
    .code-frame .token.class-name,
    .code-frame .token.function { color: #7aa2f7 !important; }
    .code-frame .token.tag,
    .code-frame .token.selector { color: #f7768e !important; }
    .code-frame .token.property,
    .code-frame .token.attr-name { color: #7dcfff !important; }
    .code-frame .token.regex,
    .code-frame .token.variable { color: #e0af68 !important; }
    .code-frame .token.punctuation { color: #a9b1d6 !important; }
    .code-frame .token.string-property { color: #9ece6a !important; }

    /* Tokyo Night Light Theme Override */
    html[data-ui-theme="light"] .code-frame {
      background: #f5f6f9 !important;
      border: 1px solid rgba(0, 0, 0, 0.08) !important;
    }
    html[data-ui-theme="light"] .code-header {
      background: rgba(0, 0, 0, 0.02) !important;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
    }
    html[data-ui-theme="light"] .code-title {
      color: #565f89 !important;
    }
    html[data-ui-theme="light"] .code-frame code {
      color: #343b58 !important;
    }
    html[data-ui-theme="light"] .code-frame .token.comment { color: #9699a3 !important; }
    html[data-ui-theme="light"] .code-frame .token.keyword { color: #8c4351 !important; }
    html[data-ui-theme="light"] .code-frame .token.number,
    html[data-ui-theme="light"] .code-frame .token.boolean { color: #b15c00 !important; }
    html[data-ui-theme="light"] .code-frame .token.string,
    html[data-ui-theme="light"] .code-frame .token.attr-value { color: #485e30 !important; }
    html[data-ui-theme="light"] .code-frame .token.operator { color: #007197 !important; }
    html[data-ui-theme="light"] .code-frame .token.class-name,
    html[data-ui-theme="light"] .code-frame .token.function { color: #165ba7 !important; }
    html[data-ui-theme="light"] .code-frame .token.tag,
    html[data-ui-theme="light"] .code-frame .token.selector { color: #f7768e !important; }
    html[data-ui-theme="light"] .code-frame .token.property,
    html[data-ui-theme="light"] .code-frame .token.attr-name { color: #007197 !important; }
    html[data-ui-theme="light"] .code-frame .token.variable { color: #8f5e15 !important; }
    html[data-ui-theme="light"] .code-frame .token.punctuation { color: #343b58 !important; }
    html[data-ui-theme="light"] .code-frame .token.string-property { color: #485e30 !important; }
  `
  document.head.appendChild(style)
}

function buildWriteUrl() {
  const blogLink = document.querySelector('.docs-brand__title')?.getAttribute('href') || '/'
  const normalized = blogLink.endsWith('/') ? blogLink : `${blogLink}/`
  return `${normalized}manage/newpost/?type=post&returnURL=%2Fmanage%2Fposts%2F`
}

function decorateWriteLinks() {
  document.querySelectorAll('.docs-toplink--write').forEach((link) => {
    link.setAttribute('href', buildWriteUrl())
  })
}

function showAdminElements() {
  const checkAdmin = () => {
    if ((window.T && window.T.config && window.T.config.ROLE === 'owner') || document.querySelector('#tistory-admin-bar')) {
      document.body.classList.add('is-admin')
      localStorage.setItem('docs-is-admin', 'true')
      document.querySelectorAll('.admin-only').forEach((el) => {
        el.style.display = 'inline-flex'
      })
      return true
    }
    return false
  }
  
  if (!checkAdmin()) {
    const interval = setInterval(() => {
      if (checkAdmin()) clearInterval(interval)
    }, 500)
    
    // Clear interval and clean up cache if still not admin after 5 seconds (means user logged out)
    setTimeout(() => {
      clearInterval(interval)
      if (!document.body.classList.contains('is-admin')) {
        localStorage.removeItem('docs-is-admin')
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none')
      }
    }, 5000)
  }
}

function getSavedTheme() {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  return saved || 'dark'
}

function cleanInlineStyles() {
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

function cleanZeroWidthSpaces(container) {
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
    if (/[\u200b\u200c\u200d\ufeff\u00ad]/.test(currentNode.nodeValue)) {
      nodes.push(currentNode)
    }
    currentNode = walker.nextNode()
  }

  nodes.forEach(node => {
    node.nodeValue = node.nodeValue.replace(/[\u200b\u200c\u200d\ufeff\u00ad]/g, '')
  })
}

function preserveWordCombination() {
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

function applyTheme(theme) {
  const normalized = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-ui-theme', normalized)
  window.localStorage.setItem(STORAGE_KEY, normalized)
  cleanInlineStyles()
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-ui-theme') === 'dark' ? 'dark' : 'light'
  applyTheme(current === 'dark' ? 'light' : 'dark')
}

function toggleSidebar() {
  document.body.classList.toggle('nav-open')
  document.querySelectorAll('[data-action="toggle-nav"]').forEach((button) => {
    button.setAttribute('aria-expanded', document.body.classList.contains('nav-open') ? 'true' : 'false')
  })
}

function setupCategoryTree() {
  const tree = document.querySelector('.category-tree')
  if (!tree) return

  // Parse Tistory's original DOM before we replace it
  let rootUl = tree.querySelector('ul')
  if (!rootUl) return

  // Helpers to check current page path & descendant active states
  const parseLevel = (ulElement) => {
    const items = []
    const lis = Array.from(ulElement.children).filter(child => child.tagName && child.tagName.toUpperCase() === 'LI')

    for (const li of lis) {
      const link = Array.from(li.children).find(child => child.tagName && child.tagName.toUpperCase() === 'A')
      if (!link) continue

      const childUl = Array.from(li.children).find(child => child.tagName && child.tagName.toUpperCase() === 'UL')
      const href = link.getAttribute('href') || '/category'
      const name = categoryName(link)
      const count = categoryCount(link)
      
      const isCurrent = link.matches('a.tt_category_current, .selected, .is-current') || li.classList.contains('on')
      const children = childUl ? parseLevel(childUl) : []

      items.push({
        name,
        count,
        href,
        isCurrent,
        children
      })
    }
    return items
  }

  // Smart resolution: If the root list has exactly one child LI, and that LI contains a nested UL,
  // that nested UL is the actual categories list (bypassing the "All posts" root wrapper).
  let targetUl = rootUl
  const directLis = Array.from(rootUl.children).filter(child => child.tagName && child.tagName.toUpperCase() === 'LI')
  if (directLis.length === 1) {
    const nestedUl = directLis[0].querySelector('ul')
    if (nestedUl) {
      targetUl = nestedUl
    }
  }

  let categoryData = parseLevel(targetUl)

  // Fallback: If bypassing resulted in an empty list, fall back to parsing the outermost list directly
  if (categoryData.length === 0 && targetUl !== rootUl) {
    categoryData = parseLevel(rootUl)
  }

  const hasCurrentDescendant = (node) => {
    if (node.isCurrent) return true
    if (node.children && node.children.length > 0) {
      return node.children.some(child => hasCurrentDescendant(child))
    }
    return false
  }

  const isFolderOpen = (href, hasActiveChild) => {
    if (hasActiveChild) return true
    const saved = localStorage.getItem(`vs-tree-folder:${href}`)
    if (saved !== null) {
      return saved === 'true'
    }
    return false // Default collapsed for other folders
  }

  // Render nodes recursively into custom BEM divs
  const renderNode = (node, level = 0) => {
    const isFolder = node.children && node.children.length > 0
    const hasActive = hasCurrentDescendant(node)
    const isOpen = isFolder ? isFolderOpen(node.href, hasActive) : false

    let chevronHtml = ''
    if (isFolder) {
      chevronHtml = `
        <button class="vs-tree-chevron" aria-label="Toggle Folder" data-href="${node.href}">
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `
    } else {
      chevronHtml = `<span class="vs-tree-chevron-spacer"></span>`
    }

    let iconHtml = ''
    if (isFolder) {
      iconHtml = `
        <svg class="vs-tree-icon folder-icon folder-closed" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1.5 2.5a1 1 0 0 1 1-1h4l1.5 1.5h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11.5z" />
        </svg>
        <svg class="vs-tree-icon folder-icon folder-open" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1.5 4.5v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6l-1.5-1.5h-3.5a1 1 0 0 0-1 1z" />
        </svg>
      `
    } else {
      iconHtml = `
        <svg class="vs-tree-icon file-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 1.5h7.5L14 5v9.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />
          <path d="M10 1.5V5h3.5" />
        </svg>
      `
    }

    const rowClasses = ['vs-tree-row']
    if (node.isCurrent) rowClasses.push('is-active')

    const itemClasses = ['vs-tree-item']
    if (isFolder) {
      itemClasses.push('is-folder')
      if (isOpen) itemClasses.push('is-open')
    } else {
      itemClasses.push('is-file')
    }

    const childHtml = isFolder
      ? `<div class="vs-tree-sub-list">${node.children.map(child => renderNode(child, level + 1)).join('')}</div>`
      : ''

    return `
      <div class="${itemClasses.join(' ')}" data-href="${node.href}">
        <div class="${rowClasses.join(' ')}">
          ${chevronHtml}
          <a href="${node.href}" class="vs-tree-link">
            ${iconHtml}
            <span class="vs-tree-name">${escapeHtml(node.name)}</span>
          </a>
          ${node.count ? `<span class="vs-tree-count">${node.count}</span>` : ''}
        </div>
        ${childHtml}
      </div>
    `
  }

  // Replace tree outer html structure with our beautiful explorer markup
  const newTreeHtml = `
    <div class="vs-tree">
      ${categoryData.map(node => renderNode(node)).join('')}
    </div>
  `
  
  // Set inner HTML
  tree.innerHTML = newTreeHtml

  // Bind interactive click handlers with delegation
  tree.addEventListener('click', (e) => {
    const chevron = e.target.closest('.vs-tree-chevron')
    if (chevron) {
      e.preventDefault()
      e.stopPropagation()
      const item = chevron.closest('.vs-tree-item')
      if (item) {
        const href = item.getAttribute('data-href')
        const isOpen = item.classList.toggle('is-open')
        localStorage.setItem('vs-tree-folder:' + href, isOpen ? 'true' : 'false')
      }
      return
    }

    // Double-click or clicking empty space in folder row toggles too
    const row = e.target.closest('.vs-tree-row')
    if (row) {
      const link = e.target.closest('a')
      if (!link) {
        const item = row.closest('.vs-tree-item')
        if (item && item.classList.contains('is-folder')) {
          e.preventDefault()
          const href = item.getAttribute('data-href')
          const isOpen = item.classList.toggle('is-open')
          localStorage.setItem('vs-tree-folder:' + href, isOpen ? 'true' : 'false')
        }
      }
    }
  })
}

function bindGlobalActions() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]')
    if (target) {
      const action = target.getAttribute('data-action')
      if (action === 'toggle-theme') toggleTheme()
      if (action === 'toggle-nav') toggleSidebar()
      return
    }

    const card = e.target.closest('[data-card-href]')
    if (card && !e.target.closest('a, button, input, textarea, select')) {
      window.location.href = card.dataset.cardHref
    }
  })

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      toggleSidebar()
    }
  })
}

function resolveCodeLanguage(value) {
  if (!value) return { display: 'text', prism: null }
  const raw = String(value)
    .trim()
    .replace(/^language-/, '')
    .split(/\s+/)[0]
    .replace(/[{}"'`]/g, '')
    
  const normalized = raw.toLowerCase()
    
  // 화면에 보여주는 이름 -> Prism 엔진 이름 매핑
  const map = {
    'js': 'jsx',
    'javascript': 'jsx',
    'ts': 'tsx',
    'typescript': 'tsx',
    'sh': 'bash',
    'shell': 'bash',
    'zsh': 'bash',
    'py': 'python',
    'yml': 'yaml',
    'md': 'markdown',
    'html': 'markup',
    'xml': 'markup',
    'svg': 'markup',
    'c++': 'cpp',
    'c#': 'csharp',
    'angelscript': 'cpp',
    '1c': null,
    'text': null,
    'plaintext': null,
    'plain': null,
  }

  let prismLang
  if (normalized in map) {
    prismLang = map[normalized]  // null이면 하이라이팅 안 함
  } else if (getPrism().languages[normalized]) {
    prismLang = normalized
  } else if (/^[a-z0-9-]+$/.test(normalized)) {
    prismLang = normalized  // Prism Autoloader가 필요할 때 동적으로 로드할 수 있도록 허용
  } else {
    prismLang = null  // 모르는 언어면 그냥 plain text
  }

  return {
    display: raw || 'text',
    prism: prismLang
  }
}

function getCodeBlockMeta(pre, block) {
  const langFromCodeClass = (Array.from(block.classList)
    .find(c => c.startsWith('language-') || getPrism().languages[c]) || block.className.split(' ')[0])?.replace(/^language-/, '')

  const langFromPreClass = Array.from(pre.classList)
    .find(c => /^[a-z0-9_+-]+$/i.test(c) && c !== 'line-numbers')?.replace(/^language-/, '')

  const resolved = resolveCodeLanguage(
    langFromCodeClass ||
    pre.getAttribute('data-ke-language') ||
    pre.getAttribute('data-language') ||
    pre.getAttribute('data-lang') ||
    langFromPreClass ||
    'text'
  )

  return {
    displayLang: resolved.display,
    prismLang: resolved.prism
  }
}

function stripCodeMetaDirective(block) {
  const text = block.textContent || ''
  const lines = text.split('\n')
  const firstLine = lines[0]?.trim() || ''
  const match = firstLine.match(/^(?:\/\/|#|\/\*|<!--)\s*(?:ec|highlight|mark|lines?)\s*[:=]\s*(.+?)(?:\s*\*\/|\s*-->)?$/i)

  if (match) block.textContent = lines.slice(1).join('\n')
}

async function enhanceCodeBlocks() {
  const blocks = document.querySelectorAll('pre > code')
  if (blocks.length === 0) return

  blocks.forEach(block => {
    const pre = block.parentElement
    if (pre.dataset.enhanced) return
    
    const meta = getCodeBlockMeta(pre, block)
    block.className = block.className.replace(/\blanguage-[a-z0-9_-]+\b/gi, '')
    pre.className = pre.className.replace(/\blanguage-[a-z0-9_-]+\b/gi, '')
    
    stripCodeMetaDirective(block)
    if (meta.prismLang) {
      block.classList.add(`language-${meta.prismLang}`)
      try {
        getPrism().highlightElement(block)
      } catch (e) {
        // 하이라이팅 실패해도 텍스트는 보임
      }
    }

    const wrapper = document.createElement('div')
    wrapper.className = 'code-frame'

    const header = document.createElement('div')
    header.className = 'code-header'
    header.innerHTML = `
      <div class="code-dots" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="code-title">${meta.displayLang}</div>
    `

    pre.parentNode.insertBefore(wrapper, pre)
    wrapper.appendChild(header)
    wrapper.appendChild(pre)
    pre.dataset.enhanced = 'true'
  })
}

function markPageState() {
  // Reset all page state classes to prevent stale states during navigation
  document.body.classList.remove(
    'is-list-context',
    'has-list-page',
    'has-article-page',
    'is-category-page',
    'is-category-index',
    'is-home-page',
    'is-search-empty-body'
  )

  const hasListItems = Boolean(document.querySelector('.docs-list-item'))
  const hasPageHead = Boolean(document.querySelector('.docs-page-head'))
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'

  if (document.body.id === 'tt-body-index' || normalizedPath === '/') {
    document.body.classList.add('is-home-page')
  }

  if (hasPageHead) {
    document.body.classList.add('is-list-context')
  }

  if (hasListItems || hasPageHead) {
    document.body.classList.add('has-list-page')
  }

  if (document.querySelector('.docs-article-layout, .docs-article, .docs-guestbook')) {
    document.body.classList.add('has-article-page')
  }

  if (normalizedPath.startsWith('/category')) {
    document.body.classList.add('is-category-page')
    if (normalizedPath === '/category') {
      document.body.classList.add('is-category-index')
    }
  }
}

function showEmptyStateWhenNeeded() {
  const emptyState = document.querySelector('[data-empty-state]')
  if (!emptyState) return

  const isListPage = document.body.classList.contains('is-list-context')
  const hasListItems = Boolean(document.querySelector('.docs-list-item'))
  const isSearchPage = window.location.pathname.startsWith('/search') || Boolean(document.querySelector('.docs-searchbar__input')?.value?.trim())
  const countText = document.querySelector('.docs-page-head__meta')?.textContent || ''
  const count = Number(countText.match(/\d+/)?.[0] || (hasListItems ? 1 : 0))

  if (isListPage && (isSearchPage || count === 0) && !hasListItems) {
    emptyState.hidden = false
    emptyState.classList.toggle('is-search-empty', isSearchPage)
    document.body.classList.toggle('is-search-empty-body', isSearchPage)
    if (!isSearchPage) {
      emptyState.querySelector('h2').textContent = '아직 글이 없습니다'
      emptyState.querySelector('p:last-child').textContent = '이 카테고리에 등록된 글이 생기면 여기에 표시됩니다.'
    }
  }
}

function normalizeListMeta() {
  const meta = document.querySelector('.docs-page-head__meta')
  if (!meta) return

  if (/글\s*\d+\s*개/.test(meta.textContent)) return
  const count = meta.textContent.match(/\d+/)?.[0]
  if (count) meta.textContent = `글 ${count}개`
}

function normalizeListCards() {
  // Skeletons are now pre-rendered natively inside skin.html to ensure 100% CLS-free refresh.
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char])
}

function categoryName(link) {
  return link.textContent.replace(/\(\d+\)/g, '').trim()
}

function categoryCount(link) {
  const badge = link.querySelector('.c_cnt')
  const source = badge?.textContent || link.textContent
  const match = source.match(/\((\d+)\)/)
  return match?.[1] || ''
}

function renderCategoryMap() {
  const map = document.querySelector('[data-category-map]')
  const tree = document.querySelector('.category-tree')
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'
  if (!map || !tree || normalizedPath !== '/category') return

  const title = document.querySelector('.docs-page-head__title')
  const meta = document.querySelector('.docs-page-head__meta')
  const allCount = tree.querySelector('.link_tit .c_cnt')?.textContent?.match(/\((\d+)\)/)?.[1]

  if (title) title.textContent = '전체보기'
  if (meta && allCount) meta.textContent = `글 ${allCount}개`

  // Helper parsing logic (must be before we replace .category-tree)
  let rootUl = tree.querySelector('ul')
  if (!rootUl) return

  const parseLevel = (ulElement) => {
    const items = []
    const lis = Array.from(ulElement.children).filter(child => child.tagName && child.tagName.toUpperCase() === 'LI')

    for (const li of lis) {
      const link = Array.from(li.children).find(child => child.tagName && child.tagName.toUpperCase() === 'A')
      if (!link) continue

      const childUl = Array.from(li.children).find(child => child.tagName && child.tagName.toUpperCase() === 'UL')
      const href = link.getAttribute('href') || '/category'
      const name = categoryName(link)
      const count = categoryCount(link)
      
      const isCurrent = link.matches('a.tt_category_current, .selected, .is-current') || li.classList.contains('on')
      const children = childUl ? parseLevel(childUl) : []

      items.push({
        name,
        count,
        href,
        isCurrent,
        children
      })
    }
    return items
  }

  // Bypass root wrapper if it has exactly one child
  let targetUl = rootUl
  const directLis = Array.from(rootUl.children).filter(child => child.tagName && child.tagName.toUpperCase() === 'LI')
  if (directLis.length === 1) {
    const nestedUl = directLis[0].querySelector('ul')
    if (nestedUl) {
      targetUl = nestedUl
    }
  }

  let categoryData = parseLevel(targetUl)
  if (categoryData.length === 0 && targetUl !== rootUl) {
    categoryData = parseLevel(rootUl)
  }

  const hasCurrentDescendant = (node) => {
    if (node.isCurrent) return true
    if (node.children && node.children.length > 0) {
      return node.children.some(child => hasCurrentDescendant(child))
    }
    return false
  }

  const isFolderOpen = (href, hasActiveChild) => {
    if (hasActiveChild) return true
    const saved = localStorage.getItem(`vs-tree-folder:${href}`)
    if (saved !== null) {
      return saved === 'true'
    }
    return true // Default open for Category Map explorer
  }

  // Render nodes recursively into custom BEM divs
  const renderNode = (node, level = 0) => {
    const isFolder = node.children && node.children.length > 0
    const hasActive = hasCurrentDescendant(node)
    const isOpen = isFolder ? isFolderOpen(node.href, hasActive) : false

    let chevronHtml = ''
    if (isFolder) {
      chevronHtml = `
        <button class="vs-tree-chevron" aria-label="Toggle Folder" data-href="${node.href}">
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `
    } else {
      chevronHtml = `<span class="vs-tree-chevron-spacer"></span>`
    }

    let iconHtml = ''
    if (isFolder) {
      iconHtml = `
        <svg class="vs-tree-icon folder-icon folder-closed" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1.5 2.5a1 1 0 0 1 1-1h4l1.5 1.5h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11.5z" />
        </svg>
        <svg class="vs-tree-icon folder-icon folder-open" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1.5 4.5v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6l-1.5-1.5h-3.5a1 1 0 0 0-1 1z" />
        </svg>
      `
    } else {
      iconHtml = `
        <svg class="vs-tree-icon file-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 1.5h7.5L14 5v9.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />
          <path d="M10 1.5V5h3.5" />
        </svg>
      `
    }

    const rowClasses = ['vs-tree-row']
    if (node.isCurrent) rowClasses.push('is-active')

    const itemClasses = ['vs-tree-item']
    if (isFolder) {
      itemClasses.push('is-folder')
      if (isOpen) itemClasses.push('is-open')
    } else {
      itemClasses.push('is-file')
    }

    const childHtml = isFolder
      ? `<div class="vs-tree-sub-list">${node.children.map(child => renderNode(child, level + 1)).join('')}</div>`
      : ''

    return `
      <div class="${itemClasses.join(' ')}" data-href="${node.href}">
        <div class="${rowClasses.join(' ')}">
          ${chevronHtml}
          <a href="${node.href}" class="vs-tree-link">
            ${iconHtml}
            <span class="vs-tree-name">${escapeHtml(node.name)}</span>
          </a>
          ${node.count ? `<span class="vs-tree-count">${node.count}</span>` : ''}
        </div>
        ${childHtml}
      </div>
    `
  }

  const overviewHtml = `
    <div class="vs-tree vs-tree--large">
      ${categoryData.map(node => renderNode(node)).join('')}
    </div>
  `

  map.innerHTML = `
    <div class="docs-category-map__eyebrow">Category</div>
    <div class="docs-category-map__trail">
      <a href="/">전체보기</a>
    </div>
    <div class="docs-category-map__explorer">
      ${overviewHtml}
    </div>
  `
  map.hidden = false

  // Bind interactive click handlers with delegation for Category Map
  map.addEventListener('click', (e) => {
    const chevron = e.target.closest('.vs-tree-chevron')
    if (chevron) {
      e.preventDefault()
      e.stopPropagation()
      const item = chevron.closest('.vs-tree-item')
      if (item) {
        const href = item.getAttribute('data-href')
        const isOpen = item.classList.toggle('is-open')
        localStorage.setItem('vs-tree-folder:' + href, isOpen ? 'true' : 'false')
      }
      return
    }

    const row = e.target.closest('.vs-tree-row')
    if (row) {
      const link = e.target.closest('a')
      if (!link) {
        // Clicking row toggles folder if it is a folder
        const item = row.closest('.vs-tree-item')
        if (item && item.classList.contains('is-folder')) {
          e.preventDefault()
          const href = item.getAttribute('data-href')
          const isOpen = item.classList.toggle('is-open')
          localStorage.setItem('vs-tree-folder:' + href, isOpen ? 'true' : 'false')
        }
      }
    }
  })
}

function normalizeArticleMedia() {
  const article = document.querySelector('[data-docs-article]')
  if (!article) return

  const markWideFromImage = (node, image) => {
    const declaredWidth = Number(image.getAttribute('data-origin-width') || image.getAttribute('width') || 0)
    if (declaredWidth >= 740) node.classList.add('article-media--wide')
  }

  article.querySelectorAll('.imageblock, figure, p').forEach((node) => {
    if (!node.querySelector('img')) return

    const style = node.getAttribute('style') || ''
    const className = node.className || ''
    const image = node.querySelector('img')
    const hasTextWithImage = node.textContent.trim().length > 0
    const shouldFloat = /float\s*:\s*(left|right)/i.test(style) || /\b(left|right)\b/i.test(className)
    const floatsRight = /float\s*:\s*right/i.test(style) || /\bright\b/i.test(className)
    const shouldWide = hasTextWithImage || /width\s*:\s*(100%|[7-9]\d\dpx|1\d{3}px)/i.test(style) || /\b(widthContent|alignCenter|imageblock-width|imageblock-wide)\b/i.test(className)

    if (shouldFloat) {
      node.classList.add('article-media--float')
      node.classList.toggle('article-media--right', floatsRight)
    }
    if (shouldWide && !shouldFloat) node.classList.add('article-media--wide')
    if (!shouldFloat) markWideFromImage(node, image)
  })
}

function setupTocActiveState() {
  const links = Array.from(document.querySelectorAll('.docs-toc__nav a'))
  if (links.length === 0) return

  const headings = links
    .map((link) => document.getElementById(link.getAttribute('href')?.slice(1)))
    .filter(Boolean)

  const setActive = (id) => {
    links.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`
      link.classList.toggle('is-active', isActive)
      if (isActive) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
    })
  }

  if (!('IntersectionObserver' in window)) {
    setActive(headings[0].id)
    return
  }

  const visible = new Map()
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top)
      else visible.delete(entry.target.id)
    })

    const active = Array.from(visible.entries()).sort((a, b) => a[1] - b[1])[0]
    if (active) setActive(active[0])
  }, {
    rootMargin: '-96px 0px -65% 0px',
    threshold: [0, 1]
  })

  headings.forEach((heading) => observer.observe(heading))
  setActive(headings[0].id)
}

function syncCommentComposerAvatar() {
  const sync = () => {
    const composerThumbs = document.querySelectorAll('.docs-comments .tt-area-write > .tt-box-thumb .tt-thumbnail')
    if (composerThumbs.length === 0) return false

    const sourceThumb = Array.from(document.querySelectorAll('.docs-comments .tt-wrap-cmt .tt-thumbnail'))
      .find((thumb) => {
        const bg = getComputedStyle(thumb).backgroundImage
        return bg && bg !== 'none' && !bg.includes('default_S.png')
      })

    const sourceImg = sourceThumb?.querySelector('img') || document.querySelector('.docs-comments .tt-wrap-cmt .tt-box-thumb img')
    const bg = sourceThumb ? getComputedStyle(sourceThumb).backgroundImage : ''
    const src = sourceImg?.currentSrc || sourceImg?.src || ''

    let allSynced = true
    composerThumbs.forEach((thumb) => {
      if (thumb.dataset.composerSynced === 'true') return

      const areaWrite = thumb.closest('.tt-area-write')
      const isGuest = areaWrite && (areaWrite.querySelector('.tt-box-account') || areaWrite.querySelector('.tt-wrap-account'))

      if (isGuest) {
        thumb.style.backgroundImage = 'url("https://t1.daumcdn.net/tistory_admin/static/manage/images/r3/default_S.png")'
        thumb.dataset.composerSynced = 'true'
        return
      }

      const currentBg = getComputedStyle(thumb).backgroundImage
      if (currentBg && currentBg !== 'none' && !currentBg.includes('default_S.png')) {
        thumb.dataset.composerSynced = 'true'
        return
      }

      if (bg && bg !== 'none') {
        thumb.style.backgroundImage = bg
        thumb.dataset.composerSynced = 'true'
      } else if (src) {
        thumb.style.backgroundImage = `url("${src}")`
        thumb.dataset.composerSynced = 'true'
      } else {
        allSynced = false
      }
    })
    return allSynced
  }

  if (sync()) return

  const root = document.querySelector('.docs-comments [data-tistory-react-app="Comment"]') || document.querySelector('.docs-comments')
  if (!root || !('MutationObserver' in window)) return

  const observer = new MutationObserver((mutations, obs) => {
    obs.disconnect()
    if (sync()) {
      return
    }
    obs.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'src'] })
  })
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'src'] })
  setTimeout(() => observer.disconnect(), 8000)
}

function normalizeLegacyComments() {
  const getProfileBackground = (root) => {
    const candidates = [
      root.closest('.docs-comments')?.querySelector('[data-tistory-react-app="Namecard"] .tt_thumb_g'),
      document.querySelector('[data-tistory-react-app="Namecard"] .tt_thumb_g'),
      document.querySelector('.tt-thumbnail')
    ].filter(Boolean)

    for (const el of candidates) {
      const bg = getComputedStyle(el).backgroundImage
      if (bg && bg !== 'none') return bg
    }
    return ''
  }

  const ensureThumb = (target, bg) => {
    if (!target) return

    const existing = target.querySelector(':scope > .tt-box-thumb .tt-thumbnail')
    if (existing) {
      if (existing.dataset.thumbSynced === 'true') return
      
      const currentBg = getComputedStyle(existing).backgroundImage
      if (currentBg && currentBg !== 'none') {
        existing.dataset.thumbSynced = 'true'
        return
      }

      if (bg && bg !== 'none') {
        existing.style.backgroundImage = bg
        existing.dataset.thumbSynced = 'true'
      }
      return
    }

    const thumb = document.createElement('div')
    thumb.className = 'tt-box-thumb tt-box-thumb--generated'
    thumb.innerHTML = '<span class="tt-thumbnail"></span>'
    const ttThumb = thumb.querySelector('.tt-thumbnail')
    if (bg && bg !== 'none') {
      ttThumb.style.backgroundImage = bg
      ttThumb.dataset.thumbSynced = 'true'
    }
    target.insertBefore(thumb, target.firstChild)
  }

  const sync = () => {
    const roots = document.querySelectorAll('.docs-comments [id^="entry"][id$="Comment"]')
    if (roots.length === 0) return false
    let touched = false

    roots.forEach((root) => {
      const bg = getProfileBackground(root)
      root.querySelectorAll('.tt-list-reply > .tt-item-reply').forEach((item) => {
        ensureThumb(item.querySelector(':scope > .tt-wrap-cmt') || item, bg)
        touched = true
      })
      root.querySelectorAll('form .tt-area-write').forEach((form) => {
        const isGuest = form.querySelector('.tt-box-account') || form.querySelector('.tt-wrap-account')
        const formBg = isGuest ? 'url("https://t1.daumcdn.net/tistory_admin/static/manage/images/r3/default_S.png")' : bg
        ensureThumb(form, formBg)
        touched = true
      })
    })

    return touched
  }

  sync()

  const root = document.querySelector('.docs-comments')
  if (!root || !('MutationObserver' in window)) return

  const observer = new MutationObserver((mutations, obs) => {
    obs.disconnect()
    sync()
    obs.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
  })
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
  setTimeout(() => observer.disconnect(), 10000)
}

function trackOpenCommentMenus() {
  const root = document.querySelector('.docs-comments')
  if (!root) return

  const cardSelector = '.tt-wrap-cmt'
  const itemSelector = '.tt-item-reply'
  const openClass = 'is-comment-menu-open'

  const markOpen = (node) => {
    if (!node) return
    node.classList.add(openClass)
    node.closest(itemSelector)?.classList.add(openClass)
    node.closest('li')?.classList.add(openClass)
  }

  const refresh = () => {
    const openCards = new Set()
    const openItems = new Set()

    root.querySelectorAll('.tt-box-modify-open').forEach((box) => {
      const card = box.closest(cardSelector)
      if (card) openCards.add(card)
      const item = box.closest(itemSelector)
      if (item) openItems.add(item)
      const li = box.closest('li')
      if (li) openItems.add(li)
    })

    root.querySelectorAll(`.${openClass}`).forEach((card) => {
      if (!openCards.has(card) && !openItems.has(card)) card.classList.remove(openClass)
    })

    openCards.forEach(markOpen)
    openItems.forEach(openItem => markOpen(openItem))
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('.tt-button-modify')
    if (button) {
      root.querySelectorAll(`.${openClass}`).forEach((node) => node.classList.remove(openClass))
      markOpen(button.closest(cardSelector))
      markOpen(button.closest(itemSelector))
      markOpen(button.closest('li'))
      markOpen(button.closest('.tt-box-modify'))
    }

    if (event.target.closest('.tt-list-modify a, .tt-list-modify button')) return
    window.setTimeout(refresh, 0)
    window.setTimeout(refresh, 80)
    window.setTimeout(refresh, 180)
    window.setTimeout(refresh, 360)
  })

  root.addEventListener('focusin', (event) => {
    if (!event.target.closest('.tt-box-modify')) return
    window.setTimeout(refresh, 0)
  })

  document.addEventListener('click', (event) => {
    if (event.target.closest('.docs-comments .tt-box-modify, .docs-comments .tt-list-modify')) return
    window.setTimeout(refresh, 0)
  })

  if ('MutationObserver' in window) {
    const observer = new MutationObserver((mutations, obs) => {
      obs.disconnect()
      refresh()
      obs.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'aria-expanded']
      })
    })
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'aria-expanded']
    })
  }

  refresh()
}

function setupThumbnailFallbacks() {
  const thumbs = document.querySelectorAll('.docs-list-item__thumb')
  thumbs.forEach(thumb => {
    const img = thumb.querySelector('img')
    if (!img) return

    const handleFallback = () => {
      img.remove()
    }

    const src = img.getAttribute('src') || ''

    // 1. 치환자가 제대로 치환되지 않은 상태인 경우
    if (src.startsWith('[##_') || src === '') {
      handleFallback()
      return
    }

    // 2. 이미 로드가 완료되었고 깨진 이미지인 경우 (naturalWidth가 0인 경우)
    if (img.complete && img.naturalWidth === 0) {
      handleFallback()
      return
    }

    // 3. 디폴트 썸네일 경로가 포함된 경우
    if (
      src.includes('opengraph-default.png') ||
      src.includes('tistory_admin') ||
      src.includes('default_thumb') ||
      src.includes('cfile10.uf.tistory.com/image') ||
      src.includes('t1.daumcdn.net/tistory_admin')
    ) {
      handleFallback()
      return
    }

    // 4. 로딩 중 실패하거나 완료 시점에 크기가 0인 경우 대응
    img.addEventListener('load', () => {
      if (img.naturalWidth === 0) {
        handleFallback()
      }
    })
    img.addEventListener('error', handleFallback)
  })
}

function renderCommentMarkdown() {
  const allComments = Array.from(document.querySelectorAll('.tt_desc, .tt-wrap-desc'))
  const comments = allComments.filter(el => {
    // Keep only the outermost comment elements to prevent double parsing/rendering in nested trees
    return !allComments.some(ancestor => ancestor !== el && ancestor.contains(el))
  })
  comments.forEach(comment => {
    let html = comment.innerHTML
    
    // Tistory auto-prepends the reply mention tag (<em class="tt-txt-mention">@nickname</em>) without spaces.
    // This breaks markdown blocks like headings that must be at the start of a line.
    // We add \n\n after it to ensure the user's content starts on a fresh line.
    html = html.replace(/(<em[^>]*class="[^"]*tt[_-]txt[_-]mention[^"]*"[^>]*>.*?<\/em>)\s*/gi, '$1\n\n')
    
    let textWithNewlines = html.replace(/<br\s*\/?>/gi, '\n')
    
    const temp = document.createElement('div')
    temp.innerHTML = textWithNewlines
    
    // Safety check: remove any nested docs-comment-markdown elements from previous runs
    temp.querySelectorAll('.docs-comment-markdown').forEach(el => el.remove())
    
    const rawText = temp.textContent || temp.innerText || ""
    
    if (comment.dataset.lastParsedText === rawText) return
    
    const mdHtml = marked.parse(rawText)
    
    const div = document.createElement('div')
    div.innerHTML = mdHtml
    
    // Basic sanitization
    div.querySelectorAll('script').forEach(s => s.remove())
    div.querySelectorAll('*').forEach(el => {
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name)
        }
      }
    })
    div.querySelectorAll('a').forEach(a => {
      if (a.getAttribute('href')?.trim().toLowerCase().startsWith('javascript:')) {
        a.removeAttribute('href')
      }
    })
    
    // Wrap reply mentions like @nickname in premium badge spans
    function processTextNodes(element) {
      if (element.tagName === 'PRE' || element.tagName === 'CODE' || (element.classList && element.classList.contains('docs-comment-mention'))) {
        return
      }
      const childNodes = Array.from(element.childNodes)
      childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue
          const mentionRegex = /(^|[^a-zA-Z0-9_\-가-힣])@([a-zA-Z0-9_\-가-힣]+)/g
          if (mentionRegex.test(text)) {
            const tempSpan = document.createElement('span')
            tempSpan.innerHTML = text.replace(mentionRegex, '$1<span class="docs-comment-mention">@$2</span>')
            
            const parent = node.parentNode
            if (parent) {
              while (tempSpan.firstChild) {
                parent.insertBefore(tempSpan.firstChild, node)
              }
              parent.removeChild(node)
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          processTextNodes(node)
        }
      })
    }
    processTextNodes(div)
    
    if (!comment.parentNode) return
    
    // Find or create sibling
    let mdDiv = comment.nextSibling
    while (mdDiv && (!mdDiv.classList || !mdDiv.classList.contains('docs-comment-markdown'))) {
      mdDiv = mdDiv.nextSibling
    }
    
    if (!mdDiv) {
      mdDiv = document.createElement('div')
      mdDiv.className = 'docs-comment-markdown'
      comment.parentNode.insertBefore(mdDiv, comment.nextSibling)
    }
    
    mdDiv.innerHTML = div.innerHTML
    
    mdDiv.querySelectorAll('pre code').forEach((block) => {
      block.className = block.className.replace(/\blanguage-[a-z0-9_-]+\b/gi, '')
      const pre = block.parentElement
      const resolved = resolveCodeLanguage(pre.getAttribute('data-ke-language') || 'html')
      if (resolved.prism) {
        block.classList.add(`language-${resolved.prism}`)
        getPrism().highlightElement(block)
      }
    })
    
    comment.dataset.lastParsedText = rawText
  })
}

function setupFloatingLikeButton() {
  const floatingBtn = document.querySelector('.docs-like-btn--floating')
  const inlineBtn = document.querySelector('.docs-like-btn--inline')
  const sidebar = document.querySelector('.docs-article__like-sidebar')
  if (!floatingBtn && !inlineBtn) return

  let floatingGone = false
  let nativeLikeBtn = null
  let nativeObserver = null
  let waitObserver = null
  let syncTimer = null
  let preserveClickedStateUntil = 0
  const fallbackState = {
    loaded: false,
    liked: false,
    count: 0,
    pending: false
  }

  const setLikePending = (pending) => {
    fallbackState.pending = pending
    ;[inlineBtn, floatingBtn].filter(Boolean).forEach((button) => {
      button.disabled = pending
      button.setAttribute('aria-busy', pending ? 'true' : 'false')
    })
  }

  const killFloating = () => {
    if (floatingGone) return
    floatingGone = true
    if (floatingBtn) floatingBtn.classList.remove('is-revealed', 'is-drifting')
    if (sidebar) sidebar.style.display = 'none'
  }

  const getNativeRoot = () => (
    document.querySelector('[data-tistory-react-app="Reaction"]') ||
    document.querySelector('.postbtn_like') ||
    document.querySelector('.container_postbtn')
  )

  const findNativeLikeButton = () => {
    const reactionRoot = document.querySelector('[data-tistory-react-app="Reaction"]')
    const scopedButton = reactionRoot?.querySelector('button.uoc-icon, button[aria-label*="공감"], button[title*="공감"], button')
    if (scopedButton) return scopedButton

    const likeWrap = document.querySelector('.postbtn_like')
    const likeButton = likeWrap?.querySelector('button.uoc-icon, button[aria-label*="공감"], button[title*="공감"]')
    if (likeButton) return likeButton

    return document.querySelector('button.uoc-icon:not(.btn_share):not(.sns_btn)')
  }

  const getReactionEntryId = () => {
    const entryId = window.ReactionReqBody?.entryId
    if (entryId) return entryId

    const reactionId = document.querySelector('[data-tistory-react-app="Reaction"]')?.id || ''
    const fromReactionId = reactionId.match(/\d+/)?.[0]
    if (fromReactionId) return Number(fromReactionId)

    const fromPath = window.location.pathname.match(/\/(\d+)(?:\/)?$/)?.[1]
    return fromPath ? Number(fromPath) : null
  }

  const getReactionApiUrl = () => {
    const rawUrl = window.ReactionApiUrl || '/reaction'
    try {
      return new URL(rawUrl, window.location.href).href
    } catch {
      return ''
    }
  }

  const applyLikeState = (liked, count = 0) => {
    const buttons = [inlineBtn, floatingBtn].filter(Boolean)
    buttons.forEach((button) => {
      button.classList.toggle('is-active', liked)
      const icon = button.querySelector('.heart-icon')
      const heartPath = icon?.querySelector('path')
      if (icon) {
        icon.setAttribute('fill', liked ? 'currentColor' : 'none')
        icon.setAttribute('stroke', 'currentColor')
        icon.style.color = liked ? '#ff4a5a' : ''
      }
      if (heartPath) {
        heartPath.setAttribute('fill', liked ? 'currentColor' : 'none')
        heartPath.setAttribute('stroke', 'currentColor')
      }
      button.style.color = liked ? '#ff4a5a' : ''
      button.setAttribute('aria-pressed', liked ? 'true' : 'false')
      button.setAttribute('aria-label', liked ? '공감 취소' : '공감하기')
    })

    const countEl = inlineBtn?.querySelector('.like-count')
    if (countEl) {
      countEl.textContent = count > 0 ? String(count) : ''
      countEl.classList.toggle('has-value', count > 0)
    }

    if (liked) {
      killFloating()
    } else if (floatingBtn && !floatingGone) {
      floatingBtn.classList.add('is-revealed')
    }
  }

  const applyFallbackData = (responseData) => {
    const data = responseData?.data || responseData
    if (!data) return false

    const counter = data.reactionCounter || {}
    const nextCount = Number(counter.like ?? counter.sum)
    const reactionActivated = String(data.reactionActivated ?? '').toLowerCase()
    const hasLikedState = data.reactionActivated != null || typeof data.isActive === 'boolean'
    const liked = hasLikedState ? reactionActivated === 'like' || data.isActive === true : fallbackState.liked
    const count = Number.isFinite(nextCount) ? nextCount : fallbackState.count

    if (Date.now() < preserveClickedStateUntil && hasLikedState && liked !== fallbackState.liked) {
      return false
    }

    fallbackState.loaded = true
    fallbackState.liked = liked
    fallbackState.count = count
    applyLikeState(fallbackState.liked, fallbackState.count)
    return hasLikedState || Number.isFinite(nextCount)
  }

  const fetchFallbackState = async () => {
    const apiUrl = getReactionApiUrl()
    const entryId = getReactionEntryId()
    if (!apiUrl || !entryId) return false

    const url = new URL(apiUrl)
    url.searchParams.set('entryId', entryId)
    url.searchParams.set('_', String(Date.now()))

    const response = await fetch(url.href, {
      cache: 'no-store',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    })
    if (!response.ok) return false

    const responseData = await response.json().catch(() => null)
    return applyFallbackData(responseData)
  }

  const readLikeCount = () => {
    const root = getNativeRoot()
    const candidates = [
      nativeLikeBtn?.querySelector('.uoc-count, .txt_like, [class*="count"]'),
      root?.querySelector('.uoc-count, .txt_like, [class*="count"]'),
      nativeLikeBtn
    ].filter(Boolean)

    for (const node of candidates) {
      const rawCount = (node.textContent || '').replace(/[^0-9]/g, '')
      if (!rawCount) continue
      const count = Number(rawCount)
      if (Number.isFinite(count)) return count
    }
    return fallbackState.loaded ? fallbackState.count : 0
  }

  const isNativeLiked = () => {
    if (!nativeLikeBtn) return false
    const activeChild = nativeLikeBtn.querySelector('.like_on, .empathy_up_without_ani, .is-active, .active, [aria-pressed="true"]')
    const stateText = [
      nativeLikeBtn.className,
      nativeLikeBtn.getAttribute('aria-label'),
      nativeLikeBtn.getAttribute('title'),
      nativeLikeBtn.getAttribute('data-reaction-state'),
      nativeLikeBtn.querySelector('.uoc-icon')?.className,
      nativeLikeBtn.querySelector('.ico_like')?.parentElement?.className,
      nativeLikeBtn.parentElement?.className,
      nativeLikeBtn.closest('[class*="like"]')?.className,
      nativeLikeBtn.closest('[class*="reaction"]')?.className
    ].filter(Boolean).join(' ')

    return !!activeChild ||
      nativeLikeBtn.classList.contains('on') ||
      nativeLikeBtn.classList.contains('like_on') ||
      nativeLikeBtn.getAttribute('aria-pressed') === 'true' ||
      /(^|\s)(on|active|selected|liked|like_on|is-active)(\s|$)/i.test(stateText) ||
      /공감\s*(취소|완료|됨)|좋아요\s*(취소|완료|됨)/.test(stateText)
  }

  const syncWithNative = () => {
    nativeLikeBtn = nativeLikeBtn || findNativeLikeButton()
    if (!nativeLikeBtn) return false

    const liked = isNativeLiked()
    const count = readLikeCount()

    if (Date.now() < preserveClickedStateUntil && liked !== fallbackState.liked) {
      applyLikeState(fallbackState.liked, fallbackState.count)
      return true
    }

    fallbackState.loaded = true
    fallbackState.liked = liked
    fallbackState.count = count
    applyLikeState(liked, count)

    return true
  }

  const watchNative = () => {
    nativeLikeBtn = findNativeLikeButton()
    if (!nativeLikeBtn) return false

    syncWithNative()
    if (nativeObserver) nativeObserver.disconnect()
    nativeObserver = new MutationObserver(() => {
      window.clearTimeout(syncTimer)
      syncTimer = window.setTimeout(syncWithNative, 80)
    })

    const root = nativeLikeBtn.closest('[data-tistory-react-app="Reaction"]') ||
      nativeLikeBtn.closest('.postbtn_like') ||
      nativeLikeBtn.parentElement

    nativeObserver.observe(nativeLikeBtn, { attributes: true, attributeFilter: ['class', 'aria-pressed', 'title'] })
    if (root) {
      nativeObserver.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'aria-pressed', 'title', 'aria-label'] })
    }

    return true
  }

  const waitForNative = () => {
    if (watchNative()) return
    fetchFallbackState().catch(() => {})

    const root = getNativeRoot() || document.body
    if (!root || !('MutationObserver' in window)) return

    waitObserver = new MutationObserver(() => {
      if (watchNative()) {
        waitObserver.disconnect()
      }
    })
    waitObserver.observe(root, { childList: true, subtree: true })
    window.setTimeout(() => waitObserver?.disconnect(), 15000)
  }

  const triggerFallbackReaction = async () => {
    const apiUrl = getReactionApiUrl()
    const entryId = getReactionEntryId()
    if (!apiUrl || !entryId || fallbackState.pending) return false

    setLikePending(true)
    const wasLiked = fallbackState.liked
    const nextLiked = !wasLiked
    const nextCount = Math.max(0, fallbackState.count + (nextLiked ? 1 : -1))
    try {
      const response = await fetch(apiUrl, {
        method: wasLiked ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(wasLiked ? { entryId } : { entryId, reactionType: 'LIKE' })
      })
      const responseData = await response.json().catch(() => null)
      if (!response.ok) {
        applyLikeState(fallbackState.liked, fallbackState.count)
        return false
      }
      fallbackState.loaded = true
      fallbackState.liked = nextLiked
      fallbackState.count = nextCount
      preserveClickedStateUntil = Date.now() + 2500
      applyLikeState(fallbackState.liked, fallbackState.count)
      window.setTimeout(() => { fetchFallbackState().catch(() => {}) }, 1800)
      return true
    } catch {
      applyLikeState(fallbackState.liked, fallbackState.count)
      return false
    } finally {
      setLikePending(false)
    }
  }

  const triggerNativeLike = () => {
    nativeLikeBtn = findNativeLikeButton()
    if (!nativeLikeBtn || fallbackState.pending) return false

    setLikePending(true)
    const wasLiked = fallbackState.loaded ? fallbackState.liked : isNativeLiked()
    const nextLiked = !wasLiked
    const currentCount = readLikeCount()
    const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1))
    nativeLikeBtn.click()
    fallbackState.loaded = true
    fallbackState.liked = nextLiked
    fallbackState.count = nextCount
    preserveClickedStateUntil = Date.now() + 2500
    applyLikeState(nextLiked, nextCount)
    window.setTimeout(() => {
      setLikePending(false)
      syncWithNative()
    }, 900)
    window.setTimeout(syncWithNative, 1800)
    return true
  }

  const triggerLike = async () => {
    if (triggerNativeLike()) return true
    return triggerFallbackReaction()
  }

  if (floatingBtn) {
    floatingBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      if (!await triggerLike()) return
      if (fallbackState.liked) {
        floatingBtn.classList.remove('is-revealed', 'is-drifting')
        floatingBtn.classList.add('is-vanishing')
        floatingGone = true
        window.setTimeout(() => { if (sidebar) sidebar.style.display = 'none' }, 600)
      }
    })
  }

  if (inlineBtn) {
    inlineBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      if (!await triggerLike()) return
    })
  }

  if (floatingBtn && sidebar) {
    let driftTimer = null
    let ticking = false
    window.addEventListener('scroll', () => {
      if (floatingGone || ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        if (floatingGone || !floatingBtn.classList.contains('is-revealed')) return
        floatingBtn.classList.remove('is-drifting')
        void floatingBtn.offsetWidth
        floatingBtn.classList.add('is-drifting')
        window.clearTimeout(driftTimer)
        driftTimer = window.setTimeout(() => floatingBtn.classList.remove('is-drifting'), 1600)
      })
    }, { passive: true })
  }

  waitForNative()
  if (inlineBtn) inlineBtn.addEventListener('mouseenter', () => syncWithNative())
}

function arrangeLikeButton() {
  const sidebar = document.querySelector('.docs-article__like-sidebar')
  if (!sidebar) return
  
  const isMobile = window.innerWidth < 1180
  if (isMobile) {
    return
  } else {
    const target = document.querySelector('.docs-article')
    if (target && sidebar.parentNode !== target) {
      target.insertBefore(sidebar, target.firstChild)
    }
  }
}

function init() {
  injectCodeCSS()
  applyTheme(getSavedTheme())
  decorateWriteLinks()
  showAdminElements()
  setupThumbnailFallbacks()
  renderCategoryMap()
  setupCategoryTree()
  bindGlobalActions()
  enhanceCodeBlocks()
  markPageState()
  normalizeArticleMedia()
  showEmptyStateWhenNeeded()
  normalizeListMeta()
  normalizeListCards()
  assignHeadingIds()
  generateTOC()
  setupHeadingAnchors()
  syncCommentComposerAvatar()
  normalizeLegacyComments()
  trackOpenCommentMenus()
  setupCommentAvatarLogin()
  setupCommentReplyClick()
  renderCommentMarkdown()
  
  cleanInlineStyles()
  preserveWordCombination()
  const article = document.querySelector('[data-docs-article]')
  if (article && 'MutationObserver' in window) {
    let mutationTimer = null
    const observer = new MutationObserver((mutations, obs) => {
      clearTimeout(mutationTimer)
      mutationTimer = setTimeout(() => {
        obs.disconnect()
        
        cleanInlineStyles()
        preserveWordCombination()
        setupHeadingAnchors()
        
        obs.observe(article, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
      }, 150)
    })
    observer.observe(article, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
  }
  
  const commentsArea = document.querySelector('.docs-comments')
  if (commentsArea && 'MutationObserver' in window) {
    let cmtTimer = null
    const cmtObserver = new MutationObserver(() => {
      clearTimeout(cmtTimer)
      cmtTimer = setTimeout(() => {
        renderCommentMarkdown()
        setupCommentReplyClick()
      }, 100)
    })
    cmtObserver.observe(commentsArea, { childList: true, subtree: true })
  }

  // Arrange like button position based on viewport width
  arrangeLikeButton()
  window.addEventListener('resize', arrangeLikeButton)

  // Set up custom floating like/heart button programmatically
  setupFloatingLikeButton()

  // Prevent initial theme transitions load flicker/flash
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transitions')
    })
  })
}

function setupCommentReplyClick() {
  const attach = () => {
    document.querySelectorAll('.docs-comments .tt-box-meta').forEach(meta => {
      if (meta.dataset.replyAttached) return
      meta.dataset.replyAttached = 'true'
      
      const link = meta.querySelector('a') || meta
      link.style.cursor = 'pointer'
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const card = meta.closest('.tt-wrap-cmt') || meta.closest('li')
        const replyBtn = card?.querySelector('.tt-wrap-info .tt-link-comment') || card?.querySelector('.tt-wrap-link-comment a')
        if (replyBtn) {
          replyBtn.click()
        }
      })
    })
  }

  attach()

  const root = document.querySelector('.docs-comments')
  if (!root || !('MutationObserver' in window)) return

  const observer = new MutationObserver(attach)
  observer.observe(root, { childList: true, subtree: true })
  setTimeout(() => observer.disconnect(), 10000)
}

function setupCommentAvatarLogin() {
  const attach = () => {
    const forms = document.querySelectorAll('.docs-comments .tt-area-write')
    forms.forEach(form => {
      // Skip if already has tt-inner-g (logged-in user)
      if (form.querySelector('.tt-inner-g')) return

      const thumb = form.querySelector('.tt-box-thumb')
      if (!thumb || thumb.dataset.loginAttached) return

      thumb.dataset.loginAttached = 'true'
      thumb.style.cursor = 'pointer'
      thumb.title = '로그인하기'
      thumb.addEventListener('click', (e) => {
        e.preventDefault()
        const blogUrl = window.location.origin
        window.location.href = `https://www.tistory.com/auth/login?redirectUrl=${encodeURIComponent(blogUrl + window.location.pathname)}`
      })
    })
  }

  attach()

  const root = document.querySelector('.docs-comments')
  if (!root || !('MutationObserver' in window)) return

  const observer = new MutationObserver(attach)
  observer.observe(root, { childList: true, subtree: true })
  setTimeout(() => observer.disconnect(), 10000)
}

function assignHeadingIds() {
  const article = document.querySelector('[data-docs-article]')
  if (!article) return
  
  const headings = article.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const usedIds = new Set()
  
  // First pass: remember manually set IDs
  headings.forEach(heading => {
    const existingId = heading.getAttribute('id')
    if (existingId && !existingId.startsWith('heading-')) {
      usedIds.add(existingId)
    }
  })
  
  // Second pass: generate readable IDs
  headings.forEach(heading => {
    let id = heading.getAttribute('id')
    if (!id || id.startsWith('heading-')) {
      let baseId = heading.textContent
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}\-_]/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      if (!baseId) baseId = 'heading'
      
      id = baseId
      let counter = 1
      while (usedIds.has(id)) {
        id = `${baseId}-${counter++}`
      }
      heading.setAttribute('id', id)
      usedIds.add(id)
    }
  })
}

function generateTOC() {
  const article = document.querySelector('[data-docs-article]')
  const tocNav = document.getElementById('toc-content')
  const tocContainer = document.querySelector('.docs-toc')
  const layout = document.querySelector('.docs-layout')
  if (!article || !tocNav) return

  if (layout) layout.classList.add('has-article')
  if (tocContainer) tocContainer.style.display = ''

  tocNav.innerHTML = ''

  const headings = article.querySelectorAll('h2, h3')
  if (headings.length === 0) {
    document.body.classList.add('no-toc')
    if (tocContainer) tocContainer.style.display = 'none'
    return
  }

  document.body.classList.remove('no-toc')

  const ul = document.createElement('ul')
  headings.forEach((heading) => {
    const id = heading.getAttribute('id')

    const li = document.createElement('li')
    li.className = `toc-item toc-item--${heading.tagName.toLowerCase()}`
    
    const a = document.createElement('a')
    a.setAttribute('href', `#${id}`)
    a.textContent = heading.textContent
    a.dataset.depth = heading.tagName === 'H3' ? '3' : '2'
    
    li.appendChild(a)
    ul.appendChild(li)
  })

  tocNav.appendChild(ul)
  setupTocActiveState()
}

function setupHeadingAnchors() {
  const article = document.querySelector('[data-docs-article]')
  if (!article) return
  
  const headings = article.querySelectorAll('h1, h2, h3, h4')
  headings.forEach((heading) => {
    // 1. Ensure unique ID exists
    const id = heading.getAttribute('id')
    
    // 2. Avoid duplicate anchor injection
    if (heading.querySelector('.heading-anchor') || heading.querySelector('.heading-text-link')) return
    
    // 3. Create elegant heading text link
    const textLink = document.createElement('a')
    textLink.className = 'heading-text-link'
    textLink.setAttribute('href', `#${id}`)
    
    // Move all existing children of heading to the textLink
    while (heading.firstChild) {
      textLink.appendChild(heading.firstChild)
    }
    heading.appendChild(textLink)
    
    // 4. Create elegant '#' anchor element
    const anchor = document.createElement('a')
    anchor.className = 'heading-anchor'
    anchor.setAttribute('href', `#${id}`)
    anchor.setAttribute('aria-hidden', 'true')
    anchor.textContent = '#'
    
    heading.appendChild(anchor)
  })
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
