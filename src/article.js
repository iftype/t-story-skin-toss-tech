import { cleanTextContent, escapeHtml } from './utils.js'

// 본문 이미지를 누르면 이미지만 화면 위에 떠서 살짝 크게 보인다(전체 화면 뷰어 아님).
// 떠 있는 이미지·빈 곳·다른 곳을 누르거나 Esc·스크롤하면 원래 자리로 돌아간다.
// 다른 이미지를 누르면 지금 것을 닫고 그 이미지를 띄운다.
const ZOOM_RATIO = 1.4
const ZOOM_MS = 280
const ZOOM_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

let zoomed = null // { image, layer, backdrop, from }

function targetRect(image, from) {
  const natural = image.naturalWidth || Number(image.getAttribute('data-origin-width')) || from.width * ZOOM_RATIO
  const ratio = from.height / from.width
  let width = Math.min(from.width * ZOOM_RATIO, window.innerWidth - 96, natural)
  width = Math.min(width, (window.innerHeight * 0.85) / ratio)
  width = Math.max(width, from.width) // 작아지지는 않게
  const height = width * ratio
  return { left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2, width, height }
}

function closeZoom(immediate = false) {
  if (!zoomed) return
  const { image, layer, backdrop } = zoomed
  zoomed = null
  const back = image.getBoundingClientRect()
  backdrop.style.opacity = '0'
  if (immediate || !back.width) {
    layer.remove(); backdrop.remove(); image.style.visibility = ''
    return
  }
  Object.assign(layer.style, { left: `${back.left}px`, top: `${back.top}px`, width: `${back.width}px`, height: `${back.height}px` })
  window.setTimeout(() => { layer.remove(); backdrop.remove(); image.style.visibility = '' }, ZOOM_MS)
}

function openZoom(image) {
  const from = image.getBoundingClientRect()
  if (!from.width) return
  const to = targetRect(image, from)

  const backdrop = document.createElement('div')
  backdrop.className = 'image-zoom-backdrop'
  const layer = document.createElement('img')
  layer.className = 'image-zoom-layer'
  layer.src = image.currentSrc || image.src
  layer.alt = image.alt || ''
  Object.assign(layer.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, transition: `left ${ZOOM_MS}ms ${ZOOM_EASE}, top ${ZOOM_MS}ms ${ZOOM_EASE}, width ${ZOOM_MS}ms ${ZOOM_EASE}, height ${ZOOM_MS}ms ${ZOOM_EASE}` })
  document.body.append(backdrop, layer)
  image.style.visibility = 'hidden'
  zoomed = { image, layer, backdrop }

  void layer.offsetWidth
  backdrop.style.opacity = '1'
  Object.assign(layer.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` })
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
    image.setAttribute('aria-label', `${image.getAttribute('alt') || '이미지'} 크게 보기`)
  })

  // window 캡처 단계에서 처리해야 티스토리 기본 이미지 뷰어(전체 화면)보다 먼저 막을 수 있다.
  const onClick = (e) => {
    const image = e.target.closest?.('img.article-image-zoomable')
    const isArticleImage = image && image.closest('[data-docs-article]')

    if (zoomed) {
      const wasSame = isArticleImage && zoomed.image === image
      closeZoom()
      // 떠 있는 동안의 클릭은 닫기만 한다(뒤에 있던 링크 등이 눌리지 않게). 다른 이미지면 이어서 띄운다
      e.preventDefault()
      e.stopImmediatePropagation()
      if (wasSame || !isArticleImage) return
    }
    if (!isArticleImage) return
    e.preventDefault()
    e.stopImmediatePropagation()
    // 모바일은 이미지가 이미 화면 폭을 다 쓰고 있어 키울 여유가 없다
    if (window.innerWidth <= 760) return
    openZoom(image)
  }
  window.addEventListener('click', onClick, true)

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeZoom()
    const image = e.target.closest?.('img.article-image-zoomable')
    if (image && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      if (zoomed?.image === image) closeZoom()
      else { closeZoom(true); if (window.innerWidth > 760) openZoom(image) }
    }
  }, true)
  window.addEventListener('scroll', () => closeZoom(), { passive: true })
  window.addEventListener('resize', () => closeZoom(true))
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

