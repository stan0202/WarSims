const TEMPLATES = {
    "Warrior": { name: "戰士", icon: "🛡️", hp: 120, atk: 20, element: "石頭", pref: "前排" },
    "Assassin": { name: "刺客", icon: "⚔️", hp: 90, atk: 30, element: "剪刀", pref: "後排" },
    "Archer": { name: "弓手", icon: "🏹", hp: 100, atk: 26, element: "布", pref: "前排" }
};

let team1 = []; 
let team2 = [];
let selectedClassForPlacement = null;
let historyRecords = JSON.parse(localStorage.getItem('jrpg_history')) || [];

let bgmMuted = false;
let sfxMuted = false;
let bgmVolume = 0.25;
let sfxVolume = 0.25;

const audio = {
    bgm: document.getElementById('bgm-audio'),
    hit: document.getElementById('hit-audio'),
    crit: document.getElementById('crit-audio'),
    die: document.getElementById('die-audio'),
    playSFX: (sound) => {
        if (!sound || sfxMuted) return;
        const clone = sound.cloneNode();
        clone.volume = sfxVolume;
        clone.play().catch(() => {});
    },
    playBGM: () => {
        if (bgmMuted || !audio.bgm) return;
        audio.bgm.volume = bgmVolume;
        audio.bgm.play().catch(() => {});
    },
    stopBGM: () => {
        if (audio.bgm) {
            audio.bgm.pause();
            audio.bgm.currentTime = 0;
        }
    }
};

// UI 元素
const gridTeam1 = document.getElementById('grid-team1');
const gridTeam2 = document.getElementById('grid-team2');
const logContent = document.getElementById('log-content');
const btnStart = document.getElementById('btn-start');
const btnRandom = document.getElementById('btn-random');
const btnReset = document.getElementById('btn-reset');
const btnExport = document.getElementById('btn-export');
const inputNumChars = document.getElementById('num-chars');
const charCards = document.querySelectorAll('.char-card');
const selectionStatus = document.getElementById('selection-status');

// 拖放狀態變數
let draggedCharId = null; 
let draggedCharClass = null;

// 音訊設定面板邏輯
const volBgmSlider = document.getElementById('vol-bgm');
const volSfxSlider = document.getElementById('vol-sfx');
const toggleBgmBtn = document.getElementById('toggle-bgm');
const toggleSfxBtn = document.getElementById('toggle-sfx');

volBgmSlider.addEventListener('input', e => {
    bgmVolume = parseFloat(e.target.value);
    if(audio.bgm) audio.bgm.volume = bgmVolume;
});

volSfxSlider.addEventListener('input', e => {
    sfxVolume = parseFloat(e.target.value);
});

toggleBgmBtn.addEventListener('click', () => {
    bgmMuted = !bgmMuted;
    toggleBgmBtn.classList.toggle('muted', bgmMuted);
    if(bgmMuted) audio.bgm.pause();
    else audio.playBGM();
});

toggleSfxBtn.addEventListener('click', () => {
    sfxMuted = !sfxMuted;
    toggleSfxBtn.classList.toggle('muted', sfxMuted);
});

// 嘗試在第一次點擊頁面時啟動背景音樂 (繞過瀏覽器自動播放限制)
let bgmStarted = false;
document.body.addEventListener('click', () => {
    if(!bgmStarted && !bgmMuted) {
        audio.playBGM();
        bgmStarted = true;
    }
}, { once: true });

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
        selectionStatus.innerText = `目前選擇：${TEMPLATES[selectedClassForPlacement].name} (點擊棋盤放置)`;
    });
});

function placeNewCharacter(teamId, x, y, cls, cellElem) {
    const maxChars = parseInt(inputNumChars.value);
    const targetTeam = teamId === 1 ? team1 : team2;
    
    if (targetTeam.length >= maxChars) {
        logMessage(`玩家 ${teamId} 已經達到人數上限 (${maxChars}人)！`);
        return;
    }

    addCharacterToBoard(teamId, x, y, TEMPLATES[cls], cellElem);
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

    // 如果目標格子已有其他人，可以做交換 (為求簡單這裡實作：目標格不能有人)
    if (targetCell.hasChildNodes()) return;

    // 更新資料與 DOM
    charObj.x = parseInt(newX);
    charObj.y = parseInt(newY);
    targetCell.appendChild(charObj.dom);
}

function addCharacterToBoard(teamId, x, y, tpl, cellElem) {
    const charObj = {
        team: teamId,
        x: parseInt(x),
        y: parseInt(y),
        name: tpl.name,
        icon: tpl.icon,
        hp: tpl.hp,
        maxHp: tpl.hp,
        atk: tpl.atk,
        element: tpl.element,
        pref: tpl.pref,
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
    const classes = Object.keys(TEMPLATES);
    
    const generateForTeam = (teamId, targetArray, gridElem) => {
        const positions = [];
        for(let x=0; x<3; x++) for(let y=0; y<3; y++) positions.push({x, y});
        positions.sort(() => Math.random() - 0.5);
        
        for(let i=0; i<maxChars; i++) {
            const cls = classes[Math.floor(Math.random() * classes.length)];
            const pos = positions[i];
            const cell = gridElem.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
            addCharacterToBoard(teamId, pos.x, pos.y, TEMPLATES[cls], cell);
        }
    };

    generateForTeam(1, team1, gridTeam1);
    generateForTeam(2, team2, gridTeam2);
    checkReady();
    logMessage("🎲 已為雙方隨機生成陣容！");
});

