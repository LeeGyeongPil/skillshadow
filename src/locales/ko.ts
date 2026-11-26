// 한국어 메시지 표. en.ts 와 키가 완전히 같아야 한다(타입으로 강제, 테스트로 확인).
import type { MessageKey } from "./en.js";

export const ko: Record<MessageKey, string> = {
  // ---- 일반 ----
  "rules.line": "기준 규칙: {host} {version} (문서 조회일 {fetched}), 세션: 로컬 터미널",
  "demo.banner": "연습용 픽스처 - 내 파일이 아님 (목 모드: 동봉된 샘플 파일에 실제 규칙 엔진을 돌립니다)",
  "col.status": "상태",
  "col.name": "이름",
  "col.scope": "범위",
  "col.type": "종류",
  "col.detail": "설명",
  "summary.line": "항목 {total}개: {counts}",
  "summary.line.one": "항목 {total}개: {counts}",
  "summary.failing": "--fail-on ({failOn}) 에 걸린 항목 {failing}개; 종료 코드 1.",
  "summary.clean": "--fail-on ({failOn}) 에 걸린 항목이 없습니다.",
  "summary.empty": "스킬·명령을 찾지 못했습니다. --home, --project, --config-dir-name 을 확인하세요.",
  "failon.none": "none",

  // ---- 판정 메시지 ----
  "msg.none": "충돌 없음",
  "msg.removed-builtin": "제거된 내장 명령과 같은 이름이라 충돌할 대상이 없음",
  "msg.plugin-bare-free": "/{name} 로 호출 가능, 접두 없는 /{bare} 도 비어 있음",
  "msg.reserved-bundled": "번들 /{name} 을 쓸 수 있는 환경에서는 번들이 우선하며 내 것은 로드되지 않음",
  "msg.reserved-folder": "claude.ai 동기화 스킬용 예약 이름이라 폴더를 건너뜀",
  "msg.reserved-namespace": "예약된 네임스페이스라 로드되지 않음",
  "msg.reserved-conditional": "컴퓨터 사용을 켠 Mac 에서는 예약 이름이라 로드되지 않을 수 있음",
  "msg.skill-over-command": "같은 이름의 스킬 {winner} 이(가) 이 명령 파일보다 우선함",
  "msg.skill-not-invocable": "스킬 {winner} 이(가) 우선하는데 user-invocable: false 라서 /{name} 을 입력해도 아무것도 실행되지 않음",
  "msg.higher-scope": "{winnerScope} {winner} 의 우선순위가 더 높음",
  "msg.replaces-builtin.noalias": "로컬 터미널 세션에서 {kind} /{name} 을(를) 대체함",
  "msg.replaces-builtin": "로컬 터미널 세션에서 {kind} /{name} 을(를) 대체함; 별칭 {aliases} 은(는) 여전히 내장으로 감",
  "msg.builtin-alias": "/{target} 의 내장 별칭; 문서는 별칭이 대체되지 않는다고 하나 이슈 #61857 은 명령 파일이 별칭을 가렸다고 보고함",
  "msg.builtin-alias.skill": "/{target} 의 내장 별칭; 문서는 별칭이 대체되지 않는다고 하나 같은 이름의 명령 파일이 별칭을 가렸다는 보고가 있어 스킬도 영향받을 수 있음",
  "msg.same-scope-duplicate": "같은 범위({scope})에 같은 이름의 항목이 더 있음 ({winner}); 문서에 어느 쪽이 이기는지 없음",
  "msg.plugin-bare-taken": "접두 없는 /{bare} 은(는) {kind} 이(가) 사용 중; /{name} 으로 호출",

  // ---- 고치는 방법 (explain) ----
  "fix.none": "",
  "fix.removed-builtin": "",
  "fix.plugin-bare-free": "",
  "fix.reserved-bundled": "스킬 폴더 이름(과 name: 필드)을 다른 이름으로 바꾸세요.",
  "fix.reserved-folder": "스킬 폴더 이름(과 name: 필드)을 다른 이름으로 바꾸세요.",
  "fix.reserved-namespace": "스킬 폴더 이름(과 name: 필드)을 다른 이름으로 바꾸세요.",
  "fix.reserved-conditional": "Mac 에서 컴퓨터 사용을 쓴다면 이름을 바꾸세요.",
  "fix.skill-over-command": "둘 중 하나를 지우거나 이름을 바꾸세요.",
  "fix.skill-not-invocable": "스킬에서 user-invocable: false 를 지우거나 명령 파일 이름을 바꾸세요.",
  "fix.higher-scope": "둘 다 필요하면 하나의 이름을 바꾸세요. 높은 범위가 항상 이깁니다.",
  "fix.replaces-builtin": "내장 명령을 일부러 대체한 것이면 할 일이 없습니다. 아니라면 스킬 이름을 바꾸세요.",
  "fix.builtin-alias": "안전하게 이름을 바꾸거나, Claude Code 에서 /{name} 을 실행해 어느 쪽이 응답하는지 확인하세요.",
  "fix.same-scope-duplicate": "하나만 남기세요.",
  "fix.plugin-bare-taken": "접두를 붙여 /{name} 으로 호출하세요.",

  // ---- explain 단계 ----
  "step.reserved-miss": "/{name} 은(는) 예약 이름인가? 아니오.",
  "step.reserved-hit": "/{name} 은(는) 예약 이름인가? 예 ({effect}). {note}",
  "step.reserved-conditional": "/{name} 은(는) 예약 이름인가? 일부 환경에서만. {note}",
  "step.skill-vs-command-miss": "같은 이름의 스킬이 있는가? 아니오.",
  "step.skill-beats-command": "같은 이름의 스킬이 있음 ({winner}); 스킬이 명령 파일보다 우선합니다.",
  "step.skill-blocks-command": "같은 이름의 스킬이 있고 ({winner}) user-invocable: false 이므로 /{name} 은 아무것도 실행하지 않습니다 (이슈 #29040).",
  "step.scope-miss": "더 높은 범위에 같은 이름의 항목이 있는가? 아니오.",
  "step.scope-hit": "{winnerScope} 범위에 같은 이름의 항목이 있음 ({winner}); {winnerScope} 이(가) {scope} 보다 우선합니다.",
  "step.scope-duplicate": "같은 범위({scope})에 같은 이름의 항목이 더 있음 ({winner}); 문서는 어느 쪽이 이기는지 정하지 않았습니다.",
  "step.builtin-hit": "/{name} 은(는) Claude Code {kind} 인가? 예; 같은 이름의 내 스킬이 로컬 터미널 세션에서 대체합니다.",
  "step.builtin-aliases": "별칭은 대체되지 않습니다: 별칭 {aliases} 은(는) 여전히 내장으로 갑니다.",
  "step.builtin-no-aliases": "신경 쓸 별칭이 없습니다.",
  "step.builtin-alias": "/{name} 은(는) 내장인가? 예, /{target} 의 별칭입니다.",
  "step.builtin-removed": "/{name} 은(는) 내장인가? 제거되었으므로 막는 것이 없습니다.",
  "step.builtin-miss": "/{name} 은(는) 내장 명령·번들 스킬·별칭인가? 아니오. 막는 것이 없습니다.",
  "step.plugin-namespace": "플러그인 항목은 접두를 붙여 항상 호출할 수 있습니다: /{name}.",
  "step.plugin-bare-builtin": "접두 없는 /{bare} 은(는) 내장 ({kind}) 이므로 내장이 이름을 유지합니다.",
  "step.plugin-bare-local": "접두 없는 /{bare} 은(는) 내 항목 {winner} 이(가) 사용 중입니다.",
  "step.plugin-bare-free": "접두 없는 /{bare} 이(가) 비어 있어 접두 없이도 호출됩니다.",

  // ---- explain 틀 ----
  "explain.title": "/{name} - {scope} {type}: {path}",
  "explain.verdict": "판정: {status} - {message}",
  "explain.fix": "고치는 방법: {fix}",
  "explain.notfound": "/{name} 은(는) 내 스킬·명령에서 찾을 수 없습니다 (not found).",
  "explain.builtin-only": "/{name} 은(는) Claude Code {kind} ({version}) 입니다; 같은 이름의 내 스킬·명령은 없습니다.",
  "explain.builtin-aliases": "이것을 실행하는 별칭: {aliases}",
  "explain.alias-of": "/{name} 은(는) /{target} 의 별칭입니다.",
  "explain.reserved": "/{name} 은(는) 예약 이름 ({effect}) 입니다: 이 이름으로 만든 스킬은 로드되지 않습니다.",

  // ---- 오류 ----
  "err.prefix": "오류",
  "warn.prefix": "경고",
  "err.usage": "{detail}. --help 로 옵션을 확인하세요.",
  "err.no-command": "명령이 없습니다. `check` 또는 `explain <이름>` 을 쓰세요 (--help 참고).",
  "err.unknown-command": "알 수 없는 명령 \"{command}\". `check` 또는 `explain <이름>` 을 쓰세요.",
  "err.explain-name": "`explain` 에는 이름이 필요합니다. 예: skillshadow explain ship",
  "err.invalid-lang": "--lang 값 \"{value}\" 이(가) 잘못되었습니다. en 또는 ko 를 쓰세요.",
  "err.invalid-fail-on": "--fail-on 값 \"{value}\" 이(가) 잘못되었습니다. none 또는 쉼표로 구분한 목록({allowed})을 쓰세요.",
  "err.path-missing": "{option} 폴더를 찾을 수 없습니다: {path}. 존재하는 폴더를 지정하세요.",
  "err.unknown-option": "알 수 없는 옵션입니다: {option}. --help 로 옵션을 확인하세요.",
  "err.option-value": "{option} 옵션에는 값이 필요합니다. --help 로 옵션을 확인하세요.",
  "err.option-no-value": "{option} 옵션은 값을 받지 않습니다. --help 로 옵션을 확인하세요.",
  "err.scan-read": "{file} 을(를) 읽을 수 없습니다: {code}. 권한을 확인하거나 지우세요. 이 파일은 건너뜁니다.",
  "err.scan-read-dir": "{file} 을(를) 읽을 수 없습니다: {code}. 파일이 아니라 폴더라서 건너뜁니다.",
  "err.snapshot": "스냅숏 형식이 잘못되었습니다 (invalid snapshot) {file}: {detail}",

  // ---- 도움말 ----
  "help.text": `skillshadow - 내 Claude Code 스킬·슬래시 명령 중 실제로 동작하지 않는 것을 찾아 줍니다

사용법:
  skillshadow check [옵션]             가진 스킬과 명령 파일을 모두 판정
  skillshadow explain <이름> [옵션]    한 이름의 해석 과정을 단계별로 표시
  skillshadow check --demo             동봉된 연습용 픽스처로 체험

옵션:
  --project <dir>          프로젝트 시작 폴더 (기본: 현재 폴더)
  --home <dir>             개인 설정 폴더의 부모 (기본: 홈 폴더)
  --user-dir <dir>         개인 설정 폴더 자체 (기본: $CLAUDE_CONFIG_DIR 또는 ~/.claude)
  --managed-dir <dir>      관리(엔터프라이즈) 폴더 (skills/, commands/ 포함)
  --plugin-dir <dir>       포함할 플러그인 폴더 (여러 번 지정 가능)
  --config-dir-name <n>    홈·프로젝트 안의 설정 폴더 이름 (기본: .claude)
  --builtins <file>        동봉 스냅숏 대신 이 내장 이름 스냅숏 사용
  --json                   표 대신 JSON 출력 (check 만)
  --fail-on <목록|none>    check 가 종료 코드 1 을 내는 상태
                           (기본: not-loaded,shadowed,unreachable)
  --demo                   내 파일 대신 동봉된 연습용 픽스처 사용
  --lang <en|ko>           출력 언어 (또는 SKILLSHADOW_LANG, LC_ALL, LANG)
  -h, --help               이 도움말
  -v, --version            버전 표시

상태: ok, overrides, shadowed, not-loaded, unreachable, ambiguous, namespaced-only
종료 코드: 0 고칠 것 없음, 1 --fail-on 에 걸린 항목 있음, 2 사용 오류
`,
  "version.line": "skillshadow {version}",
};
