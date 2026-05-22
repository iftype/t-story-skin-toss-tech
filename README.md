# 토스 테크 스타일 티스토리 스킨 (Toss Tech Style Tistory Skin)

토스 테크(Toss Tech) 블로그의 단정하고 직관적인 디자인 시스템을 티스토리에 그대로 이식한 스킨입니다. 개발 기술 문서의 가독성을 극대화하고 독자가 글의 본질에 오롯이 몰입할 수 있도록 돕습니다.

---

## ⚡ 스킨 다운로드
스킨을 등록하고 적용하는 데 필요한 모든 파일이 담긴 압축 패키지입니다. 아래 링크에서 최신 버전을 다운로드하세요.

### [📦 최신 버전 스킨 패키지 다운로드](https://github.com/iftype/t-story-skin-toss-tech/releases/latest/download/tistory-skin-toss-tech.zip)

> [!TIP]
> **원클릭 다운로드**: 위 링크를 클릭하면 `tistory-skin-toss-tech.zip` 압축 파일이 즉시 다운로드됩니다. 다운로드 후 압축을 풀어 아래 가이드에 따라 적용해 보세요.

---

## 🚀 스킨 등록 및 설정 방법

### 1단계. 티스토리에 스킨 등록하기
처음 1회만 등록해 두면 계속해서 사용할 수 있습니다.

1. 다운로드한 **`tistory-skin-toss-tech.zip`** 파일의 압축을 풉니다.
2. 티스토리 블로그 관리자 페이지로 이동하여 **꾸미기 > 스킨 변경 > 스킨 등록**을 선택합니다.
3. 우측 상단의 **추가** 버튼을 누르고, 루트(Root) 폴더에 있는 아래 파일들을 먼저 선택하여 업로드합니다.
   * `skin.html`, `style.css`, `index.xml`, `preview.gif`, `preview1600.jpg`, `preview256.jpg`, `preview560.jpg`
4. 다시 **추가** 버튼을 누르고, **`images/` 폴더 안의 모든 파일**을 선택하여 업로드합니다.
   * `images/script.js`, `images/style.css`, `images/style-tight.css`
   * *참고: 티스토리가 이 파일들을 자동으로 `./images/` 경로에 매핑하여 업로드합니다.*
5. 하단의 **저장** 버튼을 누르고 스킨 명칭(예: `Toss Tech Style`)을 입력하여 보관함에 저장합니다.
6. **스킨 변경 > 스킨 보관함**으로 이동하여 등록한 스킨을 선택하고 **적용**을 누릅니다.

---

### 2단계. 본문 문단 여백 스타일 선택하기
글 작성 환경에 맞추어 널찍하고 쾌적한 **🌿 마크다운 모드**와 오밀조밀한 레이아웃의 **⚡ 일반/타이트 모드** 중 하나를 선택할 수 있습니다. 기본값은 마크다운 모드입니다.

#### 방법 A. CSS 덮어쓰기 (가장 간편한 방법)
티스토리 **스킨 편집 > Html 편집 > CSS 탭**에 아래 스타일 중 원하는 코드의 내용 전체를 복사하여 덮어쓰고 **적용**을 누릅니다.
* **🌿 마크다운 모드 (권장):** 폴더 내 `style.css` 내용 전체를 복사하여 붙여넣기
* **⚡ 일반/타이트 모드:** 폴더 내 `images/style-tight.css` 내용 전체를 복사하여 붙여넣기

#### 방법 B. HTML 코드 주석 수정하기
티스토리 **스킨 편집 > Html 편집 > HTML 탭**의 `22~37번` 라인에서 원하는 스타일 파일의 주석(`<!-- -->`) 처리를 변경합니다.

* **🌿 마크다운 모드 적용 시:**
  ```html
  <!-- 기본 모드: 마크다운 본문 모드 -->
  <link rel="stylesheet" href="./images/style.css">
  <!-- 선택 모드: 일반/타이트 본문 모드 (여백 없음) -->
  <!-- <link rel="stylesheet" href="./images/style-tight.css"> -->
  ```

* **⚡ 일반/타이트 모드 적용 시:**
  ```html
  <!-- 기본 모드: 마크다운 본문 모드 -->
  <!-- <link rel="stylesheet" href="./images/style.css"> -->
  <!-- 선택 모드: 일반/타이트 본문 모드 (여백 없음) -->
  <link rel="stylesheet" href="./images/style-tight.css">
  ```

---

## 📖 기술 문서의 완성도를 높이는 추천 가이드
스킨의 세련된 레이아웃을 100% 활용해 독자에게 높은 신뢰감을 주는 문서를 작성해 보세요. 토스팀에서 제공하는 공식 **테크니컬 라이팅 가이드**를 참고하여 글을 쓰시면 가독성이 한층 더 향상됩니다.

* 💡 **[토스 테크니컬 라이팅 가이드 시작하기](https://technical-writing.dev/overview.html)**: 개발자를 위한 글쓰기 기본기와 핵심 원칙(문서 유형, 정보 구조, 문장 다듬기)
* 🐙 **[공식 GitHub 저장소 (toss/technical-writing)](https://github.com/toss/technical-writing)**: 테크니컬 라이팅 가이드 원본 마크다운 문서 저장소

---

## 💻 로컬 개발 및 자동 배포

### 로컬 개발 환경 구성
로컬에서 직접 스킨 코드를 수정하고 실시간으로 빌드하려면 아래 명령어를 사용하세요.

```bash
# 의존성 패키지 설치
npm install

# 로컬 개발 서버 실행 (실시간 핫 리로딩 제공)
npm run dev

# 프로덕션 빌드 및 스킨 패키징
npm run build
```

* 빌드가 완료되면 결과물이 `dist/` 폴더 아래 생성되며, `vite.config.js` 플러그인이 티스토리 적용 규격에 맞게 `tistory-skin-toss-tech.zip` 압축 파일을 자동으로 패키징합니다.

---

### 📦 GitHub Releases 배포 자동화
이 저장소는 **GitHub Actions**를 지원하므로, 버전 태그를 푸시하면 빌드 및 패키지 릴리즈 배포가 자동으로 완료됩니다. 매번 번거롭게 수동으로 압축 파일을 업로드하지 않아도 됩니다.

1. 로컬에서 작업한 코드를 커밋합니다.
2. 새로운 버전 태그(예: `v1.0.0`)를 생성하고 push합니다.
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions 워크플로우가 자동으로 실행되어 빌드를 완료하고, 해당 버전의 GitHub Release 페이지에 최신 빌드 패키지(`tistory-skin-toss-tech.zip`)를 자동으로 배포합니다.
