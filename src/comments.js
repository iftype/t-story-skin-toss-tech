import { marked } from 'marked'

// CDN Prism이 로드되지 않았을 경우 대비 폴백을 제공하는 동적 게터
function getPrism() {
  return window.Prism || { highlightElement: () => {}, languages: {} }
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
    prismLang = map[normalized]
  } else if (getPrism().languages[normalized]) {
    prismLang = normalized
  } else if (/^[a-z0-9-]+$/.test(normalized)) {
    prismLang = normalized
  } else {
    prismLang = null
  }

  return {
    display: raw || 'text',
    prism: prismLang
  }
}

// 디바운스 헬퍼
function debounce(func, wait) {
  let timeout
  return function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export function syncCommentComposerAvatar() {
  const sync = () => {
    try {
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
    } catch (e) {
      console.warn('[Comments Engine] syncCommentComposerAvatar execution failed', e)
      return false
    }
  }

  if (sync()) return

  const root = document.querySelector('.docs-comments [data-tistory-react-app="Comment"]') || document.querySelector('.docs-comments')
  if (!root || !('MutationObserver' in window)) return

  let timer = null
  const observer = new MutationObserver(() => {
    observer.disconnect()
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        if (sync()) return
      } catch (e) {
        // Safe fail silent
      } finally {
        try {
          observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'src'] })
        } catch (e) {
          // ignore
        }
      }
    }, 100)
  })
  
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'src'] })
  setTimeout(() => observer.disconnect(), 10000)
}

export function normalizeLegacyComments() {
  const getProfileBackground = (root) => {
    try {
      const candidates = [
        root.closest('.docs-comments')?.querySelector('[data-tistory-react-app="Namecard"] .tt_thumb_g'),
        document.querySelector('[data-tistory-react-app="Namecard"] .tt_thumb_g'),
        document.querySelector('.tt-thumbnail')
      ].filter(Boolean)

      for (const el of candidates) {
        const bg = getComputedStyle(el).backgroundImage
        if (bg && bg !== 'none') return bg
      }
    } catch (e) {
      // safe fallback
    }
    return ''
  }

  const ensureThumb = (target, bg) => {
    if (!target) return
    try {
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

      // React Virtual DOM 트리 붕괴 위험을 원천 차단하기 위해, form 직계 혹은 댓글 직계에 insertBefore 하는 동작을 극도로 보호함.
      // 비로그인 폼 등 thumb이 없을 때에만 방어적으로 생성합니다.
      const thumb = document.createElement('div')
      thumb.className = 'tt-box-thumb tt-box-thumb--generated'
      thumb.innerHTML = '<span class="tt-thumbnail"></span>'
      const ttThumb = thumb.querySelector('.tt-thumbnail')
      if (bg && bg !== 'none') {
        ttThumb.style.backgroundImage = bg
        ttThumb.dataset.thumbSynced = 'true'
      }
      target.insertBefore(thumb, target.firstChild)
    } catch (e) {
      console.warn('[Comments Engine] ensureThumb insert failed. Bypassing to protect React tree.', e)
    }
  }

  const sync = () => {
    try {
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
    } catch (e) {
      return false
    }
  }

  sync()

  const root = document.querySelector('.docs-comments')
  if (!root || !('MutationObserver' in window)) return

  let timer = null
  const observer = new MutationObserver(() => {
    observer.disconnect()
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        sync()
      } catch (e) {
        // ignore
      } finally {
        try {
          observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
        } catch (e) {
          // ignore
        }
      }
    }, 100)
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
    try {
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
    } catch (e) {
      // safe bypass
    }
  }

  root.addEventListener('click', (event) => {
    try {
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
    } catch (e) {
      // ignore
    }
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
    let timer = null
    const observer = new MutationObserver(() => {
      observer.disconnect()
      clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          refresh()
        } catch (e) {
          // ignore
        } finally {
          try {
            observer.observe(root, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['style', 'aria-expanded']
            })
          } catch (e) {
            // ignore
          }
        }
      }, 100)
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

export function setupCommentAvatarLogin() {
  const attach = () => {
    try {
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
    } catch (e) {
      // safe bypass
    }
  }

  attach()

  const root = document.querySelector('.docs-comments')
  if (!root || !('MutationObserver' in window)) return

  let timer = null
  const observer = new MutationObserver(() => {
    observer.disconnect()
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        attach()
      } catch (e) {
        // ignore
      } finally {
        try {
          observer.observe(root, { childList: true, subtree: true })
        } catch (e) {
          // ignore
        }
      }
    }, 150)
  })
  observer.observe(root, { childList: true, subtree: true })
  setTimeout(() => observer.disconnect(), 10000)
}

