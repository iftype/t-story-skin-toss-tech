# Tistory Dev Docs Skin (Toss Tech Style)

문서형 개발 블로그 레이아웃을 목표로 한 프리미엄 티스토리 스킨입니다. Toss Product Sans 타이포그래피와 미니멀하고 단정한 디자인 시스템을 기반으로 빌드되었습니다.

글쓰기 취향에 맞춰 본문 문단 간 여백을 두 가지 스타일(마크다운 모드 / 일반 타이트 모드) 중 선택하여 바로 다운로드하고 적용하실 수 있습니다.

---

## 📥 바로 다운로드 (Direct Downloads)

아래 링크를 **마우스 우클릭 > 다른 이름으로 링크 저장(Save Link As...)** 하여 바로 다운로드 받아 티스토리에 적용하세요.

| 파일 이름 | 용도 | 다운로드 링크 |
| :--- | :--- | :--- |
| **`skin.html`** | 스킨 메인 HTML 템플릿 (테마 토글, 트리 카테고리 내장) | [📥 skin.html 다운로드](https://github.com/iftype/t-story-skin-toss-tech/raw/main/dist/skin.html) |
| **`style.css`** | 🌿 **마크다운 본문 모드 (기본/추천)**<br>문단 간 위아래 24px 여백이 활성화되어 글의 호흡과 가독성이 우수함 | [📥 style.css 다운로드](https://github.com/iftype/t-story-skin-toss-tech/raw/main/dist/style.css) |
| **`style-tight.css`** | ⚡ **일반/타이트 본문 모드**<br>문단 위아래 여백이 0으로 조밀하여 엔터(Enter)를 많이 치는 타법에 최적화됨 | [📥 style-tight.css 다운로드](https://github.com/iftype/t-story-skin-toss-tech/raw/main/dist/style-tight.css) |
| **`script.js`** | 자바스크립트 빌드 파일 (TOC 빌더, 드롭다운 로직 등 내장) | [📥 script.js 다운로드](https://github.com/iftype/t-story-skin-toss-tech/raw/main/dist/script.js) |
| **`index.xml`** | 티스토리 스킨 설정 및 정보 파일 | [📥 index.xml 다운로드](https://github.com/iftype/t-story-skin-toss-tech/raw/main/dist/index.xml) |

---

## 🚀 티스토리 스킨 편집창 적용 및 구분 가이드

### 📌 방법 A: CSS 탭에 바로 덮어씌워 적용하기 (권장)
티스토리 **스킨 편집 > Html 편집 > CSS 탭**에 직접 코드를 입력하여 간편하게 적용하는 방식입니다.

1. **마크다운 모드**를 원하시는 경우:
   - 위의 `style.css` 전체 내용을 복사하여 티스토리 **CSS 편집 창**의 기존 내용을 모두 지우고 붙여넣은 뒤 **적용**을 누릅니다.
2. **일반/타이트 모드**를 원하시는 경우:
   - 위의 `style-tight.css` 전체 내용을 복사하여 티스토리 **CSS 편집 창**의 기존 내용을 모두 지우고 붙여넣은 뒤 **적용**을 누릅니다.

> [!NOTE]
> 파일 최상단에 주석으로 `[Tistory 스킨용 - 마크다운 본문 모드]` 또는 `[Tistory 스킨용 - 일반/타이트 본문 모드]` 배너가 삽입되어 있으므로, 현재 블로그에 어떤 버전이 적용되어 있는지 한눈에 구분할 수 있습니다.

---

### 📌 방법 B: HTML에서 주석 토글로 전환하기
HTML 소스 상에서 직관적으로 링크를 끄고 켜고 싶으실 때 사용합니다.

1. 티스토리 **Html 편집 > 파일 업로드 탭**에 다운로드한 `style.css`와 `style-tight.css`, `script.js`를 업로드합니다.
2. **HTML 탭**으로 이동하여 22~37번 줄 사이의 stylesheet 링크 코드를 다음과 같이 조절합니다.

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
