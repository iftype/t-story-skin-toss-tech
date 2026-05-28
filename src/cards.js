import { cleanTextContent, escapeHtml } from './utils.js'

let featuredAutoplayTimer = null

export function markPageState() {
  // Reset all page state classes to prevent stale states during navigation
  document.body.classList.remove(
    'is-home-page',
    'is-list-context',
    'has-list-page',
    'has-article-page',
    'is-category-page',
    'is-category-index'
  )

  const bodyId = document.body.id || ''
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'
  document.body.dataset.path = normalizedPath
  const listBodyIds = new Set([
    'tt-body-index',
    'tt-body-category',
    'tt-body-search',
    'tt-body-tag',
    'tt-body-archive'
  ])
  const hasResolvedBodyId = bodyId && !bodyId.includes('[##_')
  const isListPage = hasResolvedBodyId
    ? listBodyIds.has(bodyId)
    : Boolean(document.querySelector('.docs-list-item, .docs-page-head, .docs-empty-state'))
  const isArticlePage = hasResolvedBodyId
    ? bodyId === 'tt-body-page'
    : Boolean(document.querySelector('.docs-article-layout, .docs-article, .docs-guestbook'))

  if (normalizedPath === '/' || normalizedPath.endsWith('/skin.html')) {
    document.body.classList.add('is-home-page')
  }

  if (isListPage) {
    document.body.classList.add('is-list-context')
    document.body.classList.add('has-list-page')
  }

  if (isArticlePage) {
    document.body.classList.add('has-article-page')
  }

  if (normalizedPath.startsWith('/category')) {
    document.body.classList.add('is-category-page')
    if (normalizedPath === '/category') {
      document.body.classList.add('is-category-index')
    }
  }

  const pageHead = document.querySelector('.docs-page-head')
  if (pageHead) {
    pageHead.hidden = normalizedPath === '/' || normalizedPath === '/category' || normalizedPath.endsWith('/skin.html')
  }
}

export function setupPageHeadEyebrow() {
  const eyebrow = document.querySelector('[data-page-head-eyebrow]')
  if (!eyebrow) return

  const bodyId = document.body.id
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'

  const isCategory = bodyId === 'tt-body-category' || normalizedPath.startsWith('/category')
  const isSearch = bodyId === 'tt-body-search' || normalizedPath.startsWith('/search') || window.location.search.indexOf('search=') >= 0
  const isTag = bodyId === 'tt-body-tag' || normalizedPath.startsWith('/tag')
  const isArchive = bodyId === 'tt-body-archive' || normalizedPath.startsWith('/archive')

  let text = ''
  if (isCategory) {
    text = 'Category'
  } else if (isSearch) {
    text = 'Search'
  } else if (isTag) {
    text = 'Tag'
  } else if (isArchive) {
    text = 'Archive'
  }

  if (text) {
    eyebrow.textContent = text
    eyebrow.style.display = 'block'
  } else {
    eyebrow.style.display = 'none'
  }
}

