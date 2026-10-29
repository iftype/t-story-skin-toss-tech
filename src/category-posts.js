// 카테고리 트리를 "카테고리 = 폴더, 글 = 파일" 구조로 바꾼다.
// 티스토리는 카테고리 안의 글 목록을 치환자로 주지 않으므로 /rss 를 한 번 읽어
// 글마다 카테고리를 알아내고, 해당 폴더 안에 파일로 넣는다.
// RSS 에 없는 글(RSS 개수 설정보다 오래된 글)은 폴더를 열 때 카테고리 페이지에서 채운다.
import { escapeHtml } from './utils.js'

const CACHE_KEY = 'docs-tree-posts-v1'

const FOLDER_ICONS = `
  <svg class="vs-tree-icon folder-icon folder-closed" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M1.5 2.5a1 1 0 0 1 1-1h4l1.5 1.5h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11.5z" />
  </svg>
  <svg class="vs-tree-icon folder-icon folder-open" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M1.5 4.5v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6l-1.5-1.5h-3.5a1 1 0 0 0-1 1z" />
  </svg>`

const CHEVRON = `
  <button class="vs-tree-chevron" aria-label="Toggle Folder">
    <svg class="chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M6 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>`

const POST_ICON = `
  <svg class="vs-tree-icon post-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M3 1.5h7.5L14 5v9.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />
    <path d="M10 1.5V5h3.5M5 8.5h6M5 11h4" stroke-linecap="round" />
  </svg>`

const normalizePath = (value) => decodeURIComponent(String(value || ''))
  .replace(/^https?:\/\/[^/]+/, '')
  .replace(/\/+$/, '') || '/'

const categoryPathOf = (href) => normalizePath(href).replace(/^\/category\/?/, '')

let postsPromise = null

function loadPosts() {
  if (postsPromise) return postsPromise
  postsPromise = (async () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) return JSON.parse(cached)
    } catch (_) {}

    try {
      const res = await fetch('/rss', { credentials: 'same-origin' })
      if (!res.ok) return []
      const xml = new DOMParser().parseFromString(await res.text(), 'application/xml')
      const posts = Array.from(xml.querySelectorAll('item')).map((item) => ({
        title: item.querySelector('title')?.textContent?.trim() || '',
        href: normalizePath(item.querySelector('link')?.textContent || ''),
        category: (item.querySelector('category')?.textContent || '').trim(),
        date: item.querySelector('pubDate')?.textContent || '',
      })).filter((post) => post.title && post.href)
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(posts)) } catch (_) {}
      return posts
    } catch (_) {
      return []
    }
  })()
  return postsPromise
}

// RSS 의 category 는 "상위/하위" 또는 이름만 올 수 있어 둘 다 맞춰본다
function postsForCategory(posts, path) {
  const name = path.split('/').pop()
  return posts.filter((post) => post.category === path || post.category === name || post.category.replace(/\s*\/\s*/g, '/') === path)
}

function postRowHtml(post) {
  const isCurrent = normalizePath(window.location.pathname) === post.href
  return `
    <div class="vs-tree-item is-file is-post" data-href="${escapeHtml(post.href)}">
      <div class="vs-tree-row${isCurrent ? ' is-active' : ''}">
        <span class="vs-tree-chevron-spacer"></span>
        <a href="${escapeHtml(post.href)}" class="vs-tree-link" title="${escapeHtml(post.title)}">
          ${POST_ICON}
          <span class="vs-tree-name">${escapeHtml(post.title)}</span>
        </a>
      </div>
    </div>`
}

