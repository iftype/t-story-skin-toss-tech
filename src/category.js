import { cleanTextContent, escapeHtml } from './utils.js'

export function categoryName(link) {
  return link.textContent.replace(/\(\d+\)/g, '').trim()
}

export function categoryCount(link) {
  const badge = link.querySelector('.c_cnt')
  const source = badge?.textContent || link.textContent
  const match = source.match(/\((\d+)\)/)
  return match?.[1] || ''
}

export function setupCategoryTree() {
  const tree = document.querySelector('.category-tree')
  if (!tree) return

  // Parse Tistory's original DOM before we replace it
  let rootUl = tree.querySelector('ul')
  if (!rootUl) return

  // Helpers to check current page path & descendant active states
  const parseLevel = (ulElement) => {
    const items = []
    const lis = Array.from(ulElement.children).filter(child => child.tagName && child.tagName.toUpperCase() === 'LI')

    for (const li of lis) {
      const link = Array.from(li.children).find(child => child.tagName && child.tagName.toUpperCase() === 'A')
      if (!link) continue

      const childUl = Array.from(li.children).find(child => child.tagName && child.tagName.toUpperCase() === 'UL')
      const href = link.getAttribute('href') || '/category'
      const name = categoryName(link)
      const count = categoryCount(link)
      
      const isCurrent = link.matches('a.tt_category_current, .selected, .is-current') || li.classList.contains('on')
      const children = childUl ? parseLevel(childUl) : []

      items.push({
        name,
        count,
        href,
        isCurrent,
        children
      })
    }
    return items
  }

  // Smart resolution: If the root list has exactly one child LI, and that LI contains a nested UL,
  // that nested UL is the actual categories list (bypassing the "All posts" root wrapper).
  let targetUl = rootUl
  const directLis = Array.from(rootUl.children).filter(child => child.tagName && child.tagName.toUpperCase() === 'LI')
  if (directLis.length === 1) {
    const nestedUl = directLis[0].querySelector('ul')
    if (nestedUl) {
      targetUl = nestedUl
    }
  }

  let categoryData = parseLevel(targetUl)

  // Fallback: If bypassing resulted in an empty list, fall back to parsing the outermost list directly
  if (categoryData.length === 0 && targetUl !== rootUl) {
    categoryData = parseLevel(rootUl)
  }

  const hasCurrentDescendant = (node) => {
    if (node.isCurrent) return true
    if (node.children && node.children.length > 0) {
      return node.children.some(child => hasCurrentDescendant(child))
    }
    return false
  }

  const isFolderOpen = (href, hasActiveChild) => {
    if (hasActiveChild) return true
    const saved = localStorage.getItem(`vs-tree-folder:${href}`)
    if (saved !== null) {
      return saved === 'true'
    }
    return false // Default collapsed for other folders
  }

  // Render nodes recursively into custom BEM divs
  const renderNode = (node, level = 0) => {
    const isFolder = node.children && node.children.length > 0
    const hasActive = hasCurrentDescendant(node)
    const isOpen = isFolder ? isFolderOpen(node.href, hasActive) : false

    let chevronHtml = ''
    if (isFolder) {
      chevronHtml = `
        <button class="vs-tree-chevron" aria-label="Toggle Folder" data-href="${node.href}">
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `
    } else {
      chevronHtml = `<span class="vs-tree-chevron-spacer"></span>`
    }

    let iconHtml = ''
    if (isFolder) {
      iconHtml = `
        <svg class="vs-tree-icon folder-icon folder-closed" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1.5 2.5a1 1 0 0 1 1-1h4l1.5 1.5h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11.5z" />
        </svg>
        <svg class="vs-tree-icon folder-icon folder-open" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1.5 4.5v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6l-1.5-1.5h-3.5a1 1 0 0 0-1 1z" />
        </svg>
      `
    } else {
      iconHtml = `
        <svg class="vs-tree-icon file-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 1.5h7.5L14 5v9.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />
          <path d="M10 1.5V5h3.5" />
        </svg>
      `
    }

    const rowClasses = ['vs-tree-row']
    if (node.isCurrent) rowClasses.push('is-active')

    const itemClasses = ['vs-tree-item']
    if (isFolder) {
      itemClasses.push('is-folder')
      if (isOpen) itemClasses.push('is-open')
    } else {
      itemClasses.push('is-file')
    }

    const childHtml = isFolder
      ? `<div class="vs-tree-sub-list">${node.children.map(child => renderNode(child, level + 1)).join('')}</div>`
      : ''

    return `
      <div class="${itemClasses.join(' ')}" data-href="${node.href}">
        <div class="${rowClasses.join(' ')}">
          ${chevronHtml}
          <a href="${node.href}" class="vs-tree-link">
            ${iconHtml}
            <span class="vs-tree-name">${escapeHtml(node.name)}</span>
          </a>
          ${node.count ? `<span class="vs-tree-count">${node.count}</span>` : ''}
        </div>
        ${childHtml}
      </div>
    `
  }

  // Replace tree outer html structure with our beautiful explorer markup
  const newTreeHtml = `
    <div class="vs-tree">
      ${categoryData.map(node => renderNode(node)).join('')}
    </div>
  `
  
  // Set inner HTML
  tree.innerHTML = newTreeHtml

  // Bind interactive click handlers with delegation
  tree.addEventListener('click', (e) => {
    const chevron = e.target.closest('.vs-tree-chevron')
    if (chevron) {
      e.preventDefault()
      e.stopPropagation()
      const item = chevron.closest('.vs-tree-item')
      if (item) {
        const href = item.getAttribute('data-href')
        const isOpen = item.classList.toggle('is-open')
        localStorage.setItem('vs-tree-folder:' + href, isOpen ? 'true' : 'false')
      }
      return
    }

    // Double-click or clicking empty space in folder row toggles too
    const row = e.target.closest('.vs-tree-row')
    if (row) {
      const link = e.target.closest('a')
      if (!link) {
        const item = row.closest('.vs-tree-item')
        if (item && item.classList.contains('is-folder')) {
          e.preventDefault()
          const href = item.getAttribute('data-href')
          const isOpen = item.classList.toggle('is-open')
          localStorage.setItem('vs-tree-folder:' + href, isOpen ? 'true' : 'false')
        }
      }
    }
  })
}

