const LANG_DICT = {
    "zh-TW": {
        "title": "聖焰與暗影的交鋒",
        "btn_settings": "⚙️ 設定",
        "num_chars_label": "上場人數 (2~5):",
        "btn_random": "🎲 一鍵隨機佈陣",
        "btn_start": "⚔️ 開始戰鬥",
        "btn_reset": "🔄 重置下一局",
        "legend_warrior": "🛡️ 戰士 剋 ⚔️ 刺客",
        "legend_assassin": "⚔️ 刺客 剋 🏹 弓手",
        "legend_archer": "🏹 弓手 剋 🛡️ 戰士",
        "team1_name": "玩家 1 (光之陣營)",
        "team2_name": "玩家 2 (闇之陣營)",
        "instruction_drag": "請將下方角色「拖曳」至棋盤空格，或是點擊後再點擊棋盤",
        "status_selected": "目前選擇：",
        "status_none": "無",
        "class_warrior": "戰士",
        "class_assassin": "刺客",
        "class_archer": "弓手",
        "pref_front": "優先: 前排",
        "pref_back": "優先: 後排",
        "log_title": "📜 戰鬥日誌",
        
        "settings_title": "⚙️ 遊戲設定",
        "setting_language": "語言 (Language)",
        "setting_speed": "戰鬥速度",
        "setting_bgm": "音樂音量 (BGM)",
        "setting_sfx": "音效音量 (SFX)",
        "btn_close": "關閉",

        "msg_max_limit": "玩家 {0} 已經達到人數上限 ({1}人)！",
        "msg_random_done": "🎲 已為雙方隨機生成陣容！",
        "msg_battle_start": "⚔️ <b>戰鬥開始！</b>",
        "msg_turn": "--- 回合 {0} ---",
        "msg_attack": "[玩家 {0}] {1}{2} 攻擊 [玩家 {3}] {4}{5}{6} 造成 {7} 傷害。",
        "msg_crit": "，屬性克制！",
        "msg_normal": "。",
        "msg_death": "💀 {0}{1} 陣亡！",
        "msg_winner": "🏆 <b>戰鬥結束！獲勝者是：{0}！</b>",
        "winner_tie": "平手",
        "winner_p1": "玩家 1",
        "winner_p2": "玩家 2",
        "click_to_place": " (點擊棋盤放置)"
    },
    "en": {
        "title": "Clash of Light and Shadow",
        "btn_settings": "⚙️ Settings",
        "num_chars_label": "Team Size (2~5):",
        "btn_random": "🎲 Randomize",
        "btn_start": "⚔️ Start Battle",
        "btn_reset": "🔄 Reset",
        "legend_warrior": "🛡️ Warrior > ⚔️ Assassin",
        "legend_assassin": "⚔️ Assassin > 🏹 Archer",
        "legend_archer": "🏹 Archer > 🛡️ Warrior",
        "team1_name": "Player 1 (Light)",
        "team2_name": "Player 2 (Shadow)",
        "instruction_drag": "Drag characters to the grid, or click card then click cell",
        "status_selected": "Selected: ",
        "status_none": "None",
        "class_warrior": "Warrior",
        "class_assassin": "Assassin",
        "class_archer": "Archer",
        "pref_front": "Pref: Front",
        "pref_back": "Pref: Back",
        "log_title": "📜 Battle Log",
        
        "settings_title": "⚙️ Settings",
        "setting_language": "Language (語言)",
        "setting_speed": "Battle Speed",
        "setting_bgm": "Music Vol (BGM)",
        "setting_sfx": "SFX Vol",
        "btn_close": "Close",

        "msg_max_limit": "Player {0} reached size limit ({1})!",
        "msg_random_done": "🎲 Randomized formations!",
        "msg_battle_start": "⚔️ <b>Battle Start!</b>",
        "msg_turn": "--- Turn {0} ---",
        "msg_attack": "[P{0}] {1}{2} attacks [P{3}] {4}{5}{6} for {7} DMG.",
        "msg_crit": ", Critical Hit!",
        "msg_normal": ".",
        "msg_death": "💀 {0}{1} died!",
        "msg_winner": "🏆 <b>Battle Over! Winner: {0}!</b>",
        "winner_tie": "Draw",
        "winner_p1": "Player 1",
        "winner_p2": "Player 2",
        "click_to_place": " (Click cell to place)"
    }
};

window.LangManager = {
    currentLang: "zh-TW",
    
    setLang: function(lang) {
        if(LANG_DICT[lang]) {
            this.currentLang = lang;
            this.updateDOM();
        }
    },
    
    get: function(key, ...args) {
        let str = LANG_DICT[this.currentLang][key] || key;
        for (let i = 0; i < args.length; i++) {
            str = str.replace(`{${i}}`, args[i]);
        }
        return str;
    },
    
    updateDOM: function() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (LANG_DICT[this.currentLang][key]) {
                el.innerHTML = LANG_DICT[this.currentLang][key];
            }
        });
    }
};