export function showEmptyStateWhenNeeded() {
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

export function normalizeListMeta() {
  const meta = document.querySelector('.docs-page-head__meta')
  if (!meta) return

  if (/글\s*\d+\s*개/.test(meta.textContent)) return
  const count = meta.textContent.match(/\d+/)?.[0]
  if (count) meta.textContent = `글 ${count}개`
}

export function normalizeListCards() {
  // Skeletons are now pre-rendered natively inside skin.html to ensure 100% CLS-free refresh.
}

export function placeholderSeed(href = '', title = '') {
  let pathname = ''
  try {
    pathname = href ? new URL(href, window.location.origin).pathname : ''
  } catch {
    pathname = href || ''
  }

  return `${pathname.replace(/\/$/, '')}|${cleanTextContent(title)}`
}

// Hash function to generate a stable blue brand gradient for empty posts

export function generateStablePlaceholder(str, labelSource = str) {
  let hash = 0
  if (str) {
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
  }
  hash = Math.abs(hash)

  // Keep generated placeholders in a restrained cyan-blue range.
  const baseHue = 190 + (hash % 28)
  const targetHue = 206 + ((hash >> 4) % 24)
  const sat = 68 + ((hash >> 2) % 10)
  const light = 48 + ((hash >> 6) % 8)
  
  const gradient = `linear-gradient(135deg, hsl(${baseHue}, ${sat}%, ${light}%) 0%, hsl(${targetHue}, ${sat}%, ${light}%) 100%)`

  const source = cleanTextContent(labelSource || str || '')
  const label = (source.match(/[A-Za-z0-9가-힣]/g) || ['#']).slice(0, 2).join('').toUpperCase()

  return { gradient, label }
}

export function applyGeneratedListPlaceholder(item) {
  if (!item || item.classList.contains('is-empty')) return

  const thumb = item.querySelector('.docs-list-item__thumb')
  if (!thumb) return

  item.classList.add('is-empty')
  thumb.querySelector('img')?.remove()
  thumb.querySelector('.docs-list-item__ghost-container')?.remove()
  thumb.querySelector('.docs-list-item__placeholder-emoji')?.remove()

  const href = item.dataset.cardHref || ''
  const title = cleanTextContent(item.querySelector('.docs-list-item__title')?.textContent || '')
  const { gradient, label } = generateStablePlaceholder(placeholderSeed(href, title), title)

  thumb.style.setProperty('background', gradient, 'important')
  thumb.style.position = 'relative'

  const labelEl = document.createElement('div')
  labelEl.className = 'docs-list-item__placeholder-emoji'
  labelEl.textContent = label
  thumb.appendChild(labelEl)
}

export async function hydrateHomeFeatured() {
  const root = document.querySelector('[data-home-featured]')
  if (!root || !document.body.classList.contains('is-home-page')) return

  // Prevent double hydration if sidebar data is already loaded and active
  if (root.classList.contains('is-hydrated') && root.dataset.source === 'sidebar') return

  // Forcefully strip hydration and ready classes at the very beginning of fetch to show skeletons
  root.classList.remove('is-hydrated')
  root.classList.remove('is-ready')

  // Extract articles from Tistory's sidebar recent posts widget — respect the admin's configured count
  const recentLinks = Array.from(document.querySelectorAll('.docs-nav__list--recent a'))
  let slides = []

  if (recentLinks.length > 0) {
    root.dataset.source = 'sidebar'
    const slidePromises = recentLinks.map(async (linkEl) => {
      const href = linkEl.getAttribute('href')
      const title = cleanTextContent(linkEl.textContent || '')
      try {
        const response = await fetch(href)
        if (!response.ok) throw new Error('Fetch failed')
        const html = await response.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        // 1. Extract thumbnail
        let imageSrc = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''
        if (imageSrc && (imageSrc.includes('tistory.com/static') || imageSrc.includes('img_blank'))) {
          imageSrc = ''
        }
        if (!imageSrc) {
          const bodyImg = doc.querySelector('.docs-article__body img, .article-body img, [data-docs-article] img')
          if (bodyImg) {
            imageSrc = bodyImg.getAttribute('src') || ''
          }
        }

        // 2. Extract summary
        const articleRoot = doc.querySelector('[data-docs-article], .docs-article__body, .article-body')
        let summary = ''
        if (articleRoot) {
          summary = extractListPreviewInfo(articleRoot).summary
        }
        if (!summary) {
          summary = cleanTextContent(doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '')
        }
        if (!summary) {
          const pTags = Array.from(doc.querySelectorAll('.docs-article__body p, .article-body p, [data-docs-article] p')).slice(0, 3)
          summary = cleanTextContent(pTags.map(p => p.textContent).join(' ')).slice(0, 220)
        }

        return { href, title, summary, imageSrc }
      } catch (e) {
        console.warn(`[Featured Carousel] Async fetch error for ${href}:`, e)
        return { href, title, summary: '', imageSrc: '' }
      }
    })

    slides = await Promise.all(slidePromises)
  }

  // Fallback: extract from main list items if sidebar recent posts are empty/failed
  if (slides.length === 0) {
    root.dataset.source = 'list'
    const postElements = Array.from(document.querySelectorAll('.docs-list-item[data-card-href]')).slice(0, 3)
    if (postElements.length === 0) return

    slides = postElements.map(source => {
      const href = source.getAttribute('data-card-href') || source.querySelector('.docs-list-item__main-link')?.getAttribute('href') || '#'
      const title = cleanTextContent(source.querySelector('.docs-list-item__title')?.textContent || '')
      const summary = cleanTextContent(source.querySelector('[data-list-summary]')?.textContent || '')
      const image = source.querySelector('.docs-list-item__thumb img')
      const imageSrc = image?.getAttribute('src') || ''
      return { href, title, summary, imageSrc }
    })
  }

  let currentSlide = 0

  const link = root.querySelector('.docs-home-featured__link')
  const titleNode = root.querySelector('.docs-home-featured__title')
  const summaryNode = root.querySelector('.docs-home-featured__summary')
  const imageNode = root.querySelector('.docs-home-featured__media img')
  const mediaContainer = root.querySelector('.docs-home-featured__media')

  function startAutoplay() {
    stopAutoplay()
    if (slides.length <= 1) return
    featuredAutoplayTimer = setInterval(() => {
      showSlide(currentSlide + 1)
    }, 7000) // 7 seconds comfortable cycle
  }

  function stopAutoplay() {
    if (featuredAutoplayTimer) {
      clearInterval(featuredAutoplayTimer)
      featuredAutoplayTimer = null
    }
  }

  function showSlide(index) {
    if (index < 0) index = slides.length - 1
    if (index >= slides.length) index = 0
    currentSlide = index

    const data = slides[currentSlide]
    
    // Apply soft fade transition during content swap
    root.classList.remove('is-hydrated')
    
    setTimeout(() => {
      if (link) link.setAttribute('href', data.href)
      if (titleNode) titleNode.textContent = data.title
      if (summaryNode) {
        summaryNode.textContent = data.summary
        summaryNode.hidden = !data.summary
      }
      
      // Clean up any previously generated emoji elements
      const existingEmoji = mediaContainer?.querySelector('.docs-home-featured__emoji')
      if (existingEmoji) existingEmoji.remove()

      const hasImage = data.imageSrc && !data.imageSrc.includes('[##_')
      if (imageNode && hasImage) {
        imageNode.setAttribute('src', data.imageSrc)
        imageNode.setAttribute('alt', data.title)
        imageNode.style.display = ''
        if (mediaContainer) {
          mediaContainer.classList.remove('is-empty')
          mediaContainer.classList.remove('is-generated')
          mediaContainer.style.background = ''
          mediaContainer.style.display = ''
        }
        root.classList.remove('has-no-image')
      } else {
        if (imageNode) {
          imageNode.setAttribute('src', '') // Clear stale src to fully purge previous slide's image
          imageNode.setAttribute('alt', '')
          imageNode.style.display = 'none'
        }
        if (mediaContainer) {
          mediaContainer.classList.add('is-empty')
          mediaContainer.classList.add('is-generated')
          
          // Generate stable HSL gradient placeholders from href + title.
          const { gradient, label } = generateStablePlaceholder(placeholderSeed(data.href, data.title), data.title)
          mediaContainer.style.setProperty('background', gradient, 'important')
          mediaContainer.style.display = '' // Keep visible to maintain grid bounds
          
          const labelEl = document.createElement('div')
          labelEl.className = 'docs-home-featured__emoji'
          labelEl.textContent = label
          mediaContainer.appendChild(labelEl)
        }
        root.classList.remove('has-no-image') // Keep layout proportions identical
      }

      root.classList.add('is-hydrated')
      root.classList.add('is-ready')
    }, 150)
  }

  // Initial render
  showSlide(0)
  startAutoplay()

  // Append premium slider navigation buttons under copy
  const copyContainer = root.querySelector('.docs-home-featured__copy')
  if (copyContainer && slides.length > 1) {
    let controls = copyContainer.querySelector('.featured-nav-controls')
    if (!controls) {
      controls = document.createElement('div')
      controls.className = 'featured-nav-controls'
      controls.innerHTML = `
        <button class="featured-nav-btn prev" aria-label="이전 슬라이드">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button class="featured-nav-btn next" aria-label="다음 슬라이드">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      `
      copyContainer.appendChild(controls)

      controls.querySelector('.prev').addEventListener('click', (e) => {
        e.preventDefault()
        showSlide(currentSlide - 1)
        startAutoplay() // Reset timer on manual click
      })
      controls.querySelector('.next').addEventListener('click', (e) => {
        e.preventDefault()
        showSlide(currentSlide + 1)
        startAutoplay() // Reset timer on manual click
      })
    }
  }

  root.hidden = false
}

export function estimateReadingTime(text) {
  const source = cleanTextContent(text)
  if (!source) return ''
  const hangulChunks = source.match(/[가-힣]/g)?.length || 0
  const latinWords = source.match(/[A-Za-z0-9_]+/g)?.length || 0
  const units = hangulChunks + (latinWords * 2)
  const minutes = Math.max(1, Math.ceil(units / 420))
  return `${minutes}분 읽기`
}

export function extractListPreviewInfo(articleRoot) {
  if (!articleRoot) return { summary: '' }

  const textFromNode = (node) => cleanTextContent(node?.textContent || '')
  
  // Query all heading and body content elements in strict pre-order document tree order
  // This flattens any wrapping/nested divs that Tistory's editor or layouts inject.
  const nodes = Array.from(articleRoot.querySelectorAll('h2, h3, p, ul, ol'))
  const firstH2Index = nodes.findIndex((node) => node.tagName === 'H2')

  const collected = []
  const appendText = (text) => {
    const normalized = cleanTextContent(text)
    if (!normalized) return
    collected.push(normalized)
  }

  const takeFromRange = (rangeNodes, stopAtHeading = true) => {
    for (const node of rangeNodes) {
      // If we encounter a sibling heading or blocked element, stop
      if (stopAtHeading && (node.tagName === 'H2' || node.tagName === 'H3' || node.closest('blockquote, pre, table'))) {
        break
      }
      // Skip if the node itself is nested inside a blocked tag (blockquote, pre code frame, or tables)
      if (node.closest('blockquote, pre, table')) continue
      
      appendText(textFromNode(node))
      if (cleanTextContent(collected.join(' ')).length >= 220) break
    }
  }

  // 1. Explicitly tagged preview section
  const explicitPreviewNode = articleRoot.querySelector('[data-list-preview-section], [data-preview-section]')
  if (explicitPreviewNode) {
    takeFromRange(Array.from(explicitPreviewNode.querySelectorAll('p, ul, ol')), false)
  }

  // 2. Match precise intro/introduction heading keywords
  if (collected.length === 0) {
    const previewHeadingIndex = nodes.findIndex((node) => {
      if (node.tagName !== 'H2' && node.tagName !== 'H3') return false
      const text = textFromNode(node).replace(/\[preview\]/gi, '').trim()
      const startsWithIntro = /^(?:들어가며|시작하며|소개|intro)/i.test(text)
      return startsWithIntro && text.length <= 15
    })
    if (previewHeadingIndex >= 0) {
      takeFromRange(nodes.slice(previewHeadingIndex + 1))
    }
  }

  // 3. Fallback: text before the first H2
  if (collected.length === 0 && firstH2Index > 0) {
    takeFromRange(nodes.slice(0, firstH2Index))
  }

  // 4. Fallback: text after the first H2
  if (collected.length === 0 && firstH2Index >= 0) {
    takeFromRange(nodes.slice(firstH2Index + 1))
  }

  // 5. Hard fallback: parse all nodes
  if (collected.length === 0) {
    takeFromRange(nodes)
  }

  const summary = cleanTextContent(collected.join(' ')).slice(0, 220)
  return { summary }
}

export function extractListSummaryFromArticle(articleRoot) {
  return extractListPreviewInfo(articleRoot).summary
}

export function previewFromInlineListSource(item) {
  const source = item.querySelector('[data-list-source]')
  if (!source) return { summary: '' }

  const raw = source.innerHTML || source.textContent || ''
  if (!raw || raw.includes('[##_')) return { summary: '' }

  const doc = new DOMParser().parseFromString(`<div class="article-body">${raw}</div>`, 'text/html')
  const articleRoot = doc.querySelector('.article-body')
  return extractListPreviewInfo(articleRoot)
}

export function applyListPreview(summaryNode, preview) {
  if (preview.summary) {
    summaryNode.textContent = preview.summary
    summaryNode.dataset.previewReady = 'true'
    summaryNode.hidden = false
  }
}

export function isDefaultThumbnailUrl(src) {
  if (!src || src.includes('[##_')) return true
  const normalized = src.toLowerCase()
  return normalized.includes('opengraph-default.png') ||
    normalized.includes('tistory_admin') ||
    normalized.includes('default_thumb') ||
    normalized.includes('default-thumbnail') ||
    normalized.includes('img_blank') ||
    normalized.includes('noimage') ||
    normalized.includes('no-image') ||
    normalized.includes('placeholder') ||
    normalized.includes('preview.gif') ||
    normalized.includes('preview256.jpg') ||
    normalized.includes('preview560.jpg') ||
    normalized.includes('cfile10.uf.tistory.com/image') ||
    normalized.includes('t1.daumcdn.net/tistory_admin')
}

export async function hydrateListSummaries() {
  if (!document.body.classList.contains('has-list-page')) return
  if (document.body.classList.contains('has-article-page')) return

  const items = Array.from(document.querySelectorAll('.docs-list-item[data-card-href]'))
  if (items.length === 0) return

  // Detect no-image cards and inject stable hash placeholder (gradient + emoji)
  items.forEach(item => {
    const image = item.querySelector('.docs-list-item__thumb img')
    const src = image?.getAttribute('src') || ''
    if (!image || isDefaultThumbnailUrl(src)) applyGeneratedListPlaceholder(item)
  })

  const parser = new DOMParser()
  const cachePrefix = 'docs-list-summary-v3:'

  await Promise.allSettled(items.map(async (item) => {
    const summaryNode = item.querySelector('[data-list-summary]')
    const href = item.dataset.cardHref
    if (!summaryNode || !href) return

    const nativeSummary = cleanTextContent(summaryNode.textContent || '')
    summaryNode.textContent = ''
    summaryNode.hidden = true
    delete summaryNode.dataset.previewReady

    // 1. Try to read from sessionStorage cache first
    const cacheKey = `${cachePrefix}${href}`
    const cached = window.sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = cached.trim().startsWith('{')
          ? JSON.parse(cached)
          : { summary: cached }
        if (parsed.summary) {
          applyListPreview(summaryNode, parsed)
          return
        }
      } catch (_) {
        window.sessionStorage.removeItem(cacheKey)
      }
    }

    // 2. Fetch the detail page to extract the perfect custom first-paragraph summary
    try {
      const response = await fetch(href, { credentials: 'same-origin' })
      if (!response.ok) throw new Error()
      const html = await response.text()
      const doc = parser.parseFromString(html, 'text/html')
      const articleRoot = doc.querySelector('[data-docs-article], .docs-article__body, .article-body')
      const preview = extractListPreviewInfo(articleRoot)
      if (preview.summary) {
        window.sessionStorage.setItem(cacheKey, JSON.stringify(preview))
        applyListPreview(summaryNode, preview)
        return
      }
    } catch (_) {
      // Ignore and proceed to fallback
    }

    // 3. Fallback to inline preview source if fetch fails
    const inlinePreview = previewFromInlineListSource(item)
    if (inlinePreview.summary) {
      applyListPreview(summaryNode, inlinePreview)
      return
    }

    // 4. Fallback to native Tistory auto-summary if all custom parsers failed
    if (nativeSummary && !nativeSummary.includes('[##_')) {
      summaryNode.textContent = nativeSummary
      summaryNode.dataset.previewReady = 'true'
      summaryNode.hidden = false
    }
  }))
}

