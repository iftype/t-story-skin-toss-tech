import { getHljs } from './utils.js'

export function injectCodeCSS() {
  if (document.getElementById('docs-code-colors')) return
  const style = document.createElement('style')
  style.id = 'docs-code-colors'
  style.textContent = `
    /* Tokyo Night inspired code theme (Prism & Highlight.js Compatible) */
    .code-frame {
      background: #1a1b26 !important;
      border: 1px solid #24283b !important;
    }
    .code-header {
      background: #16161e !important;
      border-bottom: 1px solid #24283b !important;
    }
    .code-title {
      color: #a9b1d6 !important;
    }
    .code-frame code {
      color: #a9b1d6 !important;
      font-family: Menlo, Monaco, "Courier New", monospace !important;
    }
    .code-frame .token { background: transparent !important; }
    
    /* Comments */
    .code-frame .token.comment,
    .code-frame .token.prolog,
    .code-frame .token.doctype,
    .code-frame .hljs-comment,
    .code-frame .hljs-quote { color: #565f89 !important; font-style: italic !important; }
    
    /* Keywords */
    .code-frame .token.keyword,
    .code-frame .hljs-keyword,
    .code-frame .hljs-selector-tag { color: #bb9af3 !important; }
    
    /* Builtins / Class names */
    .code-frame .token.builtin,
    .code-frame .token.class-name,
    .code-frame .hljs-built_in,
    .code-frame .hljs-class,
    .code-frame .hljs-title.class_ { color: #2ac3de !important; }
    
    /* Numbers / Booleans / Constants / Symbol / Deletion */
    .code-frame .token.number,
    .code-frame .token.boolean,
    .code-frame .token.constant,
    .code-frame .token.symbol,
    .code-frame .token.deleted,
    .code-frame .hljs-number,
    .code-frame .hljs-literal,
    .code-frame .hljs-variable.constant_,
    .code-frame .hljs-bullet,
    .code-frame .hljs-deletion { color: #ff9e64 !important; }
    
    /* Strings / Insertion / Meta */
    .code-frame .token.string,
    .code-frame .token.char,
    .code-frame .token.attr-value,
    .code-frame .token.inserted,
    .code-frame .hljs-string,
    .code-frame .hljs-meta,
    .code-frame .hljs-addition { color: #9ece6a !important; }
    
    /* Operators / Entities / Url */
    .code-frame .token.operator,
    .code-frame .token.entity,
    .code-frame .token.url,
    .code-frame .hljs-operator { color: #89ddff !important; }
    
    /* Functions */
    .code-frame .token.function,
    .code-frame .hljs-title.function_,
    .code-frame .hljs-title { color: #7aa2f7 !important; }
    
    /* Tags / Selectors / Name */
    .code-frame .token.tag,
    .code-frame .token.selector,
    .code-frame .hljs-tag,
    .code-frame .hljs-name,
    .code-frame .hljs-selector-id,
    .code-frame .hljs-selector-class { color: #f7768e !important; }
    
    /* Properties / Attrs / Variables / Params */
    .code-frame .token.property,
    .code-frame .token.attr-name,
    .code-frame .token.variable,
    .code-frame .token.parameter,
    .code-frame .hljs-property,
    .code-frame .hljs-attr,
    .code-frame .hljs-variable,
    .code-frame .hljs-params { color: #e0af68 !important; }
    
    /* Regexp / Important / Link */
    .code-frame .token.regex,
    .code-frame .token.important,
    .code-frame .hljs-regexp,
    .code-frame .hljs-link { color: #b4f9f8 !important; }
    
    /* Punctuation */
    .code-frame .token.punctuation,
    .code-frame .hljs-punctuation { color: #a9b1d6 !important; }

    /* Tokyo Night Light Mode mapping */
    html[data-ui-theme="light"] .code-frame {
      background: #f5f6f9 !important;
      border: 1px solid #d5d6db !important;
    }
    html[data-ui-theme="light"] .code-header {
      background: #e1e2e7 !important;
      border-bottom: 1px solid #d5d6db !important;
    }
    html[data-ui-theme="light"] .code-title {
      color: #565f89 !important;
    }
    html[data-ui-theme="light"] .code-frame code {
      color: #343b58 !important;
    }
    
    html[data-ui-theme="light"] .code-frame .token.comment,
    html[data-ui-theme="light"] .code-frame .hljs-comment,
    html[data-ui-theme="light"] .code-frame .hljs-quote { color: #9699a3 !important; font-style: italic !important; }
    
    html[data-ui-theme="light"] .code-frame .token.keyword,
    html[data-ui-theme="light"] .code-frame .hljs-keyword,
    html[data-ui-theme="light"] .code-frame .hljs-selector-tag { color: #9854f1 !important; }
    
    html[data-ui-theme="light"] .code-frame .token.builtin,
    html[data-ui-theme="light"] .code-frame .token.class-name,
    html[data-ui-theme="light"] .code-frame .hljs-built_in,
    html[data-ui-theme="light"] .code-frame .hljs-class,
    html[data-ui-theme="light"] .code-frame .hljs-title.class_ { color: #0f7b8c !important; }
    
    html[data-ui-theme="light"] .code-frame .token.number,
    html[data-ui-theme="light"] .code-frame .token.boolean,
    html[data-ui-theme="light"] .code-frame .token.constant,
    html[data-ui-theme="light"] .code-frame .hljs-number,
    html[data-ui-theme="light"] .code-frame .hljs-literal,
    html[data-ui-theme="light"] .code-frame .hljs-variable.constant_ { color: #d08770 !important; }
    
    html[data-ui-theme="light"] .code-frame .token.string,
    html[data-ui-theme="light"] .code-frame .token.attr-value,
    html[data-ui-theme="light"] .code-frame .hljs-string,
    html[data-ui-theme="light"] .code-frame .hljs-meta,
    html[data-ui-theme="light"] .code-frame .hljs-addition { color: #485e30 !important; }
    
    html[data-ui-theme="light"] .code-frame .token.operator,
    html[data-ui-theme="light"] .code-frame .hljs-operator { color: #3870a8 !important; }
    
    html[data-ui-theme="light"] .code-frame .token.function,
    html[data-ui-theme="light"] .code-frame .hljs-title.function_,
    html[data-ui-theme="light"] .code-frame .hljs-title { color: #3870a8 !important; }
    
    html[data-ui-theme="light"] .code-frame .token.tag,
    html[data-ui-theme="light"] .code-frame .token.selector,
    html[data-ui-theme="light"] .code-frame .hljs-tag,
    html[data-ui-theme="light"] .code-frame .hljs-name,
    html[data-ui-theme="light"] .code-frame .hljs-selector-id,
    html[data-ui-theme="light"] .code-frame .hljs-selector-class { color: #8c4351 !important; }
    
    html[data-ui-theme="light"] .code-frame .token.property,
    html[data-ui-theme="light"] .code-frame .token.attr-name,
    html[data-ui-theme="light"] .code-frame .token.variable,
    html[data-ui-theme="light"] .code-frame .token.parameter,
    html[data-ui-theme="light"] .code-frame .hljs-property,
    html[data-ui-theme="light"] .code-frame .hljs-attr,
    html[data-ui-theme="light"] .code-frame .hljs-variable,
    html[data-ui-theme="light"] .code-frame .hljs-params { color: #d08770 !important; }
    
    html[data-ui-theme="light"] .code-frame .token.punctuation,
    html[data-ui-theme="light"] .code-frame .hljs-punctuation { color: #343b58 !important; }
    html[data-ui-theme="light"] .code-frame .token.string-property { color: #d08770 !important; }
  `
  document.head.appendChild(style)
}

