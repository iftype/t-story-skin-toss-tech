import { cleanTextContent, escapeHtml } from './utils.js'

// 본문 이미지를 누르면 원본 페이지로 이동하는 대신, 제자리에서 살짝 크게 보여준다.
// 다시 누르거나 Esc 를 누르면 원래 크기로 돌아간다.
const ZOOM_RATIO = 1.4
const ZOOM_MS = 320
const ZOOM_TRANSITION = `width ${ZOOM_MS}ms cubic-bezier(0.22, 1, 0.36, 1), margin-left ${ZOOM_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`

function zoomTarget(image) {
  return image.closest('figure, .imageblock, p') || image.parentElement
}

function setImportant(el, styles) {
  Object.entries(styles).forEach(([key, value]) => el.style.setProperty(key, value, 'important'))
}

function clearImportant(el, keys) {
  keys.forEach((key) => el.style.removeProperty(key))
}

function zoomIn(image) {
  const box = zoomTarget(image)
  const column = box.parentElement.getBoundingClientRect()
  const current = image.getBoundingClientRect()
  if (!current.width) return

  const ratio = current.height / current.width
  const naturalWidth = image.naturalWidth || Number(image.getAttribute('data-origin-width')) || current.width * ZOOM_RATIO
  const sideGap = 48
  let width = Math.min(current.width * ZOOM_RATIO, window.innerWidth - sideGap, naturalWidth)
  width = Math.min(width, (window.innerHeight * 0.85) / ratio)
  if (width <= current.width + 8) return // 더 키울 여유가 없으면 그대로

  // 줄일 때 돌아갈 크기와 위치(본문 칸 기준)를 기억해 둔다
  const startLeft = current.left - column.left
  box.dataset.zoomFromWidth = String(current.width)
  box.dataset.zoomFromLeft = String(startLeft)

  setImportant(box, { 'max-width': 'none', width: `${current.width}px`, 'margin-left': `${startLeft}px`, transform: 'none' })
  setImportant(image, { width: '100%', 'max-width': 'none', 'max-height': 'none', height: 'auto', margin: '0' })
  void box.offsetWidth
  setImportant(box, { transition: ZOOM_TRANSITION, width: `${width}px`, 'margin-left': `${(column.width - width) / 2}px` })
  box.classList.add('is-image-zoomed')
  document.body.classList.add('has-zoomed-image')
  image.setAttribute('aria-expanded', 'true')
}

function zoomOut(image) {
  const box = zoomTarget(image)
  if (!box.classList.contains('is-image-zoomed')) return
  box.classList.remove('is-image-zoomed')
  if (!document.querySelector('.is-image-zoomed')) document.body.classList.remove('has-zoomed-image')
  image.setAttribute('aria-expanded', 'false')
  setImportant(box, { width: `${box.dataset.zoomFromWidth}px`, 'margin-left': `${box.dataset.zoomFromLeft}px` })
  window.setTimeout(() => {
    if (box.classList.contains('is-image-zoomed')) return
    clearImportant(box, ['transition', 'max-width', 'width', 'margin-left', 'transform'])
    clearImportant(image, ['width', 'max-width', 'max-height', 'height', 'margin'])
  }, ZOOM_MS)
}

