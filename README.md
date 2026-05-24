# 토스 테크 스타일 티스토리 스킨

티스토리 블로그에 토스 테크 블로그의 디자인을 적용할 수 있습니다. 코드 블록, 목차, 카테고리 트리, 다크 모드를 기본으로 지원합니다.

## 스킨 다운로드

### [📦 최신 버전 다운로드](https://github.com/iftype/t-story-skin-toss-tech/releases/latest/download/tistory-skin-toss-tech.zip)

링크를 클릭하면 `tistory-skin-toss-tech.zip` 파일이 다운로드됩니다.

---

## 스킨 등록하기

처음 한 번만 등록하면 됩니다.

1. `tistory-skin-toss-tech.zip` 압축을 풉니다.
2. 티스토리 관리자 → **꾸미기 > 스킨 변경 > 스킨 등록**으로 이동합니다.
3. **추가** 버튼을 눌러 루트 폴더의 파일을 업로드합니다.
   - `skin.html`, `style.css`, `index.xml`, `preview.gif`, `preview256.jpg`, `preview560.jpg`
4. 다시 **추가** 버튼을 눌러 `images/` 폴더 안의 파일을 업로드합니다.
   - `images/script.js`, `images/style.css`, `images/style-tight.css`
   - 티스토리가 자동으로 `./images/` 경로에 매핑합니다.
5. **저장** 버튼을 누르고 스킨 이름을 입력합니다.
6. **스킨 변경 > 스킨 보관함**에서 등록한 스킨을 선택하고 **적용**을 누릅니다.

---

## 본문 여백 스타일 바꾸기

기본값은 마크다운 스타일(넓은 여백)입니다. 좁은 여백이 필요하면 아래 방법으로 변경할 수 있습니다.

### 방법 : HTML 주석 수정하기

<img width="600" height="780" alt="image" src="https://github.com/user-attachments/assets/5e8b2267-22c6-4734-8e3c-5ccdd501550e" />


**스킨 편집 > Html 편집 > HTML 탭**의 22~37번 줄에서 사용할 스타일 파일의 주석을 제거합니다.

마크다운 스타일 적용:
```html
<link rel="stylesheet" href="./images/style.css">
<!-- <link rel="stylesheet" href="./images/style-tight.css"> -->
```

타이트 스타일 적용:
```html
<!-- <link rel="stylesheet" href="./images/style.css"> -->
<link rel="stylesheet" href="./images/style-tight.css">
```


---

## 로컬에서 개발하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

빌드가 완료되면 `dist/tistory-skin-toss-tech.zip` 파일이 생성됩니다.

---

## 새 버전 배포하기

버전 태그를 push하면 GitHub Actions가 자동으로 빌드하고 릴리즈를 생성합니다.

```bash
git tag v1.0.0
git push origin v1.0.0
```
