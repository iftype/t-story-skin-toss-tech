// 비로그인 댓글 입력칸을 토스 테크 블로그처럼 바꾼다.
// - 이름은 "명랑한고릴라" 같은 랜덤 닉네임으로 미리 채우고, "랜덤 변경" 버튼으로 바꿀 수 있다
// - 티스토리가 요구하는 비밀번호는 숨기고 자동으로 채운다(그래서 작성한 댓글은 수정·삭제할 수 없다고 안내)
// - 아바타는 닉네임에 맞춘 이모지
// 입력칸은 티스토리 React 가 관리하므로 값은 React 가 알아채는 방식(native setter + input 이벤트)으로만 넣는다.

const ADJECTIVES = ['명랑한', '느긋한', '수줍은', '용감한', '졸린', '배고픈', '반짝이는', '호기심많은', '다정한', '씩씩한', '엉뚱한', '차분한', '신나는', '포근한', '부지런한', '심심한']
const ANIMALS = ['고릴라', '수달', '펭귄', '판다', '고양이', '강아지', '다람쥐', '거북이', '코알라', '햄스터', '부엉이', '토끼', '알파카', '여우', '고래', '라쿤']
const EMOJIS = { 고릴라: '🦍', 수달: '🦦', 펭귄: '🐧', 판다: '🐼', 고양이: '🐱', 강아지: '🐶', 다람쥐: '🐿️', 거북이: '🐢', 코알라: '🐨', 햄스터: '🐹', 부엉이: '🦉', 토끼: '🐰', 알파카: '🦙', 여우: '🦊', 고래: '🐳', 라쿤: '🦝' }
const NAME_KEY = 'docs-comment-nickname'
const PASS_KEY = 'docs-comment-password'

const pick = (list) => list[Math.floor(Math.random() * list.length)]
const randomNickname = () => `${pick(ADJECTIVES)}${pick(ANIMALS)}`

function storage(key, make) {
  try {
    let value = localStorage.getItem(key)
    if (!value) {
      value = make()
      localStorage.setItem(key, value)
    }
    return value
  } catch (_) {
    return make()
  }
}

function setReactValue(input, value) {
  if (!input || input.value === value) return
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  setter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function emojiFor(name) {
  const animal = ANIMALS.find((a) => name.endsWith(a))
  return animal ? EMOJIS[animal] : '🙂'
}

function enhanceForm(area) {
  const account = area.querySelector('.tt-box-account')
  if (!account) return // 로그인한 사람의 입력칸은 그대로
  const [nameInput, passInput] = account.querySelectorAll('input')
  if (!nameInput || !passInput) return

  area.classList.add('is-guest-compose')

  // 비밀번호: 숨기고 자동으로 채운다
  setReactValue(passInput, storage(PASS_KEY, () => Math.random().toString(36).slice(2, 10)))

  // 이름: 비어 있으면 랜덤 닉네임
  if (!nameInput.value) setReactValue(nameInput, storage(NAME_KEY, randomNickname))

  const thumb = area.querySelector('.tt-box-thumb')
  const syncAvatar = () => { if (thumb) thumb.dataset.emoji = emojiFor(nameInput.value || '') }
  syncAvatar()

  if (!account.querySelector('.docs-nickname-shuffle')) {
    const shuffle = document.createElement('button')
    shuffle.type = 'button'
    shuffle.className = 'docs-nickname-shuffle'
    shuffle.textContent = '랜덤 변경'
    shuffle.addEventListener('click', (e) => {
      e.preventDefault()
      const next = randomNickname()
      try { localStorage.setItem(NAME_KEY, next) } catch (_) {}
      setReactValue(nameInput, next)
      syncAvatar()
    })
    account.appendChild(shuffle)
  }

  if (!nameInput.dataset.composeBound) {
    nameInput.dataset.composeBound = 'true'
    nameInput.addEventListener('input', () => {
      syncAvatar()
      try { if (nameInput.value) localStorage.setItem(NAME_KEY, nameInput.value) } catch (_) {}
    })
  }
}

export function setupGuestCommentCompose() {
  const root = document.querySelector('.docs-comments')
  if (!root) return

  const run = () => root.querySelectorAll('.tt-area-write').forEach((area) => {
    try { enhanceForm(area) } catch (_) { /* 댓글 위젯이 바뀌어도 글 읽기는 막지 않는다 */ }
  })

  // 등록 직전에 한 번 더 채운다(작성 후 React 가 입력칸을 비우는 경우 대비)
  root.addEventListener('pointerdown', (e) => {
    const area = e.target.closest?.('.tt-area-write')
    if (area) enhanceForm(area)
  }, true)
  root.addEventListener('focusin', (e) => {
    const area = e.target.closest?.('.tt-area-write')
    if (area) enhanceForm(area)
  })

  run()
  if (!('MutationObserver' in window)) return
  let timer = null
  new MutationObserver(() => {
    clearTimeout(timer)
    timer = setTimeout(run, 120)
  }).observe(root, { childList: true, subtree: true })
}
