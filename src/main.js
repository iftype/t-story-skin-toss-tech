import './styles.css'
import './styles/fixes.css'

import { injectCodeCSS, enhanceCodeBlocks } from './code.js'
import { getSavedTheme, applyTheme, cleanInlineStyles, preserveWordCombination } from './theme.js'
import { decorateWriteLinks, showAdminElements, normalizeProfileAvatars, bindGlobalActions, normalizeFooterGithubLink } from './header.js'
import { setupCategoryTree, renderCategoryMap } from './category.js'
import { markPageState, setupPageHeadEyebrow, showEmptyStateWhenNeeded, normalizeListMeta, normalizeListCards, hydrateHomeFeatured, hydrateListSummaries, hydrateArticleRecommendations, setupThumbnailFallbacks } from './cards.js'
import { enableArticleImageLinks, normalizeArticleMedia, normalizeMarkdownListParagraphs, assignHeadingIds, setupHeadingAnchors } from './article.js'
import { generateTOC, updateTocStickyBoundary } from './toc.js'
import { syncCommentComposerAvatar, normalizeLegacyComments, trackOpenCommentMenus, renderCommentMarkdown, setupCommentFallback, setupCommentReplyClick, setupCommentAvatarLogin } from './comments.js'
import { setupFloatingLikeButton, arrangeLikeButton } from './likes.js'

function init() {
  injectCodeCSS()
  normalizeFooterGithubLink()
  applyTheme(getSavedTheme())
  decorateWriteLinks()
  showAdminElements()
  normalizeProfileAvatars()
  setupThumbnailFallbacks()
  renderCategoryMap()
  setupCategoryTree()
  bindGlobalActions()
  enhanceCodeBlocks()
  markPageState()
  setupPageHeadEyebrow()
  normalizeArticleMedia()
  enableArticleImageLinks()
  normalizeMarkdownListParagraphs()
  showEmptyStateWhenNeeded()
  normalizeListMeta()
  normalizeListCards()
  hydrateHomeFeatured()
  hydrateListSummaries()
    .then(() => hydrateHomeFeatured())
  hydrateArticleRecommendations()
  assignHeadingIds()
  generateTOC()
  updateTocStickyBoundary()
  setupHeadingAnchors()

  // --- 100% 순정 댓글 안정성 보장을 위해 자바스크립트 간섭 완전 해제 ---
  // 티스토리 코어 React 댓글 시스템과의 Virtual DOM 충돌 및 크래시(Minified React Error)를 방지하기 위해,
  // 돔을 헤집어놓는 외부 자바스크립트 감시자(MutationObserver)와 동적 파싱 개입을 완전히 배제합니다.
  // 대신 Toss Tech 스타일의 완성형 프리미엄 CSS 테마를 통해 순정 상태로 100% 무결하게 렌더링되도록 보장합니다.

  cleanInlineStyles()
  preserveWordCombination()
  const article = document.querySelector('[data-docs-article]')
  if (article && 'MutationObserver' in window) {
    let mutationTimer = null
    const observer = new MutationObserver((mutations, obs) => {
      clearTimeout(mutationTimer)
      mutationTimer = setTimeout(() => {
        obs.disconnect()

        cleanInlineStyles()
        normalizeArticleMedia()
        enableArticleImageLinks()
        normalizeMarkdownListParagraphs()
        preserveWordCombination()
        setupHeadingAnchors()

        obs.observe(article, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
      }, 150)
    })
    observer.observe(article, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
  }

  arrangeLikeButton()
  window.addEventListener('resize', arrangeLikeButton)
  window.addEventListener('resize', updateTocStickyBoundary)
  window.addEventListener('load', updateTocStickyBoundary, { once: true })

  setupFloatingLikeButton()

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transitions')
    })
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
