# 2026-05-17 Tistory 스킨 문제 정리

## 작업 배경
- 기준 레퍼런스는 Toss Tech의 홈 리스트와 글 상세 읽기 경험이다.
- 홈은 작은 카드형 그리드, 모바일은 얇은 가로 리스트를 목표로 했다.
- 글 상세는 본문 폭을 안정적으로 유지하고, 이미지/코드블럭/TOC/댓글이 서로 레이아웃을 깨지 않도록 정리하는 것이 핵심이었다.
- 다크모드는 Codex 앱과 유사한 저채도 쿨블루 톤을 목표로 했다.

## 주요 문제
- 홈 카드가 새로고침 시 크게 깜빡이거나 `전체 글` 헤더와 글 개수 위치가 늦게 보정됐다.
- 홈 카드 제목이 두 줄일 때 카드 높이와 클릭 영역이 불안정했다.
- 카테고리 페이지에서 `/category`와 `/category/{section}`의 역할이 섞였다.
- 검색 결과가 없거나 글 0개일 때 빈 상태 UI가 필요했다.
- 본문 이미지와 코드블럭 폭 정책이 계속 흔들렸다.
- TOC가 글 영역을 밀거나, 스크롤을 따라오지 않거나, 긴 제목이 두 줄로 깨졌다.
- 포스트 하단 태그/이전글/다음글/관련글 영역의 높이와 배치가 맞지 않았다.
- 댓글과 답글 카드의 오른쪽 끝이 맞지 않았다.
- 댓글 카드 간 간격이 너무 좁고, 수정/삭제 드롭다운이 다른 댓글 카드에 가려졌다.
- 댓글 입력창에서 비로그인 상태의 이름/비밀번호/textarea 배치가 깨졌다.
- 댓글 입력창 프로필 이미지가 Tistory 프로필과 연동되지 않았다.
- 댓글 입력창에서 엔터를 여러 번 치면 줄간격이 비정상적으로 커졌다.
- 댓글 입력창 높이 조절이 되지 않았다.
- 다크모드에서 댓글 입력 중 엔터 이후 글자색이 검정으로 바뀌는 문제가 있었다.

## 원인
- Tistory 댓글 DOM이 한 가지가 아니었다.
- 일부 환경에서는 React 댓글 앱 구조가 렌더링됐다.
- 다른 환경에서는 구형 `#entry21Comment` 구조와 `textarea.tt_inp_g`가 렌더링됐다.
- 기존 CSS는 React 구조의 `.tt-cmt`, `.tt-list-reply-comment` 위주로 잡혀 있었고, 구형 구조에는 충분히 적용되지 않았다.
- 답글의 실제 중첩 리스트 클래스가 `.tt-list-reply-sub`가 아니라 `.tt-list-reply-comment`인 경우가 있었다.
- CSS 파일에 댓글 관련 override가 여러 번 누적되어, 앞에서 고친 규칙이 뒤쪽 규칙에 다시 덮이는 상황이 생겼다.
- Tistory 기본 CSS가 textarea/contenteditable의 `line-height`, `resize`, `overflow`, form layout을 다시 건드렸다.
- 프로필 이미지는 댓글 입력 폼에 기본으로 제공되지 않는 경우가 있어, Namecard/Profile DOM에서 배경 이미지를 읽어 주입해야 했다.

## 수정 내용
- `skin.html`에서 댓글은 Tistory 기본 치환자인 `[##_comment_group_##]`를 유지했다.
- `styles.css`에서 React 댓글 앱과 구형 `#entry{id}Comment` 구조를 모두 대상으로 잡았다.
- `.tt-list-reply-comment` 기준으로 답글의 시작은 들여쓰기하고, 오른쪽 끝은 부모 댓글과 맞추도록 조정했다.
- 댓글 카드와 답글 카드의 `overflow`와 `z-index`를 보강해 수정/삭제 드롭다운이 카드 아래에 가려지지 않도록 했다.
- 댓글 카드 간 간격을 늘리고, 카드 내부 높이를 줄이되 너무 붙지 않도록 조정했다.
- 댓글 입력창 이름/비밀번호 영역과 textarea 사이 간격을 늘렸다.
- textarea와 contenteditable 입력창에 `resize: vertical`, `overflow: auto`, 고정 `line-height: 21px`를 강제했다.
- contenteditable 내부 `div`, `p`, `span`의 margin/padding/line-height를 재정의해 엔터 후 줄간격이 커지는 문제를 줄였다.
- 다크모드 입력창과 입력 중 생성되는 내부 노드까지 `color`와 `caret-color`를 강제했다.
- `main.js`에 `normalizeLegacyComments()`를 추가해 구형 댓글 카드와 댓글 입력 폼에도 프로필 썸네일을 생성하거나 기존 빈 썸네일에 배경 이미지를 주입하도록 했다.
- 프로필 이미지가 늦게 렌더링되는 경우를 위해 댓글 영역에 `MutationObserver`를 붙여 10초 동안 재동기화한다.
- 댓글 CSS가 `styles.css` 내부 중복 규칙에 계속 밀리는 문제가 있어, 최종 댓글 전용 스타일을 `src/comments-final.css`로 분리하고 `main.js`에서 가장 마지막 CSS로 import했다.
- `comments-final.css`는 댓글 카드 간격, 수정 메뉴 z-index, 답글 폭, 비로그인 폼 간격, textarea/contenteditable 줄간격과 resize를 한 곳에서 최종 결정한다.

