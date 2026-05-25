import { marked } from 'marked'
import { getHljs } from './utils.js'
import { resolveCodeLanguage } from './code.js'

export function syncCommentComposerAvatar() {
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

export function normalizeLegacyComments() {
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

export function trackOpenCommentMenus() {
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

export function renderCommentMarkdown() {
  const root = document.querySelector('.docs-comments')
  const allComments = Array.from(document.querySelectorAll('.tt_desc, .tt-wrap-desc'))
  const comments = allComments.filter(el => {
    // Keep only the outermost comment elements to prevent double parsing/rendering in nested trees
    return !allComments.some(ancestor => ancestor !== el && ancestor.contains(el))
  })
  let renderedCount = 0
  
  comments.forEach(comment => {
    try {
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
    mdDiv.dataset.commentMarkdownReady = 'true'
    
    mdDiv.querySelectorAll('pre code').forEach((block) => {
      block.className = block.className.replace(/\blanguage-[a-z0-9_-]+\b/gi, '')
      const pre = block.parentElement
      const resolved = resolveCodeLanguage(pre.getAttribute('data-ke-language') || 'html')
      if (resolved.hljs) {
        block.classList.add(`language-${resolved.hljs}`)
        block.classList.add(resolved.hljs)
        getHljs().highlightElement(block)
      }
    })
    
    comment.dataset.lastParsedText = rawText
    renderedCount += 1
    } catch (error) {
      comment.dataset.commentMarkdownError = 'true'
      if (window.console && window.console.warn) {
        window.console.warn('[docs-comments] failed to render comment markdown', error)
      }
    }
  })

  if (root) {
    root.classList.toggle('is-comment-markdown-ready', renderedCount > 0 || root.querySelector('.docs-comment-markdown[data-comment-markdown-ready="true"]'))
    root.dataset.commentNativeCount = String(comments.length)
    root.dataset.commentMarkdownCount = String(root.querySelectorAll('.docs-comment-markdown[data-comment-markdown-ready="true"]').length)
  }
}

export function setupCommentFallback() {
  document.querySelectorAll('.docs-comments-legacy').forEach((node) => node.remove())
}

export function isReactCmtLoaded() {
  const root = document.querySelector('.docs-comments')
  if (!root) return false
  return Boolean(root.querySelector('.tt-comment-cont, .tt-area-write, .tt-list-reply, .tt-item-reply'))
}

export function setupCommentReplyClick() {
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

export function setupCommentAvatarLogin() {
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