export function setupCommentReplyClick() {
  const attach = () => {
    try {
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
    } catch (e) {
      // safe bypass
    }
  }

  attach()

  const root = document.querySelector('.docs-comments')
  if (!root || !('MutationObserver' in window)) return

  let timer = null
  const observer = new MutationObserver(() => {
    observer.disconnect()
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        attach()
      } catch (e) {
        // ignore
      } finally {
        try {
          observer.observe(root, { childList: true, subtree: true })
        } catch (e) {
          // ignore
        }
      }
    }, 150)
  })
  observer.observe(root, { childList: true, subtree: true })
  setTimeout(() => observer.disconnect(), 10000)
}

export function renderCommentMarkdown() {
  try {
    const root = document.querySelector('.docs-comments')
    if (!root) return
    const allComments = Array.from(document.querySelectorAll('.tt_desc, .tt-wrap-desc'))
    const comments = allComments.filter(el => {
      // Keep only the outermost comment elements to prevent double parsing/rendering in nested trees
      return !allComments.some(ancestor => ancestor !== el && ancestor.contains(el))
    })
    
    let renderedCount = 0

    comments.forEach(comment => {
      try {
        let html = comment.innerHTML
        if (!html) return

        // 1. 대댓글 멘션(답글 태그) 추출 및 격리
        // 티스토리 대댓글의 멘션 태그 em.tt-txt-mention 또는 앵커 형태를 무손실로 안전하게 분리합니다.
        let mentionHtml = ''
        const mentionRegex = /^(\s*<em[^>]*class="[^"]*tt[_-]txt[_-]mention[^"]*"[^>]*>.*?<\/em>|\s*<a[^>]*class="[^"]*tt[_-]txt[_-]mention[^"]*"[^>]*>.*?<\/a>)\s*/i
        const match = html.match(mentionRegex)
        if (match) {
          mentionHtml = match[1]
          html = html.substring(match[0].length) // 멘션 영역 제외한 실 유저 텍스트
        }

        // Tistory auto-prepends the reply mention tag, which we already separated.
        // We replace br tags with real newlines for precise markdown block parsing.
        let textWithNewlines = html.replace(/<br\s*\/?>/gi, '\n')
        
        const temp = document.createElement('div')
        temp.innerHTML = textWithNewlines
        
        // Safety check: remove any nested docs-comment-markdown elements from previous runs
        temp.querySelectorAll('.docs-comment-markdown').forEach(el => el.remove())
        
        const rawText = temp.textContent || temp.innerText || ""
        
        // Find sibling first to ensure it actually exists in DOM before bypassing via cache
        let mdDiv = comment.nextSibling
        while (mdDiv && (!mdDiv.classList || !mdDiv.classList.contains('docs-comment-markdown'))) {
          mdDiv = mdDiv.nextSibling
        }
        
        if (comment.dataset.lastParsedText === rawText && mdDiv && mdDiv.dataset.commentMarkdownReady === 'true') {
          renderedCount++
          return
        }
        
        // 2. 멘션이 제외된 순수 바디 영역에 대해서만 Markdown 컴파일 수행 (태그 깨짐 방지)
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

        // 3. 분리해두었던 원래의 멘션 태그를 렌더링된 첫 단락(Paragraph) 내부에 부드럽게 결합
        if (mentionHtml) {
          const firstP = div.querySelector('p')
          if (firstP) {
            firstP.innerHTML = mentionHtml + ' ' + firstP.innerHTML
          } else {
            const mentionWrapper = document.createElement('span')
            mentionWrapper.innerHTML = mentionHtml + ' '
            div.insertBefore(mentionWrapper, div.firstChild)
          }
        }
        
        if (!comment.parentNode) return
        
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
          if (resolved.prism) {
            block.classList.add(`language-${resolved.prism}`)
            getPrism().highlightElement(block)
          }
        })
        
        comment.dataset.lastParsedText = rawText
        renderedCount++
      } catch (singleErr) {
        console.warn('[Comments Engine] Failed to parse individual comment markdown. Silently bypassing.', singleErr)
      }
    })

    if (root) {
      const isReady = renderedCount > 0 || root.querySelector('.docs-comment-markdown[data-comment-markdown-ready="true"]')
      root.classList.toggle('is-comment-markdown-ready', !!isReady)
      root.dataset.commentNativeCount = String(comments.length)
      root.dataset.commentMarkdownCount = String(root.querySelectorAll('.docs-comment-markdown[data-comment-markdown-ready="true"]').length)
    }
  } catch (err) {
    console.warn('[Comments Engine] renderCommentMarkdown total routine crashed', err)
  }
}

export function setupCommentFallback() {
  try {
    document.querySelectorAll('.docs-comments-legacy').forEach((node) => node.remove())
  } catch (e) {
    // ignore
  }
}
