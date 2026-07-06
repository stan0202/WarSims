// 角色設定已移至 assets/data/characters.js
function renderCharacterPool(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const key in CHARACTER_TEMPLATES) {
        const char = CHARACTER_TEMPLATES[key];
        const card = document.createElement('div');
        card.className = 'char-card';
        card.setAttribute('data-class', key);
        card.setAttribute('draggable', 'true');
        
        // Use t() for translations if available, otherwise fallback
        const translatedName = typeof t === "function" ? t(char.nameKey) : char.nameKey;
        const translatedPrefLabel = typeof t === "function" ? t("pref_label") : "優先: ";
        const translatedPref = typeof t === "function" ? t(char.prefKey) : char.prefKey;
        const cdLabel = typeof t === "function" ? t("cd_label", char.cd) : ` | CD: ${char.cd}s`;

        card.innerHTML = `
            <div class="icon">${char.icon}</div>
            <div class="info">
                <strong>${translatedName}</strong>
                <span>HP:${char.hp} | ATK:${char.atk}${cdLabel}</span>
                <span>${translatedPrefLabel}${translatedPref}</span>
            </div>
        `;
        container.appendChild(card);
    }
}

// 在選取 .char-card 元素前先動態生成角色卡片
renderCharacterPool('character-pool-container');

let team1 = []; 
let team2 = [];
let selectedClassForPlacement = null;

// UI 元素
const gridTeam1 = document.getElementById('grid-team1');
const gridTeam2 = document.getElementById('grid-team2');
const logContent = document.getElementById('log-content');
const btnStart = document.getElementById('btn-start');
const btnRandom = document.getElementById('btn-random');
const btnReset = document.getElementById('btn-reset');
const inputNumChars = document.getElementById('num-chars');
const charCards = document.querySelectorAll('.char-card');
const selectionStatus = document.getElementById('selection-status');
const speedSelect = document.getElementById('speed-select');
const btnSettings = document.getElementById('btn-settings');
const modalSettings = document.getElementById('settings-modal');
const btnCloseSettings = document.getElementById('btn-close-settings');

const btnStats = document.getElementById('btn-stats');
const modalStats = document.getElementById('stats-sidebar');
const btnCancelStats = document.getElementById('btn-cancel-stats');
const btnSaveStats = document.getElementById('btn-save-stats');
const statsFormContainer = document.getElementById('stats-form-container');

const btnToggleLog = document.getElementById('btn-toggle-log');
const battleLogSidebar = document.getElementById('battle-log-sidebar');

btnToggleLog.addEventListener('click', () => {
    battleLogSidebar.classList.toggle('hidden-sidebar');
});

btnSettings.addEventListener('click', () => {
    modalSettings.classList.remove('hidden');
});

btnCloseSettings.addEventListener('click', () => {
    modalSettings.classList.add('hidden');
});

function openStatsModal() {
    statsFormContainer.innerHTML = '';
    
    for (const key in CHARACTER_TEMPLATES) {
        const char = CHARACTER_TEMPLATES[key];
        const translatedName = typeof t === "function" ? t(char.nameKey) : char.nameKey;
        
        const row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = `
            <div class="stat-class-info">
                <span>${char.icon}</span>
                <span>${translatedName}</span>
            </div>
            <div class="stat-inputs">
                <div class="stat-input-group">
                    <label>HP</label>
                    <input type="number" id="stat-hp-${key}" value="${char.hp}" min="1">
                </div>
                <div class="stat-input-group">
                    <label>ATK</label>
                    <input type="number" id="stat-atk-${key}" value="${char.atk}" min="0">
                </div>
                <div class="stat-input-group">
                    <label>CD</label>
                    <input type="number" id="stat-cd-${key}" value="${char.cd}" min="0.1" step="0.1">
                </div>
            </div>
        `;
        statsFormContainer.appendChild(row);
    }
    
    modalStats.classList.remove('hidden-sidebar');
}

btnStats.addEventListener('click', () => {
    if (modalStats.classList.contains('hidden-sidebar')) {
        openStatsModal();
    } else {
        modalStats.classList.add('hidden-sidebar');
    }
});

btnCancelStats.addEventListener('click', () => {
    modalStats.classList.add('hidden-sidebar');
});

btnSaveStats.addEventListener('click', () => {
    for (const key in CHARACTER_TEMPLATES) {
        const hpInput = document.getElementById(`stat-hp-${key}`);
        const atkInput = document.getElementById(`stat-atk-${key}`);
        const cdInput = document.getElementById(`stat-cd-${key}`);
        
        if (hpInput) CHARACTER_TEMPLATES[key].hp = parseInt(hpInput.value) || CHARACTER_TEMPLATES[key].hp;
        if (atkInput) CHARACTER_TEMPLATES[key].atk = parseInt(atkInput.value) || CHARACTER_TEMPLATES[key].atk;
        if (cdInput) CHARACTER_TEMPLATES[key].cd = parseFloat(cdInput.value) || CHARACTER_TEMPLATES[key].cd;
    }
    
    // 重新渲染選角區卡片
    renderCharacterPool('character-pool-container');
    window.bindCharCards();
    
    modalStats.classList.add('hidden-sidebar');
});

