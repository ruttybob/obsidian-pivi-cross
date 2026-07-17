# Как инспектировать и редактировать UI Yapi (настройки + чат) агентом с text-only моделью

> Исследование вариантов «рендера меню в браузере» для разработки UI плагина Yapi.
> Ограничение: у разработчика **только text-to-text модель** (без мультимодальности),
> поэтому нужна **текстовая (DOM) репрезентация** элементов, по которой агент
> выбирает узлы и правит `src/`. Скоуп: все меню настроек (Категория B) + рендер чата (Категория A).

---

## TL;DR

1. **Литеральный запрос «открыть UI в браузере Orca через `orca-cli`» невыполним для нативных меню Obsidian.** Встроенный браузер Orca — это изолированный embedded-Chromium, который открывает HTTP-URL и **не может** прицепиться к процессу Obsidian (отдельное Electron-приложение). Настройки Yapi (`Modal`/`Setting`/`Menu`) существуют только внутри Obsidian и нигде больше не рендерятся.
2. **Правильный путь для полной точности (настройки + чат): Chrome DevTools Protocol (CDP) в запущенный Obsidian.** Запустить Obsidian с `--remote-debugging-port=9222` и подключаться Playwright `connectOverCDP` (или готовым `obsidian-devtools` MCP). Это даёт **реальный** DOM, включая `Setting`/`Modal`/`Menu`, и доступ к `app`. Агент получает текстовый a11y/DOM-снапшот и правит исходники.
3. **Для быстрой итерации по чистому DOM (дропдауны, тулбары, рендер чата) и в любимом `orca-cli`-флоу** — отдельный HTML-preview-стенд по HTTP (`orca goto` → `snapshot` → `eval`). Настройки (B) он **не** покрывает.

---

## Вводные и жёсткие ограничения

### 1. UI плагина живёт внутри Electron (Obsidian), а не в браузере

Yapi — Obsidian-плагин. Его интерфейс рендерится **только внутри процесса Obsidian** (Electron = Chromium). Это не веб-страница и не открывается по URL. Подтверждение: Obsidian.app — Electron-приложение (`/Applications/Obsidian.app/Contents/MacOS/Obsidian`, локально версия **1.12.7**).

Две категории UI (см. `AGENTS.md` + сканирование `src/ui`):

- **Категория A — «чистый DOM»**: функции, строящие узлы через `createDiv({cls,text})` + CSS-классы `yapi-*`.
  `src/ui/shared/components/SlashCommandDropdown.ts`, `SelectableDropdown.ts`, `src/ui/shared/mention/MentionDropdownController.ts`, `src/ui/chat/toolbar/*`, `src/ui/chat/tabs/TabBar.ts` (своё меню `renderMenu`), `src/ui/chat/ui/StatusPanel.ts`, рендереры `src/ui/chat/rendering/*`. Эти части рендерятся где угодно при наличии DOM + `styles.css`.
- **Категория B — нативные примитивы Obsidian** (`Menu`, `Modal`, `Setting`, `ButtonComponent`, `Notice` из `'obsidian'`): вся панель настроек `src/ui/settings/**`, `src/ui/shared/modals/*`. Их DOM/CSS рисуются самим Obsidian и **не существуют вне Obsidian**. Мок `tests/__mocks__/obsidian.ts` возвращает `jest.fn()` и DOM реально не строит.

### 2. Браузер Orca (`orca-cli`) — изолированный embedded-Chromium

Из `orca --help` и скилла `orca-cli`: команды `goto --url`, `snapshot`, `eval --expression`, `screenshot`, `click/fill/type`, `wait --selector` работают только во **встроенной вкладке браузера Orca**, привязанной к worktree Orca. Скилл прямо указывает: это не Chrome/Safari и не desktop-UI; для сторонних окон нужен Computer Use.

- `orca snapshot` делает **accessibility-снапшот** активной вкладки и возвращает ссылки `@eN` — это **идеально** для text-only модели (семантическое дерево, а не пиксели).
- `orca eval --expression <js>` выполняет JS **в странице вкладки Orca** (подтверждено `orca eval --help`).
- **Критично:** браузер Orca не может открыть процесс Obsidian и не может прицепиться к чужому Chromium-таргету. Он открывает только HTTP(S)-URL.

