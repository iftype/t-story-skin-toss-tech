import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import plaintext from 'highlight.js/lib/languages/plaintext'
import python from 'highlight.js/lib/languages/python'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import './styles.css'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('zsh', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('jsx', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('plaintext', plaintext)
hljs.registerLanguage('text', plaintext)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)

const STORAGE_KEY = 'docs-theme'

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
    setTimeout(() => clearInterval(interval), 5000)
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
    if (el.closest('pre') || el.closest('.hljs') || el.closest('.code-frame')) return

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

  // If the root list has exactly one child LI, and that LI contains a nested UL,
  // that nested UL is the actual categories list (bypassing the "All posts" root wrapper).
  const directLis = Array.from(rootUl.children).filter(child => child.tagName === 'LI')
  if (directLis.length === 1) {
    const nestedUl = directLis[0].querySelector('ul')
    if (nestedUl) {
      rootUl = nestedUl
    }
  }

  // Helpers to check current page path & descendant active states
  const parseLevel = (ulElement) => {
    const items = []
    const lis = Array.from(ulElement.children).filter(child => child.tagName === 'LI')

    for (const li of lis) {
      const link = Array.from(li.children).find(child => child.tagName === 'A')
      if (!link) continue

      const childUl = Array.from(li.children).find(child => child.tagName === 'UL')
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

  const categoryData = parseLevel(rootUl)

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
        localStorage.setItem(`vs-tree-folder:${href}`, isOpen ? 'true' : 'false')
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
          localStorage.setItem(`vs-tree-folder:${href}`, isOpen ? 'true' : 'false')
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

function normalizeCodeLanguage(value) {
  if (!value) return ''
  return String(value)
    .trim()
    .replace(/^language-/, '')
    .split(/\s+/)[0]
    .replace(/[{}"'`]/g, '')
    .toLowerCase()
}

function getCodeBlockMeta(pre, block) {
  const langFromCodeClass = Array.from(block.classList)
    .find(c => c.startsWith('language-'))

  const langFromPreClass = Array.from(pre.classList)
    .find(c => /^[a-z0-9_+-]+$/i.test(c) && c !== 'line-numbers')

  const lang = normalizeCodeLanguage(
    langFromCodeClass ||
    pre.getAttribute('data-ke-language') ||
    pre.getAttribute('data-language') ||
    pre.getAttribute('data-lang') ||
    langFromPreClass ||
    'text'
  ) || 'text'

  return {
    lang,
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
    stripCodeMetaDirective(block)
    block.classList.add(`language-${meta.lang}`)
    try {
      if (hljs.getLanguage(meta.lang)) {
        hljs.highlightElement(block)
      } else {
        block.textContent = block.textContent || ''
      }
    } catch {
      block.textContent = block.textContent || ''
    }

    const wrapper = document.createElement('div')
    wrapper.className = 'code-frame'

    const header = document.createElement('div')
    header.className = 'code-header'
    header.innerHTML = `
      <div class="code-dots" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="code-title">${meta.lang}</div>
      <button class="code-copy" type="button">Copy</button>
    `

    pre.parentNode.insertBefore(wrapper, pre)
    wrapper.appendChild(header)
    wrapper.appendChild(pre)
    pre.dataset.enhanced = 'true'

    header.querySelector('.code-copy').addEventListener('click', (event) => {
      navigator.clipboard.writeText(block.textContent || '')
      event.currentTarget.textContent = 'Copied!'
      window.setTimeout(() => {
        event.currentTarget.textContent = 'Copy'
      }, 1600)
    })
  })
}

function markPageState() {
  const hasListItems = Boolean(document.querySelector('.docs-list-item'))
  const hasPageHead = Boolean(document.querySelector('.docs-page-head'))
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'

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

function renderCategoryItems(root) {
  const items = Array.from(root.children).filter((child) => child.matches('li'))
  if (items.length === 0) return ''

  return `<ul>${items.map((item) => {
    const link = Array.from(item.children).find((child) => child.matches?.('a'))
    const childList = Array.from(item.children).find((child) => child.matches?.('ul'))
    if (!link) return ''

    const href = link.getAttribute('href') || '/category'
    const current = link.matches('a.tt_category_current, .selected, .is-current') || item.classList.contains('on')
    const count = categoryCount(link)
    return `
      <li>
        <a href="${href}" ${current ? 'aria-current="page"' : ''}>
          <span>${escapeHtml(categoryName(link))}</span>
          ${count ? `<em>${count}</em>` : ''}
        </a>
        ${childList ? renderCategoryItems(childList) : ''}
      </li>
    `
  }).join('')}</ul>`
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

  const currentLink = tree.querySelector('a.tt_category_current, li.on > a, a.selected, a.is-current')
  const links = []

  if (currentLink) {
    let currentLi = currentLink.closest('li')
    while (currentLi) {
      const link = Array.from(currentLi.children).find((child) => child.matches?.('a'))
      if (link) links.unshift({
        href: link.getAttribute('href') || '/category',
        text: categoryName(link)
      })
      currentLi = currentLi.parentElement?.closest('li')
    }
  }

  const categoryRoot = tree.querySelector('.tt_category > li > .category_list') || tree.querySelector('.category_list') || tree.querySelector('ul')
  const overview = categoryRoot ? renderCategoryItems(categoryRoot) : ''
  const trail = links.length > 0
    ? links.map((link, index) => `
      <span aria-hidden="true">/</span>
      <a href="${link.href}" ${index === links.length - 1 ? 'aria-current="page"' : ''}>${escapeHtml(link.text)}</a>
    `).join('')
    : ''

  map.innerHTML = `
    <div class="docs-category-map__eyebrow">Category</div>
    <div class="docs-category-map__trail">
      <a href="/">전체보기</a>
      ${trail}
    </div>
    <div class="docs-category-map__grid">
      ${overview}
    </div>
  `
  map.hidden = false
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
        return bg && bg !== 'none'
      })

    const sourceImg = sourceThumb?.querySelector('img') || document.querySelector('.docs-comments .tt-wrap-cmt .tt-box-thumb img')
    const bg = sourceThumb ? getComputedStyle(sourceThumb).backgroundImage : ''
    const src = sourceImg?.currentSrc || sourceImg?.src || ''

    if ((!bg || bg === 'none') && !src) return false

    let allSynced = true
    composerThumbs.forEach((thumb) => {
      if (thumb.dataset.composerSynced === 'true') return

      const currentBg = getComputedStyle(thumb).backgroundImage
      if (currentBg && currentBg !== 'none') {
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
        ensureThumb(form, bg)
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

function init() {
  applyTheme(getSavedTheme())
  decorateWriteLinks()
  showAdminElements()
  setupCategoryTree()
  bindGlobalActions()
  enhanceCodeBlocks()
  markPageState()
  normalizeArticleMedia()
  renderCategoryMap()
  showEmptyStateWhenNeeded()
  normalizeListMeta()
  normalizeListCards()
  generateTOC()
  syncCommentComposerAvatar()
  normalizeLegacyComments()
  trackOpenCommentMenus()
  setupCommentAvatarLogin()
  setupCommentReplyClick()
  
  cleanInlineStyles()
  preserveWordCombination()
  const article = document.querySelector('[data-docs-article]')
  if (article && 'MutationObserver' in window) {
    const observer = new MutationObserver((mutations, obs) => {
      // Disconnect observer during styling/DOM adjustments to prevent recursion
      obs.disconnect()
      
      cleanInlineStyles()
      preserveWordCombination()
      
      obs.observe(article, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
    })
    observer.observe(article, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
  }
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
  headings.forEach((heading, index) => {
    const id = `heading-${index}`
    heading.setAttribute('id', id)

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
