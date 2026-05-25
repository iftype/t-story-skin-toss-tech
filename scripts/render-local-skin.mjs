import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(rootDir, 'public/skin.html')
const outputDir = path.join(rootDir, 'dev')
const commentsFixture = fs.readFileSync(path.join(rootDir, 'fixtures/comments/rich.html'), 'utf8')

const baseReplacements = {
  '[##_page_title_##]': '로컬 테스트 글',
  '[##_desc_##]': '티스토리 스킨 로컬 테스트',
  '[##_title_##]': 'Local Skin',
  '[##_rss_url_##]': '/rss',
  '[##_body_id_##]': 'tt-body-page',
  '[##_blog_link_##]': '/',
  '[##_image_##]': '',
  '[##_owner_url_##]': '/manage',
  '[##_category_list_##]': '<ul class="tt_category"><li><a class="link_tit" href="/category">분류 전체보기 <span class="c_cnt">(3)</span></a><ul class="category_list"><li><a href="/category/dev">Dev <span class="c_cnt">(2)</span></a></li><li><a href="/category/life">Life <span class="c_cnt">(1)</span></a></li></ul></li></ul>',
  '[##_rctps_rep_link_##]': '/1',
  '[##_rctps_rep_title_##]': '최근 글',
  '[##_search_name_##]': 'search',
  '[##_search_text_##]': '',
  '[##_search_onclick_submit_##]': 'void(0);',
  '[##_list_conform_##]': '전체 글',
  '[##_article_rep_link_##]': '/1',
  '[##_article_rep_thumbnail_url_##]': '',
  '[##_article_rep_title_##]': '로컬 테스트 글',
  '[##_article_rep_desc_##]': '<h2>첫 번째 섹션</h2><p>본문 테스트입니다.</p><h3>하위 섹션</h3><pre data-ke-language="js"><code>const local = true</code></pre>',
  '[##_article_rep_summary_##]': '로컬 테스트 요약입니다.',
  '[##_article_rep_simple_date_##]': '2026.05.26',
  '[##_article_rep_category_link_##]': '/category/dev',
  '[##_article_rep_category_##]': 'Dev',
  '[##_article_rep_rate_##]': '<div data-tistory-react-app="Reaction"><button class="uoc-icon" aria-label="공감하기"><span class="uoc-count">3</span></button></div>',
  '[##_s_ad_m_link_##]': '/manage/post/1',
  '[##_s_ad_d_onclick_##]': 'void(0);',
  '[##_tag_label_rep_##]': '<a href="/tag/local">local</a>',
  '[##_article_prev_link_##]': '/0',
  '[##_article_prev_title_##]': '이전 글',
  '[##_article_next_link_##]': '/2',
  '[##_article_next_title_##]': '다음 글',
  '[##_comment_group_##]': commentsFixture,
  '[##_guestbook_group_##]': commentsFixture,
  '[##_revenue_list_upper_##]': '',
  '[##_var_profileGithub_##]': 'https://github.com',
  '[##_prev_page_##]': 'href="/page/1"',
  '[##_next_page_##]': 'href="/page/2"',
  '[##_no_more_prev_##]': '',
  '[##_no_more_next_##]': '',
  '[##_paging_rep_link_##]': 'href="/page/1"',
  '[##_paging_rep_link_num_##]': '1',
  '[##_article_password_##]': 'article-password',
  '[##_article_dissolve_##]': 'void(0);'
}

function keepBlock(html, tagName, keep) {
  const pattern = new RegExp(`<${tagName}>[\\s\\S]*?<\\/${tagName}>`, 'g')
  return html.replace(pattern, block => keep ? block.replace(new RegExp(`</?${tagName}>`, 'g'), '') : '')
}

function renderPage(mode) {
  let html = fs.readFileSync(sourcePath, 'utf8')
  const replacements = {
    ...baseReplacements,
    '[##_body_id_##]': mode === 'article' ? 'tt-body-page' : 'tt-body-index',
    '[##_article_rep_link_##]': mode === 'article' ? '/1' : '/posts/local-test',
    '[##_article_rep_thumbnail_url_##]': mode === 'article' ? '' : 'https://t1.daumcdn.net/tistory_admin/static/images/openGraph/opengraph-default.png'
  }

  html = keepBlock(html, 's_t3', true)
  html = keepBlock(html, 's_article_rep', true)
  if (mode === 'article') {
    html = keepBlock(html, 's_permalink_article_rep', true)
    ;['s_list', 's_index_article_rep', 's_page_rep', 's_guest', 's_article_protected', 's_paging', 's_rctps_rep'].forEach(tag => {
      html = keepBlock(html, tag, false)
    })
  } else {
    html = keepBlock(html, 's_list', true)
    html = keepBlock(html, 's_index_article_rep', true)
    ;['s_permalink_article_rep', 's_page_rep', 's_guest', 's_article_protected', 's_paging'].forEach(tag => {
      html = keepBlock(html, tag, false)
    })
    html = keepBlock(html, 's_rctps_rep', true)
  }
  ;[
    's_rp',
    's_tag_label',
    's_article_prev',
    's_article_next',
    's_ad_div',
    's_search',
    's_article_rep_thumbnail'
  ].forEach(tag => { html = keepBlock(html, tag, true) })
  const scriptContent = fs.readFileSync(path.join(rootDir, 'dist/script.js'), 'utf8')
  const cssContent = fs.readFileSync(path.join(rootDir, 'dist/style.css'), 'utf8')
  html = html.replace(/<script\s+src="\.\/images\/script\.js"[^>]*><\/script>|<script\s+src="\.\/script\.js"[^>]*><\/script>/, () => `<script>${scriptContent}</script>`)
  html = html.replace('<link rel="stylesheet" href="./style.css">', () => `<style>${cssContent}</style>`)
  html = html.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/highlight\.js\/11\.11\.1\/highlight\.min\.js"><\/script>/, '<script>window.hljs={highlightElement:function(){},getLanguage:function(){return true}}</script>')
  for (const [token, value] of Object.entries(replacements)) {
    html = html.split(token).join(value)
  }
  html = html.replace(/\[##_[\s\S]*?_##\]/g, '')
  if (mode === 'list') {
    html = html.replace('<body id="tt-body-index">', '<body id="tt-body-index" class="is-home-page has-list-page is-list-context">')
  }
  return html
}

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(path.join(outputDir, 'article.html'), renderPage('article'))
fs.writeFileSync(path.join(outputDir, 'list.html'), renderPage('list'))
fs.writeFileSync(path.join(outputDir, 'skin.html'), renderPage('list'))
console.log('Generated dev/article.html, dev/list.html and dev/skin.html')