export function enableArticleImageLinks() {
  const article = document.querySelector('[data-docs-article]')
  if (!article) return

  article.querySelectorAll('img').forEach((image) => {
    if (image.closest('a, button, .code-frame')) return
    const src = image.getAttribute('src') || ''
    if (!src || src.includes('[##_')) return

    image.classList.add('article-image-zoomable')
    image.setAttribute('role', 'button')
    image.setAttribute('tabindex', '0')
    image.setAttribute('aria-expanded', 'false')
    image.setAttribute('aria-label', `${image.getAttribute('alt') || '이미지'} 크게 보기`)

  })

  // 이미지 노드가 나중에 교체돼도 동작하도록 window 캡처 단계에서 한 번만 처리한다.
  // 캡처에서 먼저 막아야 티스토리 기본 이미지 뷰어(전체 화면)가 열리지 않는다.
  const toggle = (e) => {
    const image = e.target.closest?.('img.article-image-zoomable')
    if (!image || !image.closest('[data-docs-article]')) return
    // 모바일은 이미지가 이미 화면 폭을 다 써서 키울 여유가 없다. 아무 동작도 하지 않는다
    if (window.innerWidth <= 760) { e.preventDefault(); e.stopImmediatePropagation(); return }
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    e.stopImmediatePropagation()
    if (zoomTarget(image).classList.contains('is-image-zoomed')) zoomOut(image)
    else zoomIn(image)
  }
  window.addEventListener('click', toggle, true)
  window.addEventListener('keydown', toggle, true)

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    document.querySelectorAll('[data-docs-article] .is-image-zoomed img.article-image-zoomable').forEach(zoomOut)
  })
  window.addEventListener('resize', () => {
    document.querySelectorAll('[data-docs-article] .is-image-zoomed img.article-image-zoomable').forEach(zoomOut)
  })
}

export function normalizeArticleMedia() {
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

export function normalizeMarkdownListParagraphs() {
  const article = document.querySelector('[data-docs-article]')
  if (!article) return

  const isListParagraph = (node) => {
    if (!node || node.tagName !== 'P' || node.dataset.markdownListNormalized === 'true') return null
    if (node.closest('blockquote, pre, code, table, ul, ol')) return null
    const text = (node.textContent || '').trim()
    if (/^[-*]\s+/.test(text)) return { type: 'ul', marker: /^[-*]\s+/ }
    if (/^\d+[.)]\s+/.test(text)) return { type: 'ol', marker: /^\d+[.)]\s+/ }
    return null
  }

  const stripMarker = (paragraph, marker) => {
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
    let textNode = walker.nextNode()
    while (textNode && !textNode.nodeValue.trim()) textNode = walker.nextNode()
    if (!textNode) return
    textNode.nodeValue = textNode.nodeValue.replace(marker, '')
  }

  const paragraphs = Array.from(article.querySelectorAll(':scope > p'))
  let index = 0
  while (index < paragraphs.length) {
    const first = paragraphs[index]
    const match = isListParagraph(first)
    if (!match) {
      index += 1
      continue
    }

    const list = document.createElement(match.type)
    list.className = 'article-markdown-list'
    let cursor = index
    while (cursor < paragraphs.length) {
      const paragraph = paragraphs[cursor]
      const itemMatch = isListParagraph(paragraph)
      if (!itemMatch || itemMatch.type !== match.type) break

      stripMarker(paragraph, itemMatch.marker)
      paragraph.dataset.markdownListNormalized = 'true'

      const item = document.createElement('li')
      while (paragraph.firstChild) item.appendChild(paragraph.firstChild)
      list.appendChild(item)
      cursor += 1
    }

    first.parentNode.insertBefore(list, first)
    for (let removeIndex = index; removeIndex < cursor; removeIndex += 1) {
      paragraphs[removeIndex].remove()
    }
    index = cursor
  }
}

export function assignHeadingIds() {
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
    const headingText = cleanTextContent(heading.textContent || '')
    if (!headingText) {
      heading.removeAttribute('id')
      heading.dataset.skipAnchor = 'true'
      return
    }

    let id = heading.getAttribute('id')
    if (!id || id.startsWith('heading-')) {
      let baseId = headingText
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}\-_]/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      if (!baseId) {
        heading.removeAttribute('id')
        heading.dataset.skipAnchor = 'true'
        return
      }
      
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

export function setupHeadingAnchors() {
  const article = document.querySelector('[data-docs-article]')
  if (!article) return
  
  const headings = article.querySelectorAll('h1, h2, h3, h4')
  headings.forEach((heading) => {
    // 1. Ensure unique ID exists
    const id = heading.getAttribute('id')
    if (!id || heading.dataset.skipAnchor === 'true' || !cleanTextContent(heading.textContent || '')) return
    
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

