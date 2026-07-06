# UI 模組化技術文件 (UI Documentation)

為了降低 `app.js` 核心邏輯的負擔，我們將所有與介面渲染、語系切換及事件綁定相關的邏輯獨立抽離為 `ui.js` 與 `lang.js`。

## 1. 語系模組 (`LangManager`)
- **檔案**: `lang.js`
- **職責**: 負責管理遊戲內所有顯示字串，提供動態的多國語系切換。
- **變數與方法**:
  - `currentLang`: 目前使用的語系 (例如 `"zh-TW"`, `"en"`)。
  - `setLang(lang)`: 切換語系，並自動呼叫 `updateDOM()`。
  - `get(key, ...args)`: 根據 key 取得對應語系的字串，並支援透過 `{0}`, `{1}` 等佔位符動態帶入變數。
  - `updateDOM()`: 掃描 HTML 中帶有 `data-i18n` 屬性的元素，並將其 `innerHTML` 替換為當前語系的字串。

## 2. 介面模組 (`UIManager`)
- **檔案**: `ui.js`
- **職責**: 封裝所有 DOM 的獲取、設定視窗 (Modal) 的邏輯、音效控制與動畫渲染 API。
- **變數與屬性**:
  - `DOM`: 一個 Object，將畫面上常用的 HTML 元素事先抓取並快取起來 (例如 `gridTeam1`, `btnStart`, `settingsModal` 等)。
  - `audio`: 管理背景音樂與音效的 `<audio>` 標籤以及其當前音量設定。
  - `speedMultiplier`: 戰鬥速度的倍率 (預設為 1.0)。

- **提供給核心系統的 API**:
  - `init()`: 初始化角色池卡片並綁定設定視窗的事件。
  - `renderCharacterPool()`: 根據當前語系，動態生成下方的拖曳角色卡片。
  - `updateSelectionStatus(classKey)`: 更新介面上「目前選擇：XXX」的狀態文字。
  - `playSFX(soundNode)`: 利用 `cloneNode` 技術播放音效，支援高頻率的重疊播放。
  - `playBGM()`: 依據設定音量播放背景音樂。
  - `logMessage(htmlStr)`: 渲染一行文字至戰鬥日誌區塊，並自動將卷軸捲動到底部。
  - `clearLog()`: 清空戰鬥日誌。
  - `createCharacterDOM(charObj)`: 生成角色的視覺元素與血條 DOM 節點。
  - `updateHPBar(hpBar, currentHp, maxHp)`: 根據當前血量比例，動態調整血條寬度與低血量 (紅色) 警告樣式。
  - `showDamageText(targetDom, dmg, isCrit)`: 在受擊目標頭上產生漂浮的傷害數字動畫。
