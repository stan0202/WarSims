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
│       └── characters.js   # 角色數值設定檔 (包含動態產生角色卡片的邏輯)
├── mage-version/           # 法師測試版獨立目錄 (可作為分支測試用環境)
│   ├── index.html          # 測試版主頁 (路徑指向父目錄的 assets)
│   ├── app.js              # 測試版主邏輯
│   └── style.css           # 測試版樣式表
├── modular-version/        # 模組化重構版獨立目錄
│   ├── index.html          
│   ├── style.css           
│   ├── app.js              # UI 互動與狀態協調者
│   ├── audio.js            # 音效與背景音樂獨立模組
│   ├── battle.js           # 戰鬥引擎與時間軸獨立模組
│   └── characters.js       # 純粹的角色數值設定檔 (移除 UI 邏輯)
├── index.html              # 遊戲主頁 (穩定版)
├── app.js                  # 遊戲主邏輯腳本 (核心對戰引擎、UI互動)
├── style.css               # 核心樣式表 (UI、玻璃擬物化風格、動畫特效)
└── PROJECT_STRUCTURE.md    # 本專案架構說明文件
```

## 核心檔案功能備註

### `assets/data/characters.js`
**功能**：所有職業（戰士、刺客、弓手、法師）的血量、攻擊力、屬性與索敵優先順序都在此定義。
**維護建議**：若要新增職業或修改數值，只需在此檔案中調整 `CHARACTER_TEMPLATES` 物件即可。網頁加載時會自動讀取並生成對應的 HTML 角色卡片。

### `app.js`
**功能**：處理所有互動與遊戲規則。
- **拖放邏輯**：處理將 `characters.js` 生成的角色卡片拖曳至九宮格的互動。
- **戰鬥引擎**：回合制戰鬥結算、尋敵邏輯 (`getTarget`)、傷害計算 (`calcDamage`)。
- **動畫與音效聯動**：法師 AOE 攻擊時會觸發專屬的 `.anim-magic-hit` 綁定火焰濾鏡與 `magic.mp3` 音效。

### `index.html`
**功能**：建構玻璃擬物化 (Glassmorphism) 的 UI 骨架。移除了過去寫死的卡片程式碼，改由 `<div class="character-pool" id="character-pool-container">` 作為容器，提升了版面整潔度。

### `style.css`
**功能**：定義所有視覺效果與動畫。
- **玻璃擬物化**：透過 `backdrop-filter: blur(10px)` 實現。
- **戰鬥動畫**：包含一般的位移 (`anim-attack-t1`)、震動 (`anim-hit`) 以及法師專屬的範圍火焰爆破特效 (`@keyframes magic-burn`)。
