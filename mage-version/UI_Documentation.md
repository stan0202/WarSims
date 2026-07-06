# WarSims UI 架構與變數說明 (Mage-Version)

本文檔用於記錄 `mage-version` 分支中，有關於 UI 介面（特別是彈出式設定視窗）的功能區塊與對應變數。

## 1. UI 結構與功能區塊

### 1.1 主遊戲畫面 (Main Interface)
- **⚙️ 設定按鈕 (`#btn-settings`)**：位於畫面右上角，點擊後會呼叫 `settings-modal` 顯示設定視窗。
- **角色上場設定 (`#num-chars`)**：設定雙方隊伍的上場人數上限。
- **一鍵隨機佈陣 (`#btn-random`)**：自動隨機將角色填入棋盤。
- **開始戰鬥 (`#btn-start`)**：雙方陣容皆有角色時啟用，點擊後觸發時間軸引擎戰鬥。
- **重置下一局 (`#btn-reset`)**：戰鬥結束後顯示，用於清空棋盤。

### 1.2 設定彈出視窗 (Settings Modal)
採用毛玻璃 (`backdrop-filter`) 效果的全螢幕覆蓋視窗，收納所有非戰鬥流程的設定功能。

| UI 元素 ID | 功能描述 | 對應的 JavaScript 變數/事件 |
| :--- | :--- | :--- |
| `#settings-modal` | 整個彈出視窗的容器，控制顯示/隱藏 (`.hidden`) | `modalSettings` |
| `#lang-select` | 語系下拉選單 (支援 `zh-TW`, `en`) | `onchange="switchLanguage(this.value)"` |
| `#speed-select` | 戰鬥速度選單 (`0.5X`, `1X`, `2X`) | `speedSelect.addEventListener('change')` ➔ `battleSpeed` |
| `#vol-bgm` | 音樂音量滑桿 (`0` ~ `1`) | `volBgmSlider.addEventListener('input')` ➔ `bgmVolume` |
| `#toggle-bgm` | 音樂靜音切換按鈕 | `toggleBgmBtn.addEventListener('click')` ➔ `bgmMuted` |
| `#vol-sfx` | 音效音量滑桿 (`0` ~ `1`) | `volSfxSlider.addEventListener('input')` ➔ `sfxVolume` |
| `#toggle-sfx` | 音效靜音切換按鈕 | `toggleSfxBtn.addEventListener('click')` ➔ `sfxMuted` |
| `#btn-close-settings` | 關閉視窗按鈕 | `btnCloseSettings.addEventListener('click')` |

---

## 2. 核心變數對照表

在 `app.js` 與 `i18n.js` 中，掌管 UI 與環境設定的主要變數如下：

### 環境變數 (Environment Variables)
- `bgmMuted` (Boolean): 背景音樂是否靜音。
- `sfxMuted` (Boolean): 音效是否靜音。
- `bgmVolume` (Float): 音樂音量大小 (預設 `0.25`)。
- `sfxVolume` (Float): 音效音量大小 (預設 `0.25`)。
- `battleSpeed` (Float): 戰鬥播放速度，影響 `sleep` 等待時間 (預設 `1.0`)。
- `currentLang` (String): 當前語系代碼，預設為 `zh-TW`。

### DOM 控制變數 (DOM References)
- `modalSettings` : 指向 `#settings-modal`，利用 `classList.remove('hidden')` 來實現彈出效果。
- `logContent` : 指向 `#log-content`，用於附加 `logMessage` 產生的戰鬥紀錄。
- `selectionStatus` : 指向 `#selection-status`，顯示當下選取準備拖曳的角色名稱。

### 移除的功能 (Deprecated)
- `btnExport` 與 `localStorage` (`jrpg_history`) 已於此版本全面移除，以精簡記憶體佔用。
