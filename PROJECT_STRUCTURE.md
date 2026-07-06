# WarSims 專案檔案結構與功能說明

本專案經過模組化整理，將資源與設定檔分離，以利於未來的維護與擴充。

## 目錄結構

```text
/
├── assets/                 # 靜態資源與設定檔統一存放目錄
│   ├── audio/              # 音效與音樂檔
│   │   ├── bgm.mp3         # 戰鬥背景音樂
│   │   ├── hit.mp3         # 一般攻擊受擊音效
│   │   ├── crit.mp3        # 爆擊/屬性克制音效
│   │   ├── die.mp3         # 角色陣亡音效
│   │   └── magic.mp3       # 法師專屬範圍魔法音效 (火焰爆破)
│   └── data/               # 遊戲設定與資料夾
│       └── i18n.js         # 多國語言字典檔
├── js/                     # JS 模組集中目錄
│   ├── app.js              # UI 互動與狀態協調者
│   ├── audio.js            # 音效與背景音樂獨立模組
│   ├── battle.js           # 戰鬥引擎與時間軸獨立模組
│   └── characters.js       # 純粹的角色數值設定檔 (移除 UI 邏輯)
├── index.html              # 遊戲主頁 (穩定版)
├── style.css               # 核心樣式表 (UI、玻璃擬物化風格、側邊欄、動畫特效)
├── Character_Overview.md   # 角色屬性與克制規則速查手冊 (原 Basic.md)
├── Game_Mechanics.md       # 遊戲機制與設定白皮書
└── PROJECT_STRUCTURE.md    # 本專案架構說明文件
```

## 核心檔案功能備註

### `js/characters.js`
**功能**：所有職業（戰士、刺客、弓手、法師）的血量、攻擊力、屬性與索敵優先順序都在此定義。
**維護建議**：若要新增職業或修改數值，只需在此檔案中調整 `CHARACTER_TEMPLATES` 物件即可。網頁加載時會自動讀取並生成對應的 HTML 角色卡片。

### `js/app.js`
**功能**：處理所有互動與介面切換邏輯。
- **拖放邏輯**：處理將 `characters.js` 生成的角色卡片拖曳至九宮格的互動。
- **側邊欄日誌**：處理戰鬥日誌介面的滑出與隱藏。
- **設定與數值面板**：控制各種 Modal 彈出視窗。

### `js/battle.js`
**功能**：獨立的 `BattleEngine` 模組。
- 負責回合制戰鬥結算、尋敵邏輯 (`getTarget`)、傷害計算 (`calcDamage`)。
- 結合了 `async/await` 與 CSS 動畫的觸發（例如一般位移 `.anim-attack-t1`、受擊震動 `.anim-hit`，以及法師專屬的 `.anim-magic-hit` 火焰特效）。

### `js/audio.js`
**功能**：集中管理音樂與音效。
- 負責瀏覽器「首次點擊才可播放音樂」的解鎖邏輯。
- 提供所有模組呼叫 `audio.playSFX()` 與 `audio.playBGM()` 的介面。

### `index.html`
**功能**：建構玻璃擬物化 (Glassmorphism) 的 UI 骨架。移除了過去寫死的卡片程式碼，改由 `<div class="character-pool" id="character-pool-container">` 作為容器，並加入了隱藏式的側邊欄戰鬥日誌設計。

### `style.css`
**功能**：定義所有視覺效果與動畫。
- **玻璃擬物化**：透過 `backdrop-filter: blur(10px)` 實現。
- **戰鬥日誌側邊欄**：透過 `transform: translateX(-100%)` 實現滑動進出的特效。
- **戰鬥動畫**：包含一般的位移、震動，以及法師專屬的範圍火焰爆破特效 (`@keyframes magic-burn`)。
