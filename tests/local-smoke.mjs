import { chromium } from 'playwright'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const articleUrl = pathToFileURL(path.resolve('dev/article.html')).href
const listUrl = pathToFileURL(path.resolve('dev/skin.html')).href

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function runAtViewport(browser, viewport) {
  const page = await browser.newPage({ viewport })
  const consoleErrors = []
  page.on('pageerror', error => consoleErrors.push(error.message))
  await page.goto(articleUrl)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(400)

  assert(await page.locator('.docs-comments').count() === 1, 'comments section is missing')
  assert(await page.locator('.docs-comments .tt-area-write').count() >= 1, 'comment composer is missing')
  assert(await page.locator('.docs-comments .tt-list-reply .tt-item-reply').count() >= 1, 'comment list is missing')
  assert(await page.locator('.docs-comments .docs-comment-markdown').count() >= 2, 'comment markdown was not rendered')
  assert(await page.locator('.docs-comments .tt_desc').count() >= 1, 'native comment text node was removed')
  assert(await page.locator('.docs-comments.is-comment-markdown-ready').count() === 1, 'comment markdown ready state was not set')
  assert(Number(await page.locator('.docs-comments').getAttribute('data-comment-markdown-count')) >= 2, 'comment markdown ready count was not recorded')
  assert(await page.locator('.docs-toc__nav a').count() >= 2, 'TOC links were not generated')

  const markdownCount = await page.locator('#comment101 .docs-comment-markdown').count()
  await page.evaluate(() => {
    document.querySelector('.tt_desc')?.appendChild(document.createTextNode(' '))
  })
  await page.waitForTimeout(200)
  assert(await page.locator('#comment101 .docs-comment-markdown').count() === markdownCount, 'comment markdown was duplicated after mutation')

  await page.fill('.docs-comments textarea.tt-cmt', '로컬 댓글 입력')
  assert(await page.inputValue('.docs-comments textarea.tt-cmt') === '로컬 댓글 입력', 'comment textarea is not editable')

  let replyClicked = false
  await page.exposeFunction('__localReplyClicked', () => { replyClicked = true })
  await page.evaluate(() => {
    const reply = document.querySelector('#comment101 .tt-link-comment')
    reply?.addEventListener('click', event => {
      event.preventDefault()
      window.__localReplyClicked()
    }, { once: true })
  })
  await page.click('#comment101 .tt-box-meta')
  await page.waitForTimeout(100)
  assert(replyClicked, 'clicking comment meta did not trigger the reply link')

  assert(consoleErrors.length === 0, `browser errors: ${consoleErrors.join('; ')}`)
  await page.close()
}

async function runListPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const consoleErrors = []
  page.on('pageerror', error => consoleErrors.push(error.message))
  await page.goto(listUrl)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(900)

  assert(await page.locator('.docs-list-item').count() >= 1, 'list card is missing')
  assert(await page.locator('.docs-list-item.is-empty, .docs-list-item__placeholder-emoji, .docs-list-item__ghost-container').count() >= 1, 'list thumbnail fallback was not applied')
  assert(await page.locator('[data-home-featured]').count() === 1, 'home featured root is missing')
  assert(await page.locator('[data-home-featured].is-ready, [data-home-featured].is-hydrated').count() >= 1, 'home featured slider did not hydrate')

  assert(consoleErrors.length === 0, `list page browser errors: ${consoleErrors.join('; ')}`)
  await page.close()
}

const browser = await chromium.launch()
try {
  await runAtViewport(browser, { width: 1280, height: 900 })
  await runAtViewport(browser, { width: 390, height: 844 })
  await runListPage(browser)
  console.log('Local smoke tests passed')
} finally {
  await browser.close()
}
