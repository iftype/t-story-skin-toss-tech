import { cleanTextContent } from './utils.js'
import { toggleTheme } from './theme.js'

export function buildWriteUrl() {
  const blogLink = document.querySelector('.docs-brand__title')?.getAttribute('href') || '/'
  const normalized = blogLink.endsWith('/') ? blogLink : `${blogLink}/`
  return `${normalized}manage/newpost/?type=post&returnURL=%2Fmanage%2Fposts%2F`
}

export function decorateWriteLinks() {
  document.querySelectorAll('.docs-toplink--write').forEach((link) => {
    link.setAttribute('href', buildWriteUrl())
  })
}

export function showAdminElements() {
  const checkAdmin = () => {
    if ((window.T && window.T.config && window.T.config.ROLE === 'owner') || document.querySelector('#tistory-admin-bar')) {
      document.body.classList.add('is-admin')
      localStorage.setItem('docs-is-admin', 'true')
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
    
    // Clear interval and clean up cache if still not admin after 5 seconds (means user logged out)
    setTimeout(() => {
      clearInterval(interval)
      if (!document.body.classList.contains('is-admin')) {
        localStorage.removeItem('docs-is-admin')
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none')
      }
    }, 5000)
  }
}

export function normalizeProfileAvatars() {
  const blogTitle = cleanTextContent(document.querySelector('.docs-topbar__brand')?.textContent) || 'Blog'
  const fallbackText = blogTitle.slice(0, 1).toUpperCase()

  document.querySelectorAll('.docs-profile-avatar').forEach((avatar) => {
    const image = avatar.querySelector('.docs-profile-avatar__image')
    const fallback = avatar.querySelector('.docs-profile-avatar__fallback')

    if (fallback) fallback.textContent = fallbackText
    if (!image) return

    const src = image.getAttribute('src') || ''
    const shouldHideImage = !src || src.includes('[##_') || src === 'null' || src === 'undefined'

    if (shouldHideImage) {
      image.hidden = true
      avatar.classList.add('is-fallback')
      return
    }

    image.addEventListener('error', () => {
      image.hidden = true
      avatar.classList.add('is-fallback')
    }, { once: true })
  })
}

export function toggleSidebar() {
  document.body.classList.toggle('nav-open')
  document.querySelectorAll('[data-action="toggle-nav"]').forEach((button) => {
    button.setAttribute('aria-expanded', document.body.classList.contains('nav-open') ? 'true' : 'false')
  })
}

export function bindGlobalActions() {
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

export function normalizeFooterGithubLink() {
  const githubLink = document.querySelector('.docs-footer__github')
  if (githubLink) {
    const href = githubLink.getAttribute('href')
    if (!href || href.trim() === '' || href.includes('[##_var_')) {
      githubLink.setAttribute('href', 'https://github.com')
    }
  }
}
