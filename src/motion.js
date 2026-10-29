// 마이크로 인터랙션 모음: 테마 전환, 하트 버스트, 공감 수 변화 등
// 동작을 줄이도록 설정한 사용자(prefers-reduced-motion)에게는 애니메이션 없이 결과만 보여준다.

export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// 2. 공감(하트) 버튼: 누르면 작은 하트 조각이 튀고 아이콘이 통통 튄다
function burstFrom(button) {
  if (prefersReducedMotion()) return
  const rect = button.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const count = 8

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span')
    dot.className = 'like-burst-dot'
    dot.style.left = `${cx}px`
    dot.style.top = `${cy}px`
    document.body.appendChild(dot)

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4
    const distance = 22 + Math.random() * 12
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance

    dot.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy * 1.15}px)) scale(0.2)`, opacity: 0 },
      ],
      { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    ).finished.finally(() => dot.remove())
  }
}

function pop(element, className = 'is-popping') {
  if (!element || prefersReducedMotion()) return
  element.classList.remove(className)
  void element.offsetWidth
  element.classList.add(className)
  element.addEventListener('animationend', () => element.classList.remove(className), { once: true })
}

export function setupLikeMotion() {
  // 왼쪽 하트가 처음 나타날 때 한 번만 떠오르는 애니메이션 (스크롤 흔들림이 끝난 뒤 다시 돌지 않게)
  const floating = document.querySelector('.docs-like-btn--floating')
  if (floating) {
    const enter = () => {
      if (floating.dataset.entered || !floating.classList.contains('is-revealed')) return
      floating.dataset.entered = 'true'
      pop(floating, 'is-entering')
    }
    enter()
    new MutationObserver(enter).observe(floating, { attributes: true, attributeFilter: ['class'] })
  }

  document.querySelectorAll('.docs-like-btn').forEach((button) => {
    button.addEventListener('pointerdown', () => button.classList.add('is-pressed'))
    const release = () => button.classList.remove('is-pressed')
    button.addEventListener('pointerup', release)
    button.addEventListener('pointerleave', release)

    // 공감 상태가 켜지는 순간에만 버스트 (취소할 때는 조용히)
    // 페이지 로드 때 서버 상태를 동기화하며 켜지는 경우는 제외하고, 방금 누른 경우에만 터뜨린다
    let wasActive = button.getAttribute('aria-pressed') === 'true'
    let lastClickAt = 0
    button.addEventListener('click', () => { lastClickAt = Date.now() })
    new MutationObserver(() => {
      const isActive = button.getAttribute('aria-pressed') === 'true'
      if (isActive && !wasActive && Date.now() - lastClickAt < 4000) {
        burstFrom(button)
        pop(button.querySelector('svg'))
      }
      wasActive = isActive
    }).observe(button, { attributes: true, attributeFilter: ['aria-pressed'] })
  })

  // 공감 수가 바뀌면 숫자가 아래에서 올라온다
  const count = document.querySelector('.docs-like-btn--inline .like-count')
  if (count) {
    let last = count.textContent
    new MutationObserver(() => {
      if (count.textContent === last) return
      last = count.textContent
      pop(count, 'is-ticking')
    }).observe(count, { childList: true, characterData: true, subtree: true })
  }
}

// 3. 버튼을 누르는 순간의 눌림 피드백 (모바일 포함)
export function setupPressFeedback() {
  const selector = '.docs-icon-button, .featured-nav-btn, .docs-profile-actions__link, .docs-paging__button, .docs-paging__number, .code-copy'
  document.addEventListener('pointerdown', (e) => {
    const target = e.target.closest(selector)
    if (!target) return
    target.classList.add('is-pressed')
    const release = () => target.classList.remove('is-pressed')
    target.addEventListener('pointerup', release, { once: true })
    target.addEventListener('pointerleave', release, { once: true })
    target.addEventListener('pointercancel', release, { once: true })
  })
}