let battleSpeed = 1.0;
speedSelect.addEventListener('change', (e) => {
    battleSpeed = parseFloat(e.target.value);
    document.documentElement.style.setProperty('--battle-speed', battleSpeed);
});
speedSelect.dispatchEvent(new Event('change'));

// 拖放狀態變數
let draggedCharId = null; 
let draggedCharClass = null;

function initGrids() {
    gridTeam1.innerHTML = '';
    gridTeam2.innerHTML = '';
    
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            createCell(gridTeam1, 1, x, y);
            createCell(gridTeam2, 2, x, y);
        }
    }
}

function createCell(parent, teamId, x, y) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.team = teamId;
    cell.dataset.x = x;
    cell.dataset.y = y;
    
    // 點擊放置 (舊有操作)
    cell.addEventListener('click', () => {
        if (selectedClassForPlacement && !cell.hasChildNodes()) {
            placeNewCharacter(teamId, x, y, selectedClassForPlacement, cell);
        }
    });

    // 拖放事件支援
    cell.addEventListener('dragover', e => {
        e.preventDefault(); // 允許 drop
        if (!cell.hasChildNodes() || draggedCharId) {
            cell.classList.add('drag-over');
        }
    });
    cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
    cell.addEventListener('drop', e => {
        e.preventDefault();
        cell.classList.remove('drag-over');
        
        // 從下方卡片拉過來的新角色
        if (draggedCharClass && !cell.hasChildNodes()) {
            placeNewCharacter(teamId, x, y, draggedCharClass, cell);
        } 
        // 在盤面上移動既有角色
        else if (draggedCharId) {
            moveCharacter(draggedCharId, teamId, x, y, cell);
        }
    });

    parent.appendChild(cell);
}

// 設定卡片的拖曳事件
window.bindCharCards = function() {
    const charCards = document.querySelectorAll('.char-card');
    charCards.forEach(card => {
        card.addEventListener('dragstart', e => {
            draggedCharClass = card.dataset.class;
            draggedCharId = null;
        });
        card.addEventListener('dragend', () => draggedCharClass = null);
        
        // 點擊選擇 (舊有操作)
        card.addEventListener('click', () => {
            charCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedClassForPlacement = card.dataset.class;
            selectionStatus.innerText = t("selection_status") + t(CHARACTER_TEMPLATES[selectedClassForPlacement].nameKey) + t("select_instruction");
        });
    });
};
window.bindCharCards();

// 將角色拖放出盤面外即可刪除
document.body.addEventListener('dragover', e => {
    e.preventDefault(); // 必須 preventDefault 才能接收 drop
});

document.body.addEventListener('drop', e => {
    // 如果是丟在九宮格內，交給 cell 的 drop 處理
    if (e.target.closest('.cell')) return;

    // 如果丟在九宮格外部，且是盤面上既有的角色，就刪除它
    if (draggedCharId) {
        let charIndex = team1.findIndex(c => c.id === draggedCharId);
        if (charIndex !== -1) {
            team1[charIndex].dom.remove();
            team1.splice(charIndex, 1);
        } else {
            charIndex = team2.findIndex(c => c.id === draggedCharId);
            if (charIndex !== -1) {
                team2[charIndex].dom.remove();
                team2.splice(charIndex, 1);
            }
        }
        checkReady();
    }
});

function placeNewCharacter(teamId, x, y, cls, cellElem) {
    const maxChars = parseInt(inputNumChars.value);
    const targetTeam = teamId === 1 ? team1 : team2;
    
    // 測試用：取消滿員限制，允許繼續增員
    // if (targetTeam.length >= maxChars) {
    //     logMessage(t("log_limit_reached", teamId, maxChars));
    //     return;
    // }

    addCharacterToBoard(teamId, x, y, CHARACTER_TEMPLATES[cls], cellElem);
    checkReady();
}

function moveCharacter(charId, targetTeamId, newX, newY, targetCell) {
    // 尋找角色原本在哪個隊伍
    let charObj = team1.find(c => c.id === charId);
    let originalTeam = 1;
    if (!charObj) {
        charObj = team2.find(c => c.id === charId);
        originalTeam = 2;
    }
    
    if (!charObj) return;

    // 不能跨陣營移動
    if (originalTeam !== targetTeamId) return;

    const oldCell = charObj.dom.parentElement;

    // 如果目標格子已有其他人，執行交換
    if (targetCell.hasChildNodes()) {
        const targetCharDom = targetCell.firstChild;
        const targetCharId = targetCharDom.id;
        
        // 如果是同一個角色 (在原地放開)，不作處理
        if (targetCharId === charId) return;

        let targetCharObj = (originalTeam === 1 ? team1 : team2).find(c => c.id === targetCharId);
        
        if (targetCharObj) {
            // 交換座標資料
            const oldX = charObj.x;
            const oldY = charObj.y;
            charObj.x = parseInt(newX);
            charObj.y = parseInt(newY);
            targetCharObj.x = oldX;
            targetCharObj.y = oldY;
            
            // 交換 DOM
            oldCell.appendChild(targetCharDom);
            targetCell.appendChild(charObj.dom);
        }
        return;
    }

    // 更新資料與 DOM (目標為空格)
    charObj.x = parseInt(newX);
    charObj.y = parseInt(newY);
    targetCell.appendChild(charObj.dom);
}

