# ☁️ Oracle Cloud SSH 접속 가이드

오라클 클라우드 서버에 간편하게 접속하고 동료와 공유하기 위한 마크다운 가이드입니다.

---

## 📌 접속 기본 정보
*   **서버 IP:** `152.69.232.170`
*   **접속 계정:** `ubuntu`
*   **사용하는 비밀키:** `oracke.key` (내 맥의 `~/.ssh/oracke.key`에 위치)

---

## 💻 1. 내가 접속할 때 (Host)
현재 맥북에 접속 구성이 모두 설정되어 있어 터미널창에 한 줄만 치면 바로 자동 접속됩니다.
```bash
ssh oracle
```

---

## 👥 2. 상대방이 접속하게 할 때 (Guest)

상황에 맞게 **[옵션 A]** 또는 **[옵션 B]** 중 하나를 선택해 진행하세요.

### [옵션 A] 상대방의 SSH 키를 서버에 등록해 주는 방식 (안전함 🔒)
1. 상대방 컴퓨터의 공개키(`~/.ssh/id_rsa.pub` 등의 텍스트)를 복사해서 받습니다.
2. 내가 `ssh oracle`로 서버에 로그인한 뒤, 아래 명령어로 상대방 공개키를 추가합니다.
   ```bash
   echo "상대방의_공개키_텍스트_붙여넣기" >> ~/.ssh/authorized_keys
   ```
3. 상대방은 본인 컴퓨터의 `~/.ssh/config` 파일에 아래 설정을 붙여넣습니다.
   ```text
   Host oracle-shared
     HostName 152.69.232.170
     User ubuntu
   ```
4. 상대방은 터미널에 아래 명령어를 쳐서 접속합니다.
   ```bash
   ssh oracle-shared
   ```

---

### [옵션 B] 내 비밀키(`oracke.key`)를 직접 파일로 전달하는 방식 (간편함 ⚡)
1. 내 맥북의 `~/.ssh/oracke.key` 비밀키 파일을 상대방에게 직접 전달합니다.
2. 상대방은 받은 `oracke.key` 파일을 본인의 `~/.ssh/` 폴더에 넣고 아래 권한 설정 명령어를 실행합니다.
   ```bash
   chmod 600 ~/.ssh/oracke.key
   ```
3. 상대방은 본인 컴퓨터의 `~/.ssh/config` 파일에 아래 설정을 붙여넣습니다.
   ```text
   Host oracle-shared
     HostName 152.69.232.170
     User ubuntu
     IdentityFile ~/.ssh/oracke.key
   ```
4. 상대방은 터미널에 아래 명령어를 쳐서 즉시 접속합니다.
   ```bash
   ssh oracle-shared
   ```