## 오늘 확인한 중요한 사실
- 라이브에 올라간 `style.css`와 `script.js`가 로컬 `dist`와 같은 경우도 있었으므로, 문제는 단순 업로드 누락만은 아니었다.
- Chrome AppleScript DOM 접근은 비활성화되어 있었지만, Chrome remote debugging port `9222`를 통해 실제 DOM을 확인할 수 있었다.
- 실제 페이지에서 댓글 DOM이 React 앱으로 보일 때와 구형 Tistory 댓글 마크업으로 보일 때가 달랐다.
- 따라서 댓글 CSS는 한쪽 DOM만 기준으로 작성하면 계속 일부 환경에서 깨진다.

## 검증
- `node --check src/main.js` 통과.
- `npm run build` 통과.
- 빌드 산출물은 `dist/style.css`, `dist/script.js`에 생성됨.

## 남은 리스크
- `src/styles.css`에 댓글 관련 임시 override가 많이 누적되어 있다.
- 단기적으로는 `src/comments-final.css`를 마지막 stylesheet로 import해 막았지만, 장기적으로는 `src/styles.css` 안의 오래된 댓글 override를 제거하는 리팩터링이 필요하다.
- Tistory 댓글 앱은 로그인/비로그인/관리자/게스트/답글 작성 상태마다 DOM이 달라질 수 있어, 실제 라이브에서 각 상태를 다시 확인해야 한다.
- 티스토리에 `dist/style.css`, `dist/script.js`를 다시 업로드하지 않으면 라이브에는 반영되지 않는다.

## 2026-05-17 추가 확인
- 화면 폭이 줄어들 때 답글 카드가 부모 댓글보다 오른쪽으로 튀어나오거나 내부 메타 정보가 세로로 깨지는 문제가 남아 있었다.
- TOC는 스크롤바는 제거됐지만, 기존 `absolute` 부모 안의 `sticky` 구조라 실제 페이지 스크롤을 안정적으로 따라오지 못했다.
- `tt-box-textarea`에 `resize`를 줬지만 실제 사용자가 잡는 요소는 내부 `contenteditable .tt-cmt`라서 높이 조절이 되지 않았다.
- 이름/비밀번호 영역과 댓글 내용 입력창 사이 간격은 `.tt_wrap_write`의 gap과 Tistory 기본 margin이 충돌해 상태별로 다르게 보였다.
- 수정 드롭다운은 메뉴 자체 z-index만 높이고 부모 댓글 카드의 stacking context를 충분히 올리지 않으면 다음 댓글 카드 뒤로 가려졌다.

## 2026-05-17 추가 수정
- 열린 수정 드롭다운이 있는 댓글/답글 카드만 `z-index: 10000`으로 올리고, 메뉴와 버튼은 그보다 높은 레이어로 정리했다.
- 평상시 댓글 카드는 `z-index: auto`로 낮춰 헤더나 다른 floating UI 위로 올라오지 않게 했다.
- `contenteditable .tt-cmt` 자체에 `resize: vertical`, `overflow: auto`, `height: 112px`를 적용해 사용자가 직접 댓글창 높이를 조절할 수 있게 했다.
- `.tt-cmt > div/p/span`에 더 높은 specificity의 최종 규칙을 추가해 엔터 입력 시 생성되는 내부 `div`가 비정상적인 높이를 갖지 않게 했다.
- 닉네임/비밀번호 필드와 내용 입력창 사이 간격은 최종 댓글 레이어에서 `18px` 기준으로 재정의했다.
- 980px 이하에서 댓글/답글 카드의 프로필 크기, 들여쓰기, 오른쪽 패딩, 메타 줄바꿈을 별도 정의해 좁은 화면에서 답글 UI가 깨지지 않도록 했다.
- TOC는 데스크톱에서 `position: fixed`로 바꾸고, 내부 스크롤바는 숨겨 페이지 스크롤을 따라오게 했다. 좁은 화면에서는 숨긴다.
