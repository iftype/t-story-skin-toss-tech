import { cleanTextContent } from './utils.js'

export function setupTocActiveState() {
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

export function updateTocStickyBoundary() {
  const layout = document.querySelector('.docs-article-layout')
  const toc = document.querySelector('.docs-toc')
  const articleBody = document.querySelector('.docs-article__body, .article-body')
  if (!layout || !toc || !articleBody) return

  const layoutRect = layout.getBoundingClientRect()
  const bodyRect = articleBody.getBoundingClientRect()
  const boundary = Math.max(240, Math.round(bodyRect.bottom - layoutRect.top))
  toc.style.setProperty('--toc-sticky-boundary', `${boundary}px`)
}

export function generateTOC() {
  const article = document.querySelector('[data-docs-article]')
  const tocNav = document.getElementById('toc-content')
  const tocContainer = document.querySelector('.docs-toc')
  const layout = document.querySelector('.docs-layout')
  if (!article || !tocNav) return

  if (layout) layout.classList.add('has-article')
  if (tocContainer) tocContainer.style.display = ''

  tocNav.innerHTML = ''

  const headings = Array.from(article.querySelectorAll('h2, h3'))
    .filter((heading) => cleanTextContent(heading.textContent || '') && heading.getAttribute('id'))
  if (headings.length === 0) {
    document.body.classList.add('no-toc')
    if (tocContainer) tocContainer.style.display = 'none'
    return
  }

  document.body.classList.remove('no-toc')

  const ul = document.createElement('ul')
  headings.forEach((heading) => {
    const id = heading.getAttribute('id')
    if (!id) return

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
