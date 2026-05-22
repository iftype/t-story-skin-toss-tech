# Tistory Dev Docs Skin (Toss Tech Style)

문서형 개발 블로그 레이아웃을 목표로 한 프리미엄 티스토리 스킨입니다. Toss Product Sans 타이포그래피와 미니멀하고 단정한 디자인 시스템을 기반으로 빌드되었습니다.

글쓰기 취향에 맞춰 본문 문단 간 여백을 두 가지 스타일(마크다운 모드 / 일반 타이트 모드) 중 선택하여 바로 다운로드하고 적용하실 수 있습니다.

---

## 📥 원클릭 패키지 다운로드 (Download ZIP)

티스토리 스킨 등록에 필요한 모든 파일이 규격 폴더 구조로 구성된 올인원 압축 패키지입니다.

### [⚡ 최신 버전 스킨 패키지 다운로드](https://github.com/iftype/t-story-skin-toss-tech/raw/main/dist/tistory-skin-toss-tech.zip)

> [!TIP]
> **스킨 적용 방법**: 위의 링크를 클릭하여 `tistory-skin-toss-tech.zip`을 다운로드 받아 압축을 해제한 뒤 바로 티스토리에 업로드하여 적용하실 수 있습니다.

---

## 🚀 티스토리 스킨 등록 및 설정 가이드

### 📌 Step 1: 스킨 등록하기 (최초 1회)

1. 다운로드한 **`tistory-skin-toss-tech.zip`**의 압축을 해제합니다.
2. 티스토리 블로그 관리자 홈에서 **꾸미기 > 스킨 변경 > 스킨 등록** 버튼을 클릭합니다.
3. 우측 상단의 **추가** 버튼을 누르고, 압축 해제한 폴더의 **루트(Root)에 있는 다음 파일들**을 먼저 선택하여 업로드합니다.
   * `skin.html`, `style.css`, `index.xml`, `preview.gif`, `preview1600.jpg`, `preview256.jpg`, `preview560.jpg`
4. 다시 **추가** 버튼을 누르고, **`images/` 폴더 내의 모든 파일**을 선택하여 업로드합니다. (티스토리가 파일들을 자동으로 `./images/` 경로에 매핑합니다.)
   * `images/script.js`, `images/style.css`, `images/style-tight.css`
5. 하단의 **저장** 버튼을 누르고 원하는 스킨명(예: `Toss Tech Style`)을 입력하여 저장합니다.
6. **스킨 변경 > 스킨 보관함**으로 이동하여 방금 등록한 스킨을 선택하고 **적용**을 누릅니다.

---

### 📌 Step 2: 본문 여백 모드 선택하기

이 스킨은 가독성을 극대화한 **🌿 마크다운 모드**와 조밀한 레이아웃의 **⚡ 일반/타이트 모드**를 모두 내장하고 있으며, 기본값은 마크다운 모드입니다.

#### 방법 A: CSS 탭 덮어쓰기 (가장 간편하고 즉각적인 방법)
티스토리 **스킨 편집 > Html 편집 > CSS 탭**에 아래 내용 중 원하는 파일의 전체 코드를 복사하여 붙여넣고 **적용**을 누릅니다.
* **마크다운 모드 (기본/추천):** 압축 해제한 폴더의 `style.css` 내용 전체를 복사하여 덮어씁니다.
* **일반/타이트 모드:** 압축 해제한 폴더의 `images/style-tight.css` 내용 전체를 복사하여 덮어씁니다.

#### 방법 B: HTML 주석 토글로 전환하기
티스토리 **스킨 편집 > Html 편집 > HTML 탭**의 `22~37번` 줄 부근에서 다음과 같이 주석 처리 상태를 제어합니다.

* **마크다운 모드로 적용할 때:**
  ```html
  <!-- 기본 모드: 마크다운 본문 모드 -->
  <link rel="stylesheet" href="./images/style.css">
  <!-- 선택 모드: 일반/타이트 본문 모드 (여백 없음) -->
  <!-- <link rel="stylesheet" href="./images/style-tight.css"> -->
  ```

* **일반/타이트 모드로 적용할 때:**
  ```html
  <!-- 기본 모드: 마크다운 본문 모드 -->
  <!-- <link rel="stylesheet" href="./images/style.css"> -->
  <!-- 선택 모드: 일반/타이트 본문 모드 (여백 없음) -->
  <link rel="stylesheet" href="./images/style-tight.css">
  ```

---

## 💻 로컬 개발 환경 실행

로컬 소스 코드를 직접 수정하고 다시 컴파일하려면 다음 명령어를 실행하십시오.

```bash
# 의존성 패키지 설치
npm install

# 로컬 개발 서버 실행 (실시간 핫 리로딩)
npm run dev

# 빌드 및 파일 배포
npm run build
```

빌드 결과물은 자동으로 `dist/` 폴더 아래 컴파일되며, 문단 여백 변수인 `--p-margin`을 읽어 마크다운용 `style.css`와 일반용 `style-tight.css` 버전을 실시간 복제/배포합니다.