export function parseRecommendedItemsFromDocument(doc, currentPathname) {
  const cards = Array.from(doc.querySelectorAll('.docs-list-item[data-card-href]'))
  return cards.map((card) => {
    const href = card.getAttribute('data-card-href') || ''
    const url = href ? new URL(href, window.location.origin) : null
    const pathname = url?.pathname || ''
    if (!pathname || pathname === currentPathname) return null

    const title = card.querySelector('.docs-list-item__title')?.textContent?.trim() || ''
    const thumb = card.querySelector('.docs-list-item__thumb img')?.getAttribute('src') || ''
    const summary = card.querySelector('[data-list-summary]')?.textContent?.trim() || ''
    if (!title) return null

    return {
      href: url.href,
      pathname,
      title,
      thumb,
      summary
    }
  }).filter(Boolean)
}

export function renderPostCardHtml(item, className) {
  const hasThumb = item.thumb && !isDefaultThumbnailUrl(item.thumb)
  const { gradient, label } = generateStablePlaceholder(placeholderSeed(item.href, item.title), item.title)
  const thumbHtml = hasThumb
    ? `<span class="${className}__thumb"><img src="${item.thumb}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async"></span>`
    : `<span class="${className}__thumb is-empty" style="background: ${gradient} !important;"><span class="${className}__placeholder">${escapeHtml(label)}</span></span>`

  return `
    <a class="${className}__item" href="${item.href}">
      ${thumbHtml}
      <span class="${className}__body">
        <strong>${escapeHtml(item.title)}</strong>
        ${item.summary ? `<span>${escapeHtml(item.summary)}</span>` : ''}
      </span>
    </a>
  `
}