function addCharacterToBoard(teamId, x, y, tpl, cellElem) {
    const charObj = {
        team: teamId,
        x: parseInt(x),
        y: parseInt(y),
        nameKey: tpl.nameKey,
        icon: tpl.icon,
        hp: tpl.hp,
        maxHp: tpl.hp,
        atk: tpl.atk,
        element: tpl.element,
        prefKey: tpl.prefKey,
        cd: tpl.cd,
        id: `char-${teamId}-${Date.now()}-${Math.floor(Math.random()*1000)}`
    };
    
    const targetTeam = teamId === 1 ? team1 : team2;
    targetTeam.push(charObj);

    // 渲染角色 DOM
    const charDom = document.createElement('div');
    charDom.className = 'character';
    charDom.id = charObj.id;
    charDom.innerText = tpl.icon;
    charDom.draggable = true; // 允許盤面上拖曳

    // 盤面上角色的拖曳事件
    charDom.addEventListener('dragstart', e => {
        draggedCharId = charObj.id;
        draggedCharClass = null;
        charDom.classList.add('dragging');
        // 為了讓拖曳圖像保留，但滑鼠下方不要卡到 DOM (避免擋住 drop 判定)
        setTimeout(() => charDom.style.display = 'none', 0);
    });
    charDom.addEventListener('dragend', () => {
        draggedCharId = null;
        charDom.classList.remove('dragging');
        charDom.style.display = 'block';
    });

    const hpContainer = document.createElement('div');
    hpContainer.className = 'hp-bar-container';
    const hpBar = document.createElement('div');
    hpBar.className = 'hp-bar';
    hpContainer.appendChild(hpBar);
    charDom.appendChild(hpContainer);

    charObj.dom = charDom;
    charObj.hpBar = hpBar;

    cellElem.appendChild(charDom);
}

btnRandom.addEventListener('click', () => {
    resetBoard();
    const maxChars = parseInt(inputNumChars.value);
    const classes = Object.keys(CHARACTER_TEMPLATES);
    
    const generateForTeam = (teamId, targetArray, gridElem) => {
        const positions = [];
        for(let x=0; x<3; x++) for(let y=0; y<3; y++) positions.push({x, y});
        positions.sort(() => Math.random() - 0.5);
        
        for(let i=0; i<maxChars; i++) {
            const cls = classes[Math.floor(Math.random() * classes.length)];
            const pos = positions[i];
            const cell = gridElem.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
            addCharacterToBoard(teamId, pos.x, pos.y, CHARACTER_TEMPLATES[cls], cell);
        }
    };

    generateForTeam(1, team1, gridTeam1);
    generateForTeam(2, team2, gridTeam2);
    checkReady();
    logI18n('{content}', "log_random_done");
});

function checkReady() {
    // 只要雙方都有至少一名角色，就可以開始戰鬥（不需人數相等）
    if (team1.length > 0 && team2.length > 0) {
        btnStart.disabled = false;
    } else {
        btnStart.disabled = true;
    }
}

function resetBoard() {
    team1 = [];
    team2 = [];
    initGrids();
    btnStart.disabled = true;
    document.getElementById('selection-panel').classList.remove('hidden');
    logContent.innerHTML = '';
}

btnReset.addEventListener('click', () => {
    resetBoard();
    btnReset.classList.add('hidden');
    btnRandom.disabled = false;
    inputNumChars.disabled = false;
    // 不再停止 BGM，讓它保持循環播放
});

function logMessage(htmlStr) {
    const p = document.createElement('div');
    p.className = 'log-entry';
    p.innerHTML = htmlStr;
    logContent.appendChild(p);
    logContent.scrollTop = logContent.scrollHeight;
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function logI18n(htmlTemplate, key, args = []) {
    const argsStr = escapeHtml(JSON.stringify(args));
    const translated = t(key, ...args);
    const spanHtml = `<span data-i18n-log="${key}" data-i18n-args="${argsStr}">${translated}</span>`;
    const finalHtml = htmlTemplate ? htmlTemplate.replace('{content}', spanHtml) : spanHtml;
    logMessage(finalHtml);
}

btnStart.addEventListener('click', async () => {
    btnStart.disabled = true;
    btnRandom.disabled = true;
    inputNumChars.disabled = true;
    logContent.innerHTML = '';
    
    // 戰鬥開始時隱藏下方自選面板
    document.getElementById('selection-panel').classList.add('hidden');
    
    await BattleEngine.runBattle(team1, team2, {
        battleSpeed: battleSpeed,
        logI18n: logI18n,
        audio: audio,
        btnReset: btnReset
    });
});

// (移除匯出戰鬥紀錄功能)

initGrids();
