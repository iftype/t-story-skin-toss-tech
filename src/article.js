import { cleanTextContent, escapeHtml } from './utils.js'

export function enableArticleImageLinks() {
  const article = document.querySelector('[data-docs-article]')
  if (!article) return

  article.querySelectorAll('img').forEach((image) => {
    if (image.closest('a, button')) return
    const src = image.currentSrc || image.getAttribute('src') || image.getAttribute('data-origin-url') || ''
    if (!src || src.includes('[##_')) return

    const link = document.createElement('a')
    link.className = 'article-image-link'
    link.href = src
    image.parentNode.insertBefore(link, image)
    link.appendChild(image)
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

