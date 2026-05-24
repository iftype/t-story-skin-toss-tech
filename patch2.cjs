const fs = require('fs');

function replaceKeepAll(file) {
  let css = fs.readFileSync(file, 'utf8');
  css = css.replace(/word-break: keep-all/g, 'word-break: break-all');
  fs.writeFileSync(file, css);
}

replaceKeepAll('src/styles/article.css');
replaceKeepAll('src/styles/comments.css');
console.log('patched keep-all to break-all');