export function recommendationContext() {
  const tagLinks = Array.from(document.querySelectorAll('.docs-tags__items a'))
    .map((link) => {
      const href = link.getAttribute('href') || ''
      const label = cleanTextContent(link.textContent || '').replace(/^#/, '')
      if (!href || !label) return null
      return { href, label }
    })
    .filter(Boolean)

  const categoryLink = document.querySelector('.docs-article__category')
  const categoryHref = categoryLink?.getAttribute('href') || ''
  const categoryLabel = cleanTextContent(categoryLink?.textContent || '')

  return {
    tagLinks,
    categoryHref,
    categoryLabel
  }
}

export async function fillRecommendationSummaries(items, parser) {
  if (items.length === 0) return

  const cachePrefix = 'docs-list-summary-v3:'

  await Promise.allSettled(items.map(async (item) => {
    // 1. Try sessionStorage cache first
    const cacheKey = `${cachePrefix}${item.href}`
    const cached = window.sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed.summary) {
          item.summary = parsed.summary
        }
        if (parsed.thumb) {
          item.thumb = parsed.thumb
        }
        return
      } catch (_) {
        window.sessionStorage.removeItem(cacheKey)
      }
    }

    // 2. Fetch the detail page to extract the premium custom summary and thumbnail
    try {
      const response = await fetch(item.href, { credentials: 'same-origin' })
      if (!response.ok) return
      const html = await response.text()
      const doc = parser.parseFromString(html, 'text/html')
      
      const articleRoot = doc.querySelector('[data-docs-article], .docs-article__body, .article-body')
      const summary = extractListSummaryFromArticle(articleRoot)
      
      let thumb = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''
      if (thumb && (thumb.includes('tistory.com/static') || thumb.includes('img_blank'))) {
        thumb = ''
      }
      if (!thumb && articleRoot) {
        const firstImg = articleRoot.querySelector('img')
        if (firstImg) {
          thumb = firstImg.getAttribute('src') || ''
        }
      }

      const cacheObj = {}
      if (summary) {
        item.summary = summary
        cacheObj.summary = summary
      }
      if (thumb) {
        item.thumb = thumb
        cacheObj.thumb = thumb
      }

      if (summary || thumb) {
        window.sessionStorage.setItem(cacheKey, JSON.stringify(cacheObj))
      }
    } catch (_) {
      // Ignore recommendation summary hydration failures.
    }
  }))
}

