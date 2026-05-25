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

export function resolveCodeLanguage(value) {
  if (!value) return { display: 'text', hljs: null }
  const raw = String(value)
    .trim()
    .replace(/^language-/, '')
    .split(/\s+/)[0]
    .replace(/[{}"'`]/g, '')
    
  const normalized = raw.toLowerCase()
    
  // 화면에 보여주는 이름 -> Highlight.js 엔진 이름 매핑
  const map = {
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

  let hljsLang
  if (normalized in map) {
    hljsLang = map[normalized]  // null이면 하이라이팅 안 함
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

export function getCodeBlockMeta(pre, block) {
  const hljs = getHljs()
  const langFromCodeClass = (Array.from(block.classList)
    .find(c => c.startsWith('language-') || hljs.getLanguage(c)) || block.className.split(' ')[0])?.replace(/^language-/, '')

  const langFromPreClass = Array.from(pre.classList)
    .find(c => /^[a-z0-9_+-]+$/i.test(c) && c !== 'line-numbers')?.replace(/^language-/, '')

  const resolved = resolveCodeLanguage(
    langFromCodeClass ||
    pre.getAttribute('data-ke-language') ||
    pre.getAttribute('data-language') ||
    pre.getAttribute('data-lang') ||
    langFromPreClass ||
    'text'
  )

  return {
    displayLang: resolved.display,
    hljsLang: resolved.hljs
  }
}

export function stripCodeMetaDirective(block) {
  const text = block.textContent || ''
  const lines = text.split('\n')
  const firstLine = lines[0]?.trim() || ''
  const match = firstLine.match(/^(?:\/\/|#|\/\*|<!--)\s*(?:ec|highlight|mark|lines?)\s*[:=]\s*(.+?)(?:\s*\*\/|\s*-->)?$/i)

  if (match) block.textContent = lines.slice(1).join('\n')
}

export async function enhanceCodeBlocks() {
  const blocks = document.querySelectorAll('pre > code')
  if (blocks.length === 0) return

  blocks.forEach(block => {
    const pre = block.parentElement
    if (pre.dataset.enhanced) return
    
    const meta = getCodeBlockMeta(pre, block)
    block.className = block.className.replace(/\blanguage-[a-z0-9_-]+\b/gi, '')
    pre.className = pre.className.replace(/\blanguage-[a-z0-9_-]+\b/gi, '')
    
    stripCodeMetaDirective(block)
    if (meta.hljsLang) {
      block.classList.add(`language-${meta.hljsLang}`)
      block.classList.add(meta.hljsLang)
      try {
        getHljs().highlightElement(block)
      } catch (e) {
        // 하이라이팅 실패해도 텍스트는 보임
      }
    }

    const wrapper = document.createElement('div')
    wrapper.className = 'code-frame'

    const header = document.createElement('div')
    header.className = 'code-header'
    header.innerHTML = `
      <div class="code-dots" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="code-title">${meta.displayLang}</div>
    `

    pre.parentNode.insertBefore(wrapper, pre)
    wrapper.appendChild(header)
    wrapper.appendChild(pre)
    pre.dataset.enhanced = 'true'
  })
}