// 카테고리 항목 하나를 폴더로 만든다 (하위 카테고리가 없던 항목 포함)
function ensureFolder(item, defaultOpen) {
  const row = item.querySelector(':scope > .vs-tree-row')
  if (!row) return null

  if (!item.classList.contains('is-folder')) {
    item.classList.remove('is-file')
    item.classList.add('is-folder')
    row.querySelector(':scope > .vs-tree-chevron-spacer')?.insertAdjacentHTML('afterend', CHEVRON)
    row.querySelector(':scope > .vs-tree-chevron-spacer')?.remove()
    const icon = row.querySelector('.vs-tree-link .file-icon')
    if (icon) icon.outerHTML = FOLDER_ICONS

    const saved = localStorage.getItem(`vs-tree-folder:${item.dataset.href}`)
    if (saved === 'true' || (saved === null && defaultOpen)) item.classList.add('is-open')
  }

  let sub = item.querySelector(':scope > .vs-tree-sub-list')
  if (!sub) {
    sub = document.createElement('div')
    sub.className = 'vs-tree-sub-list'
    item.appendChild(sub)
  }
  return sub
}

function openAncestors(element) {
  let folder = element.parentElement?.closest('.vs-tree-item.is-folder')
  while (folder) {
    folder.classList.add('is-open')
    folder = folder.parentElement?.closest('.vs-tree-item.is-folder')
  }
}

// RSS 에 없는 글은 폴더를 처음 열 때 카테고리 페이지 1쪽에서 보충한다
async function fillFromCategoryPage(item, path, sub) {
  if (item.dataset.postsFilled) return
  item.dataset.postsFilled = 'true'
  try {
    const res = await fetch(`/category/${path.split('/').map(encodeURIComponent).join('/')}`, { credentials: 'same-origin' })
    if (!res.ok) return
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
    const name = path.split('/').pop()
    const known = new Set(Array.from(sub.querySelectorAll(':scope > .is-post')).map((el) => el.dataset.href))
    const extra = Array.from(doc.querySelectorAll('.docs-list-item[data-card-href]'))
      .filter((card) => (card.querySelector('.docs-list-item__category')?.textContent || '').trim() === name)
      .map((card) => ({
        href: normalizePath(card.dataset.cardHref),
        title: (card.querySelector('.docs-list-item__title')?.textContent || '').trim(),
      }))
      .filter((post) => post.title && !known.has(post.href))
    if (extra.length) sub.insertAdjacentHTML('beforeend', extra.map(postRowHtml).join(''))
  } catch (_) {}
}

async function decorateTree(tree, defaultOpen) {
  if (tree.dataset.postsDecorated) return
  tree.dataset.postsDecorated = 'true'

  const posts = await loadPosts()
  const categoryItems = Array.from(tree.querySelectorAll('.vs-tree-item:not(.is-post)'))

  for (const item of categoryItems) {
    const path = categoryPathOf(item.dataset.href)
    if (!path) continue
    const sub = ensureFolder(item, defaultOpen)
    if (!sub) continue

    const own = postsForCategory(posts, path)
    if (own.length) sub.insertAdjacentHTML('beforeend', own.map(postRowHtml).join(''))

    // 티스토리 글 수보다 RSS 에서 찾은 글이 적으면, 폴더를 열 때 보충
    const count = Number(item.querySelector(':scope > .vs-tree-row .vs-tree-count')?.textContent || 0)
    const childFolders = sub.querySelectorAll(':scope > .vs-tree-item:not(.is-post)').length
    if (count > own.length && childFolders === 0) {
      if (item.classList.contains('is-open')) fillFromCategoryPage(item, path, sub)
      else item.querySelector(':scope > .vs-tree-row')?.addEventListener('click', () => fillFromCategoryPage(item, path, sub), { once: true })
    }
  }

  // 지금 보고 있는 글이 든 폴더는 펼쳐 둔다
  tree.querySelectorAll('.is-post > .vs-tree-row.is-active').forEach(openAncestors)
}

export function attachPostsToCategoryTrees() {
  // 사이드바 트리는 접힌 상태로, /category 페이지의 큰 트리는 펼친 상태로 시작
  document.querySelectorAll('.category-tree .vs-tree').forEach((tree) => decorateTree(tree, false))
  document.querySelectorAll('[data-category-map] .vs-tree').forEach((tree) => decorateTree(tree, true))
}
