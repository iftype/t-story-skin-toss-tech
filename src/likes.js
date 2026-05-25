export function setupFloatingLikeButton() {
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

export function arrangeLikeButton() {
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
