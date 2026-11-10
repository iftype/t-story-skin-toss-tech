import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// skin.config.json 의 값을 dist/index.xml 에 넣는다(스킨 이름·설명·버전, 스킨 옵션 기본값)
function applySkinConfig() {
  const configPath = path.resolve(__dirname, 'skin.config.json')
  const xmlPath = path.resolve(__dirname, 'dist/index.xml')
  if (!fs.existsSync(configPath) || !fs.existsSync(xmlPath)) return
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))
  const cdata = (value) => `<![CDATA[${String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
  let xml = fs.readFileSync(xmlPath, 'utf-8')

  const info = config.skin || {}
  if (info.name) xml = xml.replace(/(<information>[\s\S]*?<name>)[\s\S]*?(<\/name>)/, `$1${info.name}$2`)
  xml = xml.replace(/(<information>[\s\S]*?<version>)[\s\S]*?(<\/version>)/, `$1${pkg.version}$2`)
  if (info.description) xml = xml.replace(/(<information>[\s\S]*?<description>)[\s\S]*?(<\/description>)/, `$1${cdata(info.description)}$2`)

  const owner = config.owner || {}
  const variables = { profileGithub: owner.github, profileEmail: owner.email, profileLinkedin: owner.linkedin }
  for (const [name, value] of Object.entries(variables)) {
    const re = new RegExp(`(<variable>\\s*<name>${name}<\\/name>[\\s\\S]*?<default>)[\\s\\S]*?(<\\/default>)`)
    xml = xml.replace(re, `$1${cdata(value || '')}$2`)
  }
  fs.writeFileSync(xmlPath, xml)
}

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

          applySkinConfig()

          // Auto-package into a Tistory-compliant ZIP bundle
          try {
            const zipTempDir = path.resolve(__dirname, 'dist-zip')
            if (fs.existsSync(zipTempDir)) {
              fs.rmSync(zipTempDir, { recursive: true, force: true })
            }
            fs.mkdirSync(zipTempDir, { recursive: true })

            // Keep the release zip flat. Tistory stores uploaded assets under its
            // own images path, while the skin references them via ./images/name.
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
            console.log('Successfully generated Tistory-compliant dist/tistory-skin-toss-tech.zip!')

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
