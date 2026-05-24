const fs = require('fs');
let css = fs.readFileSync('src/styles/article.css', 'utf8');

// Update p margin
css = css.replace(/--p-margin: 24px 0 8px;/, '--p-margin: 32px 0 0 0;');
css = css.replace(/margin: var\(--p-margin, 24px 0 8px\) !important;/, 'margin: var(--p-margin, 32px 0 0 0) !important;');

// Add p:first-child
css = css.replace(/\.article-body p:last-child {/, '.article-body p:first-child {\n  margin-top: 0 !important;\n}\n\n.article-body p:last-child {');

// Update heading margins
css = css.replace(/\.article-body h1 \{\n  margin: 64px 0 32px !important;/g, '.article-body h1 {\n  margin: 64px 0 0 0 !important;');
css = css.replace(/\.article-body h2 \{\n  margin: 64px 0 24px !important;/g, '.article-body h2 {\n  margin: 48px 0 0 0 !important;');
css = css.replace(/\.article-body h3 \{\n  margin: 48px 0 16px !important;/g, '.article-body h3 {\n  margin: 32px 0 0 0 !important;');
css = css.replace(/\.article-body h4 \{\n  margin: 32px 0 12px !important;/g, '.article-body h4 {\n  margin: 24px 0 0 0 !important;');

// Add adjacent sibling rules
const siblingRules = `
/* Adjust gap after headings */
.article-body h1 + p { margin-top: 36px !important; }
.article-body h2 + p { margin-top: 28px !important; }
.article-body h3 + p { margin-top: 28px !important; }
.article-body h4 + p { margin-top: 28px !important; }

/* Remove top margin for first elements */
.article-body > h1:first-child,
.article-body > h2:first-child,
.article-body > h3:first-child,
.article-body > h4:first-child {
  margin-top: 0 !important;
}
`;
css = css.replace(/\.article-body ul,\n\.article-body ol \{/, siblingRules + '\n.article-body ul,\n.article-body ol {');

fs.writeFileSync('src/styles/article.css', css);
console.log('patched');
