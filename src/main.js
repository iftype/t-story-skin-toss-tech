import './styles.css'

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

  syncCommentComposerAvatar()
  normalizeLegacyComments()
  trackOpenCommentMenus()
  setupCommentAvatarLogin()
  setupCommentReplyClick()
  renderCommentMarkdown()
  setupCommentFallback()

  const commentsArea = document.querySelector('.docs-comments')
  if (commentsArea && 'MutationObserver' in window) {
    let cmtTimer = null
    const cmtObserver = new MutationObserver(() => {
      clearTimeout(cmtTimer)
      cmtTimer = setTimeout(() => {
        renderCommentMarkdown()
        setupCommentReplyClick()
      }, 100)
    })
    cmtObserver.observe(commentsArea, { childList: true, subtree: true })
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