export function renderCategoryMap() {
  const map = document.querySelector('[data-category-map]')
  const tree = document.querySelector('.category-tree')
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'
  if (!map || !tree || normalizedPath !== '/category') return

  const title = document.querySelector('.docs-page-head__title')
  const meta = document.querySelector('.docs-page-head__meta')
  const allCount = tree.querySelector('.link_tit .c_cnt')?.textContent?.match(/\((\d+)\)/)?.[1]

  if (title) title.textContent = '전체보기'
  if (meta && allCount) meta.textContent = `글 ${allCount}개`

  // Helper parsing logic (must be before we replace .category-tree)
  let rootUl = tree.querySelector('ul')
  if (!rootUl) return

  const parseLevel = (ulElement) => {
    const items = []
    const lis = Array.from(ulElement.children).filter(child => child.tagName && child.tagName.toUpperCase() === 'LI')

    for (const li of lis) {
      const link = Array.from(li.children).find(child => child.tagName && child.tagName.toUpperCase() === 'A')
      if (!link) continue

      const childUl = Array.from(li.children).find(child => child.tagName && child.tagName.toUpperCase() === 'UL')
      const href = link.getAttribute('href') || '/category'
      const name = categoryName(link)
      const count = categoryCount(link)
      
      const isCurrent = link.matches('a.tt_category_current, .selected, .is-current') || li.classList.contains('on')
      const children = childUl ? parseLevel(childUl) : []

      items.push({
        name,
        count,
        href,
        isCurrent,
        children
      })
    }
    return items
  }

  // Bypass root wrapper if it has exactly one child
  let targetUl = rootUl
  const directLis = Array.from(rootUl.children).filter(child => child.tagName && child.tagName.toUpperCase() === 'LI')
  if (directLis.length === 1) {
    const nestedUl = directLis[0].querySelector('ul')
    if (nestedUl) {
      targetUl = nestedUl
    }
  }

  let categoryData = parseLevel(targetUl)
  if (categoryData.length === 0 && targetUl !== rootUl) {
    categoryData = parseLevel(rootUl)
  }

  const hasCurrentDescendant = (node) => {
    if (node.isCurrent) return true
    if (node.children && node.children.length > 0) {
      return node.children.some(child => hasCurrentDescendant(child))
    }
    return false
  }

  const isFolderOpen = (href, hasActiveChild) => {
    if (hasActiveChild) return true
    const saved = localStorage.getItem(`vs-tree-folder:${href}`)
    if (saved !== null) {
      return saved === 'true'
    }
    return true // Default open for Category Map explorer
  }

  // Render nodes recursively into custom BEM divs
  const renderNode = (node, level = 0) => {
    const isFolder = node.children && node.children.length > 0
    const hasActive = hasCurrentDescendant(node)
    const isOpen = isFolder ? isFolderOpen(node.href, hasActive) : false

    let chevronHtml = ''
    if (isFolder) {
      chevronHtml = `
        <button class="vs-tree-chevron" aria-label="Toggle Folder" data-href="${node.href}">
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `
    } else {
      chevronHtml = `<span class="vs-tree-chevron-spacer"></span>`
    }

    let iconHtml = ''
    if (isFolder) {
      iconHtml = `
        <svg class="vs-tree-icon folder-icon folder-closed" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1.5 2.5a1 1 0 0 1 1-1h4l1.5 1.5h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11.5z" />
        </svg>
        <svg class="vs-tree-icon folder-icon folder-open" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M1.5 4.5v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6l-1.5-1.5h-3.5a1 1 0 0 0-1 1z" />
        </svg>
      `
    } else {
      iconHtml = `
        <svg class="vs-tree-icon file-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 1.5h7.5L14 5v9.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z" />
          <path d="M10 1.5V5h3.5" />
        </svg>
      `
    }

    const rowClasses = ['vs-tree-row']
    if (node.isCurrent) rowClasses.push('is-active')

    const itemClasses = ['vs-tree-item']
    if (isFolder) {
      itemClasses.push('is-folder')
      if (isOpen) itemClasses.push('is-open')
    } else {
      itemClasses.push('is-file')
    }

    const childHtml = isFolder
      ? `<div class="vs-tree-sub-list">${node.children.map(child => renderNode(child, level + 1)).join('')}</div>`
      : ''

    return `
      <div class="${itemClasses.join(' ')}" data-href="${node.href}">
        <div class="${rowClasses.join(' ')}">
          ${chevronHtml}
          <a href="${node.href}" class="vs-tree-link">
            ${iconHtml}
            <span class="vs-tree-name">${escapeHtml(node.name)}</span>
          </a>
          ${node.count ? `<span class="vs-tree-count">${node.count}</span>` : ''}
        </div>
        ${childHtml}
      </div>
    `
  }

  const overviewHtml = `
    <div class="vs-tree vs-tree--large">
      ${categoryData.map(node => renderNode(node)).join('')}
    </div>
  `

  map.innerHTML = `
    <div class="docs-category-map__eyebrow">Category</div>
    <div class="docs-category-map__trail">
      <a href="/">전체보기</a>
    </div>
    <div class="docs-category-map__explorer">
      ${overviewHtml}
    </div>
  `
  map.hidden = false

  // Bind interactive click handlers with delegation for Category Map
  map.addEventListener('click', (e) => {
    const chevron = e.target.closest('.vs-tree-chevron')
    if (chevron) {
      e.preventDefault()
      e.stopPropagation()
      const item = chevron.closest('.vs-tree-item')
      if (item) {
        const href = item.getAttribute('data-href')
        const isOpen = item.classList.toggle('is-open')
        localStorage.setItem('vs-tree-folder:' + href, isOpen ? 'true' : 'false')
      }
      return
    }

    const row = e.target.closest('.vs-tree-row')
    if (row) {
      const link = e.target.closest('a')
      if (!link) {
        // Clicking row toggles folder if it is a folder
        const item = row.closest('.vs-tree-item')
        if (item && item.classList.contains('is-folder')) {
          e.preventDefault()
          const href = item.getAttribute('data-href')
          const isOpen = item.classList.toggle('is-open')
          localStorage.setItem('vs-tree-folder:' + href, isOpen ? 'true' : 'false')
        }
      }
    }
  })
}