// 화면에 보여주는 이름 -> Highlight.js 엔진 이름 매핑
const LANGUAGE_MAP = {
  'js': 'javascript',
  'jsx': 'javascript',
  'javascript': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'typescript': 'typescript',
  'sh': 'bash',
  'shell': 'bash',
  'zsh': 'bash',
  'bash': 'bash',
  'py': 'python',
  'python': 'python',
  'yml': 'yaml',
  'yaml': 'yaml',
  'md': 'markdown',
  'markdown': 'markdown',
  'html': 'xml',
  'xml': 'xml',
  'svg': 'xml',
  'markup': 'xml',
  'css': 'css',
  'json': 'json',
  'c++': 'cpp',
  'cpp': 'cpp',
  'c#': 'csharp',
  'csharp': 'csharp',
  'java': 'java',
  'sql': 'sql',
  'text': null,
  'plaintext': null,
  'plain': null,
}

export function resolveCodeLanguage(value) {
  if (!value) return { display: 'text', hljs: null }
  const raw = String(value)
    .trim()
    .replace(/^language-/, '')
    .split(/\s+/)[0]
    .replace(/[{}"'`]/g, '')
    
  const normalized = raw.toLowerCase()
    
  let hljsLang
  if (normalized in LANGUAGE_MAP) {
    hljsLang = LANGUAGE_MAP[normalized]  // null이면 하이라이팅 안 함
  } else if (getHljs().getLanguage(normalized)) {
    hljsLang = normalized
  } else if (/^[a-z0-9-]+$/.test(normalized)) {
    hljsLang = normalized
  } else {
    hljsLang = null  // 모르는 언어면 그냥 plain text
  }

  return {
    display: raw || 'text',
    hljs: hljsLang
  }
}

// 티스토리는 언어를 고르지 않은 코드 블록에도 자동 추측한 언어를 `<pre class="clojure">`처럼 저장한다.
// 이 값은 JSON을 clojure, 일반 텍스트를 prolog로 보는 등 자주 틀리므로 라벨로 쓰지 않는다.
// 에디터에서 직접 고른 언어(data-ke-language)나 마크다운 펜스(language-xxx)만 믿는다.
const AUTO_DETECT_SUBSET = ['javascript', 'typescript', 'json', 'bash', 'yaml', 'sql', 'xml', 'css', 'python', 'java', 'kotlin', 'markdown']

export function getCodeBlockMeta(pre, block) {
  const explicit =
    pre.getAttribute('data-ke-language') ||
    pre.getAttribute('data-language') ||
    pre.getAttribute('data-lang') ||
    Array.from(block.classList).find(c => c.startsWith('language-')) ||
    Array.from(pre.classList).find(c => c.startsWith('language-'))

  if (explicit) {
    const resolved = resolveCodeLanguage(explicit)
    return { displayLang: resolved.display, hljsLang: resolved.hljs }
  }

  // 언어를 모르면 라벨은 비우고, 색상만 자주 쓰는 언어 안에서 자동 추측한다
  return { displayLang: '', hljsLang: null, autoDetect: true }
}

export function stripCodeMetaDirective(block) {
  const text = block.textContent || ''
  const lines = text.split('\n')
  const firstLine = lines[0]?.trim() || ''
  const match = firstLine.match(/^(?:\/\/|#|\/\*|<!--)\s*(?:ec|highlight|mark|lines?)\s*[:=]\s*(.+?)(?:\s*\*\/|\s*-->)?$/i)

  if (match) block.textContent = lines.slice(1).join('\n')
}

// 첫 줄이 `// bash`, `# python`처럼 언어 이름만 있는 주석이면 그 언어로 쓰고 줄은 지운다
// 아는 언어 이름일 때만 인식해서 `// todo` 같은 일반 주석은 건드리지 않는다
export function takeCodeLanguageDirective(block) {
  const lines = (block.textContent || '').split('\n')
  const match = lines[0]?.trim().match(/^(?:\/\/|#)\s*([a-z0-9_+#-]+)$/i)
  if (!match) return null

  const name = match[1].toLowerCase()
  if (!(name in LANGUAGE_MAP) && !getHljs().getLanguage(name)) return null

  block.textContent = lines.slice(1).join('\n')
  return name
}

export async function enhanceCodeBlocks() {
  const blocks = document.querySelectorAll('pre > code')
  if (blocks.length === 0) return

  blocks.forEach(block => {
    const pre = block.parentElement
    if (pre.dataset.enhanced) return
    
    const directiveLang = takeCodeLanguageDirective(block)
    const meta = directiveLang
      ? { displayLang: directiveLang, hljsLang: resolveCodeLanguage(directiveLang).hljs }
      : getCodeBlockMeta(pre, block)
    block.className = block.className.replace(/\blanguage-[a-z0-9_-]+\b/gi, '')
    pre.className = pre.className.replace(/\blanguage-[a-z0-9_-]+\b/gi, '')
    
    stripCodeMetaDirective(block)
    // 티스토리가 추측해 넣은 언어 클래스(clojure, prolog 등)도 지워서 엉뚱한 하이라이터가 붙지 않게 한다
    if (meta.autoDetect) {
      const guessed = pre.className.split(/\s+/).filter(c => getHljs().getLanguage(c))
      guessed.forEach(c => { pre.classList.remove(c); block.classList.remove(c) })
    }
    if (meta.hljsLang) {
      block.classList.add(`language-${meta.hljsLang}`)
      block.classList.add(meta.hljsLang)
      try {
        getHljs().highlightElement(block)
      } catch (e) {
        // 하이라이팅 실패해도 텍스트는 보임
      }
    } else if (meta.autoDetect) {
      try {
        const result = getHljs().highlightAuto(block.textContent || '', AUTO_DETECT_SUBSET)
        if (result.language && result.relevance >= 5) {
          block.innerHTML = result.value
          block.classList.add('hljs', `language-${result.language}`)
        }
      } catch (e) {
        // 추측 실패하면 색 없이 보여준다
      }
    }

    const wrapper = document.createElement('div')
    wrapper.className = 'code-frame'

    const header = document.createElement('div')
    header.className = 'code-header'
    header.innerHTML = `
      <div class="code-dots" aria-hidden="true"><span></span><span></span><span></span></div>
      ${meta.displayLang ? `<div class="code-title">${meta.displayLang}</div>` : ''}
    `

    pre.parentNode.insertBefore(wrapper, pre)
    wrapper.appendChild(header)
    wrapper.appendChild(pre)
    pre.dataset.enhanced = 'true'
  })
}
