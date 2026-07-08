import './styles.css'
import './styles/fixes.css'

import { injectCodeCSS, enhanceCodeBlocks } from './code.js'
import { getSavedTheme, applyTheme, cleanInlineStyles, preserveWordCombination } from './theme.js'
import { decorateWriteLinks, showAdminElements, normalizeProfileAvatars, bindGlobalActions, normalizeFooterGithubLink } from './header.js'
import { setupCategoryTree, renderCategoryMap } from './category.js'
import { markPageState, setupPageHeadEyebrow, showEmptyStateWhenNeeded, normalizeListMeta, normalizeListCards, hydrateHomeFeatured, hydrateListSummaries, setupThumbnailFallbacks, hydrateArticleRecommendationsFromSidebar } from './cards.js'
import { enableArticleImageLinks, normalizeArticleMedia, normalizeMarkdownListParagraphs, assignHeadingIds, setupHeadingAnchors } from './article.js'
import { generateTOC, updateTocStickyBoundary } from './toc.js'
import { syncCommentComposerAvatar, normalizeLegacyComments, trackOpenCommentMenus, renderCommentMarkdown, setupCommentFallback, setupCommentReplyClick, setupCommentAvatarLogin } from './comments.js'
import { setupFloatingLikeButton, arrangeLikeButton } from './likes.js'

// 모듈 로드 즉시 페이지 상태 클래스를 설정하여 CSS 레이아웃 깜빡임(FOUC) 방지
markPageState()

function init() {
  markPageState() // DOMContentLoaded 후 재확인
  injectCodeCSS()
  normalizeFooterGithubLink()
  applyTheme(getSavedTheme())
  decorateWriteLinks()
  showAdminElements()
  normalizeProfileAvatars()
  setupThumbnailFallbacks()
  hydrateArticleRecommendationsFromSidebar()
  renderCategoryMap()
  setupCategoryTree()
  bindGlobalActions()
  enhanceCodeBlocks()

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


  assignHeadingIds()
  generateTOC()
  updateTocStickyBoundary()
  setupHeadingAnchors()

  // --- 격리식 댓글 마크다운 렌더러 활성화 및 100% 리액트 안전 감시자 가동 ---
  // 기존 리액트 댓글 노드를 파괴하지 않고 바로 하위에 별도로 생성된 격리 노드(.docs-comment-markdown)에만 
  // 마크다운 번역 결과를 인젝션하므로, React Virtual DOM 붕괴(Minified React Error) 우려가 전혀 없는 100% 안전한 기법입니다.
  renderCommentMarkdown()
  const commentsRoot = document.querySelector('.docs-comments')
  if (commentsRoot && 'MutationObserver' in window) {
    let commentsTimer = null
    const commentsObserver = new MutationObserver(() => {
      clearTimeout(commentsTimer)
      commentsTimer = setTimeout(() => {
        try {
          renderCommentMarkdown()
        } catch (e) {
          // silent bypass
        }
      }, 120)
    })
    commentsObserver.observe(commentsRoot, { childList: true, subtree: true })
  }

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

  const releaseInitialTransitionLock = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-transitions')
      })
    })
  }

  if (document.readyState === 'complete') {
    releaseInitialTransitionLock()
  } else {
    window.addEventListener('load', releaseInitialTransitionLock, { once: true })
    window.setTimeout(releaseInitialTransitionLock, 1800)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
