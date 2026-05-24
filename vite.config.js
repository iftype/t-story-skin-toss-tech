import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env': {}
  },
  plugins: [
    {
      name: 'generate-tight-css',
      closeBundle() {
        const cssPath = path.resolve(__dirname, 'dist/style.css')
        if (fs.existsSync(cssPath)) {
          const cssContent = fs.readFileSync(cssPath, 'utf-8')

          // Clone to style-markdown.css (Markdown mode with large paragraph margins)
          const markdownComment = `/* ==========================================================================\n   [Tistory 스킨용 - 선택 사항: 마크다운 본문 모드]\n   문단 간의 여백이 살아있어 마크다운이나 일반 서식 작성 시 가독성이 높습니다.\n   아래 내용을 복사하여 기본 style.css에 덮어쓰거나 적용하세요.\n   ========================================================================== */\n`
          fs.writeFileSync(path.resolve(__dirname, 'dist/style-markdown.css'), markdownComment + cssContent)

          // Make default style.css the Tight mode (Zero paragraph margins)
          const tightComment = `/* ==========================================================================\n   [Tistory 스킨용 - 기본: 일반/타이트 본문 모드]\n   문단 간의 위아래 여백을 0으로 꽉 줄여 조밀한 간격의 포스트 작성을 지원합니다.\n   ========================================================================== */\n`
          const tightCssContent = tightComment + cssContent + '\n:root { --p-margin: 0 !important; }\n'
          fs.writeFileSync(cssPath, tightCssContent)

          // Auto-package into a Tistory-compliant ZIP bundle
          try {
            const zipTempDir = path.resolve(__dirname, 'dist-zip')
            const zipImagesDir = path.resolve(zipTempDir, 'images')

            if (fs.existsSync(zipTempDir)) {
              fs.rmSync(zipTempDir, { recursive: true, force: true })
            }
            fs.mkdirSync(zipImagesDir, { recursive: true })

            // Copy files required at root of Tistory skin zip
            fs.copyFileSync(path.resolve(__dirname, 'dist/skin.html'), path.resolve(zipTempDir, 'skin.html'))
            fs.copyFileSync(path.resolve(__dirname, 'dist/style.css'), path.resolve(zipTempDir, 'style.css'))
            fs.copyFileSync(path.resolve(__dirname, 'dist/index.xml'), path.resolve(zipTempDir, 'index.xml'))

            // Copy previews to root
            const distFiles = fs.readdirSync(path.resolve(__dirname, 'dist'))
            for (const file of distFiles) {
              if (file.startsWith('preview')) {
                fs.copyFileSync(path.resolve(__dirname, 'dist', file), path.resolve(zipTempDir, file))
              }
            }

            // Copy assets to images/ inside the ZIP
            fs.copyFileSync(path.resolve(__dirname, 'dist/script.js'), path.resolve(zipImagesDir, 'script.js'))
            fs.copyFileSync(path.resolve(__dirname, 'dist/style.css'), path.resolve(zipImagesDir, 'style.css'))
            fs.copyFileSync(path.resolve(__dirname, 'dist/style-markdown.css'), path.resolve(zipImagesDir, 'style-markdown.css'))

            // Run native OS zip command to bundle the skin
            const zipOutputFile = path.resolve(__dirname, 'dist/tistory-skin-toss-tech.zip')
            if (fs.existsSync(zipOutputFile)) {
              fs.unlinkSync(zipOutputFile)
            }

            execSync(`cd "${zipTempDir}" && zip -r "${zipOutputFile}" ./* > /dev/null`)
            console.log('Successfully generated dist/tistory-skin-toss-tech.zip!')

            // Cleanup temp dir
            fs.rmSync(zipTempDir, { recursive: true, force: true })
          } catch (err) {
            console.error('Failed to auto-package ZIP:', err)
          }
        }
      }
    }
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      input: 'src/main.js',
      output: {
        entryFileNames: 'script.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        inlineDynamicImports: false,
      }
    },
    cssCodeSplit: false,
  }
})