Следствие: «нативные меню настроек в браузере Orca» — невозможно в принципе. Нужен мост к **живому** Obsidian.

### 3. CDP — единственный способ достать реальный DOM Obsidian

Electron прокидывает Chromium-флаги, включая `--remote-debugging-port`. Подтверждения:

- Electron docs «Supported Command Line Switches» явно демонстрируют `app.commandLine.appendSwitch('remote-debugging-port', '8315')` — то есть флаг поддерживается и проходит в Chromium. ([electronjs.org/docs/latest/api/command-line-switches](https://www.electronjs.org/docs/latest/api/command-line-switches))
- Electron docs «Debugging the Main Process» — `--inspect`/`--inspect-brk` для главного процесса, `chrome://inspect` для подключения. ([electronjs.org/docs/latest/tutorial/debugging-main-process](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process))
- Сообщество Obsidian подтверждает для самого Obsidian: macOS `open -a Obsidian --args --remote-debugging-port=9222` ([Reddit r/ObsidianMD, Chrome DevTools MCP + Obsidian](https://www.reddit.com/r/ObsidianMD/comments/1qq0ilg/chrome_devtools_mcp_obsidian_unlimited_power)).
- Готовый инструмент `obsidian-devtools` MCP-сервер «auto-launches Obsidian with `--remote-debugging-port=9222`» и экспонирует `obsidian_eval`/`obsidian_inspect_dom`/`obsidian_read_console`. ([lobehub.com/skills/...obsidian-devtools](https://lobehub.com/skills/neversight-skills_feed-obsidian-devtools), исходник github.com/NeverSight/skills_feed)

Playwright подключается к такому эндпоинту через `chromium.connectOverCDP('http://localhost:9222')` (только Chromium-based; заявлен как «lower fidelity», но для DOM/eval/`accessibility.snapshot()` достаточно). ([playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp))

> Эмпирический статус на момент исследования: Obsidian **запущен** (PID активен), но порт 9222 **не слушается** — текущий инстанс стартовал без флага. Чтобы включить, инстанс надо перезапустить с флагом (см. план ниже).

---

## Сравнительная таблица вариантов

| Вариант | Покрытие A (чат/дропдауны) | Покрытие B (настройки/модалки) | Точность | Совместимость с `orca-cli` | Effort | Пригодность для text-only | Вердикт |
|---|---|---|---|---|---|---|---|
| **В1. CDP → Playwright в Obsidian** | ✅ полное | ✅ полное | реальный DOM | ❌ нет (через bash/скрипт) | средний | ✅ `accessibility.snapshot()` текстом | **Рекомендуемый (B+A)** |
| **В2. `obsidian-devtools` MCP** | ✅ полное | ✅ полное | реальный DOM | ❌ нет (MCP-тул) | низкий (готовое) | ✅ `obsidian_inspect_dom` текстом | **Рекомендуемый, если MCP допустим** |
| **В3. Standalone HTML-preview по HTTP + orca** | ✅ хорошее | ❌ нет | приближённый (шим) | ✅ да (`goto/snapshot/eval`) | средний | ✅ `orca snapshot` (a11y-refs) | **Рекомендуемый для A и оркового флоу** |
| **В4. Мост «orca-браузер → CDP-Obsidian»** | ✅ | ✅ | реальный | частично (`eval` в страницу-мост) | высокий | ✅ | Отвергнуть (оверинжиниринг) |
| **В5. `orca computer` (desktop)** | ✅ | ✅ | пиксели/координаты | ✅ | низкий | ❌ координаты, не DOM | Отвергнуть |
| **В6. `orca screenshot` → `visual-agent`** | ✅ | ✅ | пиксели | ✅ | низкий | ⚠️ через визуал-субагента | Дополнение, не основа |
| **В7. `chrome://devtools` / `obsidian://` во вкладке Orca** | ❌ | ❌ | — | — | — | — | Невозможно |

---

## По вариантам

### В1. CDP в Obsidian + Playwright (полная точность, A+B)

**Как работает.** Запускаем Obsidian с `--remote-debugging-port=9222`. Playwright `connectOverCDP` цепляется к эндпоинту, находит страницу с UI Yapi и:
- читает структуру: `const snap = await page.accessibility.snapshot()` → текстовое a11y-дерево (тот же тип данных, что отдаёт `orca snapshot`, удобно для text-only);
- дампает конкретный узел: `await page.evaluate(() => document.querySelector('.yapi-settings-...')?.outerHTML)`;
- дёргает Obsidian API, чтобы открыть нужный экран: `await page.evaluate(() => { app.setting.open(); /* выбрать таб Yapi */ })`;
- при необходимости кликает/вводит через Playwright для интерактивных меню (`Menu`, дропдауны).

**Источники.** Electron `--remote-debugging-port` ([command-line-switches](https://www.electronjs.org/docs/latest/api/command-line-switches)); подтверждение для Obsidian ([Reddit CDP+Obsidian](https://www.reddit.com/r/ObsidianMD/comments/1qq0ilg/chrome_devtools_mcp_obsidian_unlimited_power)); Playwright `connectOverCDP` ([playwright.dev](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp)); Playwright `accessibility.snapshot()` ([playwright.dev/docs/api/class-accessibility](https://playwright.dev/docs/api/class-accessibility)).

**Плюсы.** Реальный DOM обеих категорий; доступ к `app`, `app.plugins`, `app.setting`; можно открывать любую модалку/настройки программно; снапшот — текстовый, идеально для text-only.
**Минусы.** Не использует `orca-cli`-флоу (агент гоняет Playwright-скрипт через bash); нужно перезапускать Obsidian с флагом; `connectOverCDP` официально «lower fidelity».
**Риски/нюансы.** На свежих Chromium Playwright `connectOverCDP` требует, чтобы порт открыт **с запуска** (классический `--remote-debugging-port` — ок; «remote debugging on running browser без рестарта», Chrome M144+, Playwright-ом пока не поддерживается — [issue #40027](https://github.com/microsoft/playwright/issues/40027)). Запускать бинарь напрямую надёжнее, чем `open -a`. При уже запущенном инстансе флаг игнорируется — сначала `Cmd-Q`.

**Конкретные шаги (macOS):**
```bash
# 0. Полностью выйти из Obsidian (Cmd-Q), иначе флаг не применится.
# 1. Запустить с портом отладки напрямую бинарём:
/Applications/Obsidian.app/Contents/MacOS/Obsidian --remote-debugging-port=9222 &
# 2. Проверить, что эндпоинт жив:
curl -s http://localhost:9222/json/version | jq .
# 3. Поставить Playwright (один раз):
npm i -D playwright && npx playwright install chromium
```
Минимальный инспекционный скрипт (`scripts/ui-snap.mjs`):
```js
import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://localhost:9222');
const ctx = browser.contexts()[0];
// найти страницу с Yapi (по URL/view-type или по селектору в DOM)
const page = ctx.pages().find(p => (p.url() || '').includes('obsidian.md'))
  || ctx.pages()[0];
// открыть настройки Yapi через Obsidian API:
await page.evaluate(() => app.setting.open());
// текстовый снимок:
const snap = await page.accessibility.snapshot();
console.log(JSON.stringify(snap, null, 2));
// дамп конкретного блока настроек:
const html = await page.evaluate(() =>
  document.querySelector('[data-yapi-settings], .yapi-settings, .modal-setting')?.outerHTML);
console.log(html);
```

### В2. Готовый `obsidian-devtools` MCP-сервер (быстрее, если допустим MCP)

**Как работает.** Существует готовый CDP-мост для Obsidian с инструментами: `obsidian_launch_debug` (стартует Obsidian с `--remote-debugging-port=9222`), `obsidian_eval` (JS в контексте Obsidian, с ожиданием промисов), `obsidian_inspect_dom` (упрощённый снимок DOM по CSS-селектору), `obsidian_read_console`. По сути это В1, упакованное в MCP, который агент дёргает как тула.

**Источники.** [lobehub.com/skills/...obsidian-devtools](https://lobehub.com/skills/neversight-skills_feed-obsidian-devtools) (SKILL.md + описание тулов); исходник `github.com/NeverSight/skills_feed`.

**Плюсы.** Минимальный effort (всё готово); `obsidian_inspect_dom` сразу даёт текстовый DOM по селектору — ровно то, что нужно text-only агенту; есть `obsidian_read_console` для отладки.
**Минусы.** Это MCP-сервер, его надо где-то поднять и подключить агенту (не внутри `orca-cli`-флоу; это host-level инструмент, не vault-local `.yapi/mcp.json`); сторонний репозиторий — оценить доверие перед запуском.
**Риски/нюансы.** Подходит, если агент умеет MCP-тулы. Для Yapi-агента это не vault-local MCP — нужен host-level доступ.

### В3. Standalone HTML-preview + `orca-cli` (только Категория A, но в любимом флоу)

**Как работает.** Собираем `preview/`: минимальный шим `createEl/createDiv/createSpan` на `HTMLElement.prototype`, бандл рендереров из `src/ui/shared/components` и `src/ui/chat/rendering`, подключаем собранный `styles.css`. Раздаём по HTTP. Дальше — чистый орковый цикл:
```bash
orca goto --url http://localhost:5173/slash.html --json
orca snapshot --json          # a11y-дерево с @eN
orca eval --expression "document.querySelector('.yapi-slash-dropdown').outerHTML" --json
orca click --element @e7 --json
orca snapshot --json
```
**Плюсы.** Использует именно `orca-cli` так, как хочет разработчик; мгновенная итерация без перезагрузки Obsidian; `snapshot` даёт текстовые `@eN`-рефы.
**Минусы.** Покрывает **только чистый DOM** (Категория A) — дропдауны, тулбары, рендер чата. Настройки (`Setting`/`Modal`/`Menu`, Категория B) **не** рендерятся без Obsidian; нужен шим этих примитивов, что дорого и приблизительно. Потребуется шим Obsidian CSS-переменных/токенов темы, иначе стили «поедут».
**Риски/нюансы.** Любой компонент, импортирующий `'obsidian'` (`Menu`/`Modal`/`Setting`/`Notice`), не заведётся без шима этих классов.

### В4. Мост «orca-браузер → CDP-Obsidian» — ОТВЕРГНУТЬ

Идея: локальная HTTP-страница, которую открывает Orca; `orca eval` в неё проксирует вызовы в Obsidian по CDP и возвращает DOM. Технически возможно, но: `@eN`-рефы `orca snapshot` будут указывать на страницу-мост, а не на Obsidian (значит, селекция через `snapshot` бесполезна — работать можно только через `eval` с рукописным JS). Это дублирование В1 с лишним слоем. **Не стоит.**

### Побочно: В6. `orca screenshot` + визуал-субагент

Даже при text-only основной модели доступен субагент `visual-agent` (читает изображения). Можно снять `orca screenshot` (для В3) или Playwright-скриншот (для В1) и отдать визуал-субагенту для описания «что не так с кнопкой». Это **дополнение** к DOM-инспекции, а не замена: текстовый снапшот точнее для выбора элемента, скриншот — для визуальных артефактов (отступы, наложение, цвета).

### Отвергнутые

- **`orca computer` (desktop control)** — координатно-пиксельный доступ к окнам. Для text-only модели и DOM-селекции непригоден (нет селекторов/рефов).
- **`orca emulator`** — iOS-симулятор, к делу не относится.
- **`chrome://devtools` / `obsidian://` во вкладке Orca** — embedded-браузер такие схемы не открывает осмысленно; инспекция чужого процесса через них невозможна.

---

## Рекомендация

Для скоупа «настройки (B) + чат (A)»:

1. **Основа — В1 (CDP + Playwright)** или **В2 (`obsidian-devtools` MCP)**: только так видны реальные `Setting`/`Modal`/`Menu` настроек. Выбор между ними — вопрос, где вы хотите держать инструмент (bash-скрипт vs MCP-сервер). Начать проще с В1 — минимум сторонних зависимостей.
2. **Для быстрого цикла по чату/дропдаунам (A) добавьте В3** — HTML-preview по HTTP + `orca goto/snapshot/eval`. Это единственный вариант, который даёт именно `orca-cli`-флоу с `@eN`-рефами, и он мгновенный.
3. **Не делайте В4** и не пытайтесь открыть Obsidian внутри браузера Orca — физически невозможно.

**Пошаговый старт (рекомендуемая связка В1 для всей картины):**
```bash
# 1. Выйти из Obsidian (Cmd-Q).
# 2. Поднять Obsidian с CDP:
/Applications/Obsidian.app/Contents/MacOS/Obsidian --remote-debugging-port=9222 &
curl -s http://localhost:9222/json/version | jq .   # проверка

# 3. В репо поставить Playwright:
npm i -D playwright && npx playwright install chromium

# 4. Инспектировать (скелет scripts/ui-snap.mjs — см. В1):
node scripts/ui-snap.mjs
#   - открыть настройки Yapi, снять accessibility.snapshot(), dumps нужных селекторов.
```
Агент читает текстовый снимок → находит нужный селектор/узел → правит `src/ui/**` или `src/styles/**` → `npm run build && obsidian plugin:reload id=yapi` → повторный снимок подтверждает изменение.

**Что проигрывает в этой связке:** нет родного `orca snapshot @eN`-флоу по живому Obsidian; итерация по настройкам требует перезапуска Obsidian с флагом (один раз за сессию).

---

## Заметка про `visual-agent`

`orca screenshot` (В3) и Playwright `page.screenshot()` (В1) отдают PNG. При text-only основной модели этот PNG можно передать субагенту `visual-agent` — он опишет визуальную проблему (кнопка наезжает, неправильный отступ). Текстовый DOM-снапшот при этом остаётся основным средством **выбора** элемента; скриншот — средством **диагностики** визуальных багов.

---

## Источники

- Electron, «Supported Command Line Switches» — `--remote-debugging-port`, `--inspect`. https://www.electronjs.org/docs/latest/api/command-line-switches
- Electron, «Debugging the Main Process» — V8 inspector, `chrome://inspect`. https://www.electronjs.org/docs/latest/tutorial/debugging-main-process
- Playwright, `BrowserType.connectOverCDP` — подключение к Chromium по CDP. https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp
- Playwright, `Accessibility.snapshot()` — текстовое a11y-дерево страницы. https://playwright.dev/docs/api/class-accessibility
- Playwright issue #40027 — ограничения remote-debugging на уже запущенном Chrome M144+. https://github.com/microsoft/playwright/issues/40027
- Reddit r/ObsidianMD, «Chrome DevTools MCP + Obsidian» — `open -a Obsidian --args --remote-debugging-port=9222`. https://www.reddit.com/r/ObsidianMD/comments/1qq0ilg/chrome_devtools_mcp_obsidian_unlimited_power
- LobeHub, навык `obsidian-devtools` — готовый CDP-MCP для Obsidian (`obsidian_eval`, `obsidian_inspect_dom`, `obsidian_read_console`). https://lobehub.com/skills/neversight-skills_feed-obsidian-devtools
- Скилл `orca-cli` (локально) + `orca --help` / `orca snapshot --help` / `orca eval --help` — встроенный браузер Orca, accessibility-снапшот `@eN`, `eval` в страницу, область действия (worktree-вкладки).
- Сканирование `src/ui/**`, `AGENTS.md` — категории UI (чистый DOM vs нативные примитивы Obsidian) и структура `src/styles/**`.

---

## Открытые вопросы / проверить руками

1. **Эмпирически подтвердить CDP на конкретном Obsidian 1.12.7** на этой машине: выйти из Obsidian, запустить с `--remote-debugging-port=9222`, `curl http://localhost:9222/json/version`. (Сейчас инстанс запущен **без** флага — порт не слушается.)
2. **Надёжность `connectOverCDP` к Electron-Obsidian**: воспроизвести `scripts/ui-snap.mjs`, проверить, что `accessibility.snapshot()` и `page.evaluate` доходят до DOM плагина и `app.setting.open()` открывает настройки.
3. **Доверие к `obsidian-devtools` MCP** (вариант В2): сторонний репозиторий — проверить источник перед установкой.
4. **Шим темы для В3**: какие именно Obsidian CSS-переменные нужны чистому DOM, чтобы стили совпадали с Obsidian (снять выгрузку CSS-переменных через DevTools).
5. Решить, куда встроить инспекционный скрипт (`scripts/ui-snap.mjs`) и нужен ли он как `npm run`-скрипт или как одноразовый инструмент.