function checkReady() {
    const maxChars = parseInt(inputNumChars.value);
    if (team1.length === maxChars && team2.length === maxChars) {
        btnStart.disabled = false;
        document.getElementById('selection-panel').classList.add('hidden');
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

btnStart.addEventListener('click', async () => {
    btnStart.disabled = true;
    btnRandom.disabled = true;
    inputNumChars.disabled = true;
    logContent.innerHTML = '';
    
    audio.playBGM();
    logMessage("⚔️ <b>戰鬥開始！</b>");
    
    // 將所有角色設為不可拖曳
    document.querySelectorAll('.character').forEach(el => el.draggable = false);

    // 紀錄簡化的初始陣容
    const record = {
        timestamp: new Date().toISOString(),
        team1Formation: team1.map(c => ({ name: c.name, x: c.x, y: c.y })),
        team2Formation: team2.map(c => ({ name: c.name, x: c.x, y: c.y }))
    };

    let turn = 1;

    const calcDamage = (atk, def) => {
        let mult = 1.0;
        if ((atk.element === "石頭" && def.element === "剪刀") ||
            (atk.element === "剪刀" && def.element === "布") ||
            (atk.element === "布" && def.element === "石頭")) {
            mult = 1.5;
        }
        return { dmg: Math.floor(atk.atk * mult), crit: mult > 1.0 };
    };

    const isAlive = c => c.hp > 0;

    const getTarget = (attacker, enemies) => {
        const aliveEnemies = enemies.filter(isAlive);
        if(aliveEnemies.length === 0) return null;

        aliveEnemies.sort((a, b) => {
            const tie = Math.random();
            if (attacker.team === 1) {
                if(attacker.pref === "前排") return a.x !== b.x ? a.x - b.x : tie - 0.5;
                else return a.x !== b.x ? b.x - a.x : tie - 0.5;
            } else {
                if(attacker.pref === "前排") return a.x !== b.x ? b.x - a.x : tie - 0.5;
                else return a.x !== b.x ? a.x - b.x : tie - 0.5;
            }
        });
        return aliveEnemies[0];
    };

    while(team1.some(isAlive) && team2.some(isAlive)) {
        logMessage(`<div class="log-turn">--- 回合 ${turn} ---</div>`);
        const p1First = (turn % 2 !== 0);
        const maxChars = parseInt(inputNumChars.value);

        for (let i = 0; i < maxChars; i++) {
            const firstTeam = p1First ? team1 : team2;
            const secondTeam = p1First ? team2 : team1;

            const performAttack = async (attacker, defenders) => {
                if(!isAlive(attacker) || !defenders.some(isAlive)) return;
                
                const target = getTarget(attacker, defenders);
                if(!target) return;

                const { dmg, crit } = calcDamage(attacker, target);
                target.hp = Math.max(0, target.hp - dmg);

                const hpPercent = (target.hp / target.maxHp) * 100;
                target.hpBar.style.width = `${hpPercent}%`;
                if(hpPercent < 30) target.hpBar.classList.add('low');

                attacker.dom.classList.add(attacker.team === 1 ? 'anim-attack-t1' : 'anim-attack-t2');
                target.dom.classList.add('anim-hit');
                
                if (crit) audio.playSFX(audio.crit); else audio.playSFX(audio.hit);

                const dmgText = document.createElement('div');
                dmgText.className = `damage-text ${crit ? 'crit' : ''}`;
                dmgText.innerText = `-${dmg}`;
                target.dom.parentElement.appendChild(dmgText);

                const critStr = crit ? '<span class="log-crit">，屬性克制！</span>' : '。';
                logMessage(`[玩家 ${attacker.team}] ${attacker.icon}${attacker.name} 攻擊 [玩家 ${target.team}] ${target.icon}${target.name}${critStr} 造成 ${dmg} 傷害。`);

                await sleep(200); 

                attacker.dom.classList.remove('anim-attack-t1', 'anim-attack-t2');
                target.dom.classList.remove('anim-hit');
                dmgText.remove();

                if(!isAlive(target)) {
                    audio.playSFX(audio.die);
                    target.dom.classList.add('anim-die');
                    logMessage(`<span class="log-death">💀 ${target.icon}${target.name} 陣亡！</span>`);
                    await sleep(300); 
                }
            };

            await performAttack(firstTeam[i], secondTeam);
            await performAttack(secondTeam[i], firstTeam);
        }
        turn++;
    }

    let winner = "平手";
    if (team1.some(isAlive)) winner = "玩家 1";
    else if (team2.some(isAlive)) winner = "玩家 2";

    logMessage(`<br>🏆 <b>戰鬥結束！獲勝者是：${winner}！</b>`);
    record.result = winner;
    
    // 寫入簡化版的紀錄並存入 LocalStorage
    historyRecords.push(record);
    localStorage.setItem('jrpg_history', JSON.stringify(historyRecords));

    btnReset.classList.remove('hidden');
    // 移除 audio.stopBGM() 讓背景音樂保持播放
});

// 匯出簡易紀錄
btnExport.addEventListener('click', () => {
    if (historyRecords.length === 0) {
        alert("目前還沒有任何戰鬥紀錄可以匯出！");
        return;
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(historyRecords, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "battle_history_simple.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    // 匯出後可選擇清空
    if(confirm("匯出成功！是否要清空目前存在瀏覽器的對戰紀錄？")) {
        historyRecords = [];
        localStorage.removeItem('jrpg_history');
    }
});

initGrids();