export function renderArticleRecommendations(items, options = {}) {
  const root = document.querySelector('[data-article-recommend]')
  const list = root?.querySelector('.docs-article-recommend__list')
  const more = root?.querySelector('.docs-article-recommend__more')
  const title = root?.querySelector('.docs-article-recommend__title')
  if (!root || !list || !more || !title || items.length === 0) return

  list.innerHTML = items.map((item) => renderPostCardHtml(item, 'docs-article-recommend')).join('')

  title.textContent = options.title || '최신글 더보기'
  more.setAttribute('href', options.moreHref || '/')

  root.hidden = false
}

export async function hydrateArticleRecommendations() {
  const root = document.querySelector('[data-article-recommend]')
  const article = document.querySelector('.docs-article')
  if (!root || !article) return

  const { tagLinks, categoryHref, categoryLabel } = recommendationContext()
  const currentPathname = window.location.pathname
  const parser = new DOMParser()
  const seen = new Set([currentPathname])
  const items = []
  let moreHref = '/'
  let sectionTitle = '포스트 더보기'

  const collectFrom = async (href) => {
    if (!href) return
    try {
      const response = await fetch(href, { credentials: 'same-origin' })
      if (!response.ok) return
      const html = await response.text()
      const doc = parser.parseFromString(html, 'text/html')
      const parsed = parseRecommendedItemsFromDocument(doc, currentPathname)
      for (const item of parsed) {
        if (seen.has(item.pathname)) continue
        seen.add(item.pathname)
        items.push(item)
        if (items.length >= 3) break
      }
    } catch (_) {
      // Ignore recommendation fetch failures.
    }
  }

  for (const [index, tagLink] of tagLinks.entries()) {
    await collectFrom(tagLink.href)
    if (items.length > 0 && moreHref === '/') {
      moreHref = tagLink.href
      sectionTitle = '포스트 더보기'
    }
    if (items.length >= 3) break
    if (index >= 2) break
  }

  if (items.length < 3) {
    await collectFrom(categoryHref)
    if (items.length > 0 && moreHref === '/' && categoryHref) {
      moreHref = categoryHref
      sectionTitle = '포스트 더보기'
    }
  }

  if (items.length < 3) {
    await collectFrom('/')
    if (items.length > 0 && moreHref === '/') {
      moreHref = '/'
      sectionTitle = '포스트 더보기'
    }
  }

  const selectedItems = items.slice(0, 3)
  await fillRecommendationSummaries(selectedItems, parser)
  renderArticleRecommendations(selectedItems, {
    moreHref,
    title: sectionTitle
  })
}

