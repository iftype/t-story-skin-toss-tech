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

          const tightComment = `/* ==========================================================================\n   [Tistory 스킨용 - 기본 포스트 본문 스타일]\n   일반 포스트 본문, 제목, 인용문, 댓글 스타일을 포함합니다.\n   ========================================================================== */\n`
          const tightCssContent = tightComment + cssContent.replace(/var\(--p-margin[^)]+\)/g, '0');
          fs.writeFileSync(cssPath, tightCssContent)

          // Auto-package into a Tistory-compliant flat ZIP bundle
          try {
            const zipTempDir = path.resolve(__dirname, 'dist-zip')

            if (fs.existsSync(zipTempDir)) {
              fs.rmSync(zipTempDir, { recursive: true, force: true })
            }
            fs.mkdirSync(zipTempDir, { recursive: true })

            // Copy all emitted assets flatly into the ZIP temp directory.
            const distFiles = fs.readdirSync(path.resolve(__dirname, 'dist'))
            for (const file of distFiles) {
              if (file === 'tistory-skin-toss-tech.zip') continue
              const source = path.resolve(__dirname, 'dist', file)
              const stat = fs.statSync(source)
              if (!stat.isFile()) continue
              fs.copyFileSync(source, path.resolve(zipTempDir, file))
            }

            // Run native OS zip command to bundle the skin
            const zipOutputFile = path.resolve(__dirname, 'dist/tistory-skin-toss-tech.zip')
            if (fs.existsSync(zipOutputFile)) {
              fs.unlinkSync(zipOutputFile)
            }

            execSync(`cd "${zipTempDir}" && zip -r "${zipOutputFile}" ./* > /dev/null`)
            console.log('Successfully generated flat dist/tistory-skin-toss-tech.zip!')

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
