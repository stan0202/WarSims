const TEMPLATES = {
    "Warrior": { classKey: "class_warrior", icon: "🛡️", hp: 120, atk: 20, element: "石頭", prefKey: "pref_front" },
    "Assassin": { classKey: "class_assassin", icon: "⚔️", hp: 80, atk: 30, element: "剪刀", prefKey: "pref_back" },
    "Archer": { classKey: "class_archer", icon: "🏹", hp: 100, atk: 25, element: "布", prefKey: "pref_front" }
};

window.UIManager = {
    audio: {
        bgm: document.getElementById('bgm-audio'),
        hit: document.getElementById('hit-audio'),
        crit: document.getElementById('crit-audio'),
        die: document.getElementById('die-audio'),
        bgmVolume: 0.25,
        sfxVolume: 0.25
    },
    
    speedMultiplier: 1.0,

    DOM: {
        gridTeam1: document.getElementById('grid-team1'),
        gridTeam2: document.getElementById('grid-team2'),
        logContent: document.getElementById('log-content'),
        btnStart: document.getElementById('btn-start'),
        btnRandom: document.getElementById('btn-random'),
        btnReset: document.getElementById('btn-reset'),
        inputNumChars: document.getElementById('num-chars'),
        selectionStatus: document.getElementById('selection-status'),
        charPool: document.getElementById('character-pool'),
        settingsModal: document.getElementById('settings-modal'),
        btnSettings: document.getElementById('btn-settings'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        selectLang: document.getElementById('select-lang'),
        selectSpeed: document.getElementById('select-speed'),
        volBgm: document.getElementById('vol-bgm'),
        volSfx: document.getElementById('vol-sfx'),
        valBgm: document.getElementById('val-bgm'),
        valSfx: document.getElementById('val-sfx')
    },

    init: function() {
        this.renderCharacterPool();
        this.bindSettingsEvents();
        LangManager.updateDOM(); // 初始語言渲染
    },

    renderCharacterPool: function() {
        this.DOM.charPool.innerHTML = '';
        Object.keys(TEMPLATES).forEach(key => {
            const tpl = TEMPLATES[key];
            const card = document.createElement('div');
            card.className = 'char-card';
            card.dataset.class = key;
            card.draggable = true;
            
            card.innerHTML = `
                <div class="icon">${tpl.icon}</div>
                <div class="info">
                    <strong data-i18n="${tpl.classKey}">${LangManager.get(tpl.classKey)}</strong>
                    <span>HP:${tpl.hp} | ATK:${tpl.atk}</span>
                    <span data-i18n="${tpl.prefKey}">${LangManager.get(tpl.prefKey)}</span>
                </div>
            `;
            this.DOM.charPool.appendChild(card);
        });
    },

    bindSettingsEvents: function() {
        this.DOM.btnSettings.addEventListener('click', () => {
            this.DOM.settingsModal.classList.remove('hidden');
        });
        
        this.DOM.btnCloseSettings.addEventListener('click', () => {
            this.DOM.settingsModal.classList.add('hidden');
        });

        this.DOM.selectLang.addEventListener('change', (e) => {
            LangManager.setLang(e.target.value);
            this.renderCharacterPool(); // 更新卡片文字
            // 通知 app.js 重新綁定或更新選擇狀態
            if(window.App && window.App.selectedClassForPlacement) {
                this.updateSelectionStatus(window.App.selectedClassForPlacement);
            } else {
                this.DOM.selectionStatus.innerText = LangManager.get("status_none");
            }
        });

        this.DOM.selectSpeed.addEventListener('change', (e) => {
            this.speedMultiplier = parseFloat(e.target.value);
        });

        this.DOM.volBgm.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.audio.bgmVolume = val;
            if(this.audio.bgm) this.audio.bgm.volume = val;
            this.DOM.valBgm.innerText = Math.round(val * 100) + '%';
        });

        this.DOM.volSfx.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.audio.sfxVolume = val;
            this.DOM.valSfx.innerText = Math.round(val * 100) + '%';
        });
    },

    updateSelectionStatus: function(classKey) {
        if (!classKey) {
            this.DOM.selectionStatus.innerText = LangManager.get("status_none");
            return;
        }
        const name = LangManager.get(TEMPLATES[classKey].classKey);
        this.DOM.selectionStatus.innerText = name + LangManager.get("click_to_place");
    },

    playSFX: function(soundNode) {
        if (!soundNode || this.audio.sfxVolume === 0) return;
        const clone = soundNode.cloneNode();
        clone.volume = this.audio.sfxVolume;
        clone.play().catch(() => {});
    },

    playBGM: function() {
        if (!this.audio.bgm || this.audio.bgmVolume === 0) return;
        this.audio.bgm.volume = this.audio.bgmVolume;
        this.audio.bgm.play().catch(() => {});
    },

    logMessage: function(htmlStr) {
        const p = document.createElement('div');
        p.className = 'log-entry';
        p.innerHTML = htmlStr;
        this.DOM.logContent.appendChild(p);
        this.DOM.logContent.scrollTop = this.DOM.logContent.scrollHeight;
    },

    clearLog: function() {
        this.DOM.logContent.innerHTML = '';
    },

    createCharacterDOM: function(charObj) {
        const charDom = document.createElement('div');
        charDom.className = 'character';
        charDom.id = charObj.id;
        charDom.innerText = charObj.icon;
        charDom.draggable = true;

        const hpContainer = document.createElement('div');
        hpContainer.className = 'hp-bar-container';
        const hpBar = document.createElement('div');
        hpBar.className = 'hp-bar';
        hpContainer.appendChild(hpBar);
        charDom.appendChild(hpContainer);

        return { charDom, hpBar };
    },

    updateHPBar: function(hpBar, currentHp, maxHp) {
        const hpPercent = (currentHp / maxHp) * 100;
        hpBar.style.width = `${hpPercent}%`;
        if(hpPercent < 30) {
            hpBar.classList.add('low');
        } else {
            hpBar.classList.remove('low');
        }
    },

    showDamageText: function(targetDom, dmg, isCrit) {
        const dmgText = document.createElement('div');
        dmgText.className = `damage-text ${isCrit ? 'crit' : ''}`;
        dmgText.innerText = `-${dmg}`;
        targetDom.parentElement.appendChild(dmgText);
        setTimeout(() => dmgText.remove(), 1000);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    UIManager.init();
});