export function setupThumbnailFallbacks() {
  const thumbs = document.querySelectorAll('.docs-list-item__thumb')
  thumbs.forEach(thumb => {
    const img = thumb.querySelector('img')
    if (!img) {
      const item = thumb.closest('.docs-list-item')
      if (item) applyGeneratedListPlaceholder(item)
      return
    }

    const applyRatioClass = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      if (!width || !height) return

      thumb.classList.remove('is-thumb-wide', 'is-thumb-standard', 'is-thumb-tall')
      const ratio = width / height
      if (ratio >= 1.65) {
        thumb.classList.add('is-thumb-wide')
      } else if (ratio <= 0.92) {
        thumb.classList.add('is-thumb-tall')
      } else {
        thumb.classList.add('is-thumb-standard')
      }
    }

    const handleFallback = () => {
      const item = thumb.closest('.docs-list-item')
      img.remove()
      if (item) applyGeneratedListPlaceholder(item)
    }

    const src = img.getAttribute('src') || ''

    // 1. 치환자가 제대로 치환되지 않은 상태인 경우
    if (isDefaultThumbnailUrl(src)) {
      handleFallback()
      return
    }

    // 2. 이미 로드가 완료되었고 깨진 이미지인 경우 (naturalWidth가 0인 경우)
    if (img.complete && img.naturalWidth === 0) {
      handleFallback()
      return
    }

    if (img.complete) {
      applyRatioClass()
    }

    // 3. 디폴트 썸네일 경로가 포함된 경우
    // 3. 로딩 중 실패하거나 완료 시점에 크기가 0인 경우 대응
    img.addEventListener('load', () => {
      if (img.naturalWidth === 0) {
        handleFallback()
        return
      }
      applyRatioClass()
    })
    img.addEventListener('error', handleFallback)
  })
}

export function hydrateArticleRecommendationsFromSidebar() {
  const root = document.querySelector('[data-article-recommend-sidebar]')
  const list = root?.querySelector('.docs-article-recommend__list')
  if (!root || !list) return

  const recentLinks = Array.from(document.querySelectorAll('.docs-nav__list--recent a'))
  if (recentLinks.length === 0) return

  const currentPathname = window.location.pathname.replace(/\/+$/, '') || '/'
  const items = []

  for (const link of recentLinks) {
    const href = link.getAttribute('href') || ''
    if (!href) continue

    let url
    try {
      url = new URL(href, window.location.origin)
    } catch (_) {
      continue
    }

    const pathname = url.pathname.replace(/\/+$/, '') || '/'
    if (pathname === currentPathname) continue

    const title = cleanTextContent(link.textContent || '')
    if (!title) continue

    items.push({
      href: url.href,
      title,
      thumb: '',
      hasNoImage: false
    })

    if (items.length >= 3) break
  }

  if (items.length === 0) return

  const cachePrefix = 'docs-list-summary-v3:'
  const pendingItems = []
  let hasHydrated = false

  // 1. 캐시 사전 검사 및 세팅
  items.forEach(item => {
    const cached = window.sessionStorage.getItem(`${cachePrefix}${item.href}`)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed.thumb && !isDefaultThumbnailUrl(parsed.thumb)) {
          item.thumb = parsed.thumb
        } else if (parsed.hasNoImage) {
          item.hasNoImage = true
        }
      } catch (_) {
        window.sessionStorage.removeItem(`${cachePrefix}${item.href}`)
      }
    }
    if (!item.thumb && !item.hasNoImage) {
      pendingItems.push(item)
    }
  })

  // 캐시가 완전히 잡혀있다면 채집 완료 상태로 즉시 개시
  if (pendingItems.length === 0) {
    hasHydrated = true
  }

  // 2. 렌더러 함수 정의 (썸네일 유무에 따라 진짜 이미지 vs 그라데이션 분기)
  const renderList = () => {
    list.innerHTML = items.map((item) => {
      const hasThumb = item.thumb && !isDefaultThumbnailUrl(item.thumb)
      const { gradient, label } = generateStablePlaceholder(placeholderSeed(item.href, item.title), item.title)
      
      let thumbHtml = ''
      if (hasThumb) {
        // 원래 대표 이미지가 존재하는 글 -> 진짜 이미지 카드 출력
        thumbHtml = `<span class="docs-article-recommend__thumb"><img src="${item.thumb}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async"></span>`
      } else if (hasHydrated || item.hasNoImage) {
        // 이미지가 실제로 존재하지 않는다고 확인된 글 -> Toss Tech HSL 그라데이션 기본 이미지 노출
        thumbHtml = `<span class="docs-article-recommend__thumb is-empty" style="background: ${gradient} !important;"><span class="docs-article-recommend__placeholder">${escapeHtml(label)}</span></span>`
      } else {
        // 로딩 채집이 진행 중인 대기 상태 글 -> 단정한 회색 스켈레톤 카드 뼈대 노출 (튀는 색상 배제)
        thumbHtml = `<span class="docs-article-recommend__thumb is-loading-skeleton" style="background: var(--bg-soft) !important;"></span>`
      }

      return `
        <a class="docs-article-recommend__item" href="${item.href}">
          ${thumbHtml}
          <span class="docs-article-recommend__body">
            <strong>${escapeHtml(item.title)}</strong>
          </span>
        </a>
      `
    }).join('')
  }

  // 3. Phase 1: 즉각 렌더링 (CLS 방지 및 100% 댓글 안전 로딩)
  renderList()
  root.hidden = false

  // 4. Phase 2: 리액트 댓글창 초기 마운트가 완전히 완료된 3.2초 뒤 백그라운드 채집 가동
  if (pendingItems.length > 0) {
    setTimeout(async () => {
      const parser = new DOMParser()
      
      await Promise.allSettled(pendingItems.map(async (item) => {
        try {
          const response = await fetch(item.href, { credentials: 'same-origin' })
          if (!response.ok) return
          const html = await response.text()
          const doc = parser.parseFromString(html, 'text/html')
          
          let thumb = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''
          if (thumb && (thumb.includes('tistory.com/static') || thumb.includes('img_blank'))) {
            thumb = ''
          }
          if (!thumb) {
            const bodyImg = doc.querySelector('[data-docs-article] img, .docs-article__body img, .article-body img')
            if (bodyImg) {
              thumb = bodyImg.getAttribute('src') || ''
            }
          }

          const existing = window.sessionStorage.getItem(`${cachePrefix}${item.href}`)
          let cacheObj = {}
          if (existing) {
            try { cacheObj = JSON.parse(existing) } catch (_) {}
          }

          if (thumb && !isDefaultThumbnailUrl(thumb)) {
            item.thumb = thumb
            cacheObj.thumb = thumb
            cacheObj.hasNoImage = false
          } else {
            item.hasNoImage = true
            cacheObj.thumb = ''
            cacheObj.hasNoImage = true
          }
          
          window.sessionStorage.setItem(`${cachePrefix}${item.href}`, JSON.stringify(cacheObj))
        } catch (_) {
          // 채집 실패 시 그라데이션 카드 보류
        }
      }))

      // 모든 채집 성공/실패 여부를 확정하고 수분 공급 렌더링 가동
      hasHydrated = true
      renderList()
    }, 3200)
  }
}

export function hydrateNativeRecommendations() {
  const list = document.querySelector('[data-article-recommend-native] .docs-article-recommend__list')
  if (!list) return

  const items = Array.from(list.querySelectorAll('.docs-article-recommend__item'))
  items.forEach(item => {
    const titleEl = item.querySelector('strong')
    const title = titleEl ? titleEl.textContent.trim() : ''
    const href = item.getAttribute('href') || ''
    
    // 로컬 데이터 기반 HSL 그라데이션 및 라벨 해시 생성 (네트워크 fetch 없음)
    const { gradient, label } = generateStablePlaceholder(placeholderSeed(href, title), title)
    
    // CSS 변수 주입
    item.style.setProperty('--recommend-gradient', gradient)
    item.style.setProperty('--recommend-label', `"${label}"`)
  })
}
