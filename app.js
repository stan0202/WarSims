window.App = {
    team1: [],
    team2: [],
    selectedClassForPlacement: null,
    draggedCharId: null,
    draggedCharClass: null,
    bgmStarted: false,

    init: function() {
        this.initGrids();
        this.bindEvents();
    },

    initGrids: function() {
        UIManager.DOM.gridTeam1.innerHTML = '';
        UIManager.DOM.gridTeam2.innerHTML = '';
        
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                this.createCell(UIManager.DOM.gridTeam1, 1, x, y);
                this.createCell(UIManager.DOM.gridTeam2, 2, x, y);
            }
        }
    },

    createCell: function(parent, teamId, x, y) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.team = teamId;
        cell.dataset.x = x;
        cell.dataset.y = y;
        
        cell.addEventListener('click', () => {
            if (this.selectedClassForPlacement && !cell.hasChildNodes()) {
                this.placeNewCharacter(teamId, x, y, this.selectedClassForPlacement, cell);
            }
        });

        cell.addEventListener('dragover', e => {
            e.preventDefault();
            if (!cell.hasChildNodes() || this.draggedCharId) {
                cell.classList.add('drag-over');
            }
        });
        
        cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
        
        cell.addEventListener('drop', e => {
            e.preventDefault();
            cell.classList.remove('drag-over');
            
            if (this.draggedCharClass && !cell.hasChildNodes()) {
                this.placeNewCharacter(teamId, x, y, this.draggedCharClass, cell);
            } else if (this.draggedCharId) {
                this.moveCharacter(this.draggedCharId, teamId, x, y, cell);
            }
        });

        parent.appendChild(cell);
    },

    bindEvents: function() {
        // 卡片選擇與拖曳
        UIManager.DOM.charPool.addEventListener('dragstart', e => {
            const card = e.target.closest('.char-card');
            if(card) {
                this.draggedCharClass = card.dataset.class;
                this.draggedCharId = null;
            }
        });
        
        UIManager.DOM.charPool.addEventListener('dragend', () => this.draggedCharClass = null);
        
        UIManager.DOM.charPool.addEventListener('click', e => {
            const card = e.target.closest('.char-card');
            if(card) {
                document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedClassForPlacement = card.dataset.class;
                UIManager.updateSelectionStatus(this.selectedClassForPlacement);
            }
        });

        // 按鈕事件
        UIManager.DOM.btnRandom.addEventListener('click', () => this.randomizeBoard());
        UIManager.DOM.btnReset.addEventListener('click', () => this.resetBoard());
        UIManager.DOM.btnStart.addEventListener('click', () => this.startBattle());

        // BGM 觸發
        document.body.addEventListener('click', () => {
            if(!this.bgmStarted) {
                UIManager.playBGM();
                this.bgmStarted = true;
            }
        }, { once: true });
    },

    placeNewCharacter: function(teamId, x, y, cls, cellElem) {
        const maxChars = parseInt(UIManager.DOM.inputNumChars.value);
        const targetTeam = teamId === 1 ? this.team1 : this.team2;
        
        if (targetTeam.length >= maxChars) {
            UIManager.logMessage(LangManager.get("msg_max_limit", teamId, maxChars));
            return;
        }

        this.addCharacterToBoard(teamId, x, y, TEMPLATES[cls], cellElem, cls);
        this.checkReady();
    },

    moveCharacter: function(charId, targetTeamId, newX, newY, targetCell) {
        let charObj = this.team1.find(c => c.id === charId);
        let originalTeam = 1;
        if (!charObj) {
            charObj = this.team2.find(c => c.id === charId);
            originalTeam = 2;
        }
        
        if (!charObj || originalTeam !== targetTeamId || targetCell.hasChildNodes()) return;

        charObj.x = parseInt(newX);
        charObj.y = parseInt(newY);
        targetCell.appendChild(charObj.dom);
    },

    addCharacterToBoard: function(teamId, x, y, tpl, cellElem, classKeyRaw) {
        const charObj = {
            team: teamId,
            x: parseInt(x),
            y: parseInt(y),
            nameKey: tpl.classKey,
            icon: tpl.icon,
            hp: tpl.hp,
            maxHp: tpl.hp,
            atk: tpl.atk,
            element: tpl.element,
            prefKey: tpl.prefKey,
            id: `char-${teamId}-${Date.now()}-${Math.floor(Math.random()*1000)}`
        };
        
        const targetTeam = teamId === 1 ? this.team1 : this.team2;
        targetTeam.push(charObj);

        const { charDom, hpBar } = UIManager.createCharacterDOM(charObj);
        charObj.dom = charDom;
        charObj.hpBar = hpBar;

        charDom.addEventListener('dragstart', () => {
            this.draggedCharId = charObj.id;
            this.draggedCharClass = null;
            charDom.classList.add('dragging');
            setTimeout(() => charDom.style.display = 'none', 0);
        });
        
        charDom.addEventListener('dragend', () => {
            this.draggedCharId = null;
            charDom.classList.remove('dragging');
            charDom.style.display = 'block';
        });

        cellElem.appendChild(charDom);
    },

    randomizeBoard: function() {
        this.resetBoard();
        const maxChars = parseInt(UIManager.DOM.inputNumChars.value);
        const classes = Object.keys(TEMPLATES);
        
        const generateForTeam = (teamId, targetArray, gridElem) => {
            const positions = [];
            for(let x=0; x<3; x++) for(let y=0; y<3; y++) positions.push({x, y});
            positions.sort(() => Math.random() - 0.5);
            
            for(let i=0; i<maxChars; i++) {
                const cls = classes[Math.floor(Math.random() * classes.length)];
                const pos = positions[i];
                const cell = gridElem.querySelector(`.cell[data-x="${pos.x}"][data-y="${pos.y}"]`);
                this.addCharacterToBoard(teamId, pos.x, pos.y, TEMPLATES[cls], cell, cls);
            }
        };

        generateForTeam(1, this.team1, UIManager.DOM.gridTeam1);
        generateForTeam(2, this.team2, UIManager.DOM.gridTeam2);
        this.checkReady();
        UIManager.logMessage(LangManager.get("msg_random_done"));
    },

    checkReady: function() {
        const maxChars = parseInt(UIManager.DOM.inputNumChars.value);
        if (this.team1.length === maxChars && this.team2.length === maxChars) {
            UIManager.DOM.btnStart.disabled = false;
            document.getElementById('selection-panel').classList.add('hidden');
        } else {
            UIManager.DOM.btnStart.disabled = true;
        }
    },

    resetBoard: function() {
        this.team1 = [];
        this.team2 = [];
        this.initGrids();
        UIManager.DOM.btnStart.disabled = true;
        document.getElementById('selection-panel').classList.remove('hidden');
        UIManager.clearLog();
        UIManager.DOM.btnReset.classList.add('hidden');
        UIManager.DOM.btnRandom.disabled = false;
        UIManager.DOM.inputNumChars.disabled = false;
    },

    sleep: function(ms) {
        return new Promise(r => setTimeout(r, ms / UIManager.speedMultiplier));
    },

    startBattle: async function() {
        UIManager.DOM.btnStart.disabled = true;
        UIManager.DOM.btnRandom.disabled = true;
        UIManager.DOM.inputNumChars.disabled = true;
        UIManager.clearLog();
        
        UIManager.playBGM();
        UIManager.logMessage(LangManager.get("msg_battle_start"));
        
        document.querySelectorAll('.character').forEach(el => el.draggable = false);

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
                const prefStr = LangManager.get(attacker.prefKey);
                // 檢查是否包含"前排"或"Front"
                const isFrontPref = prefStr.includes("前排") || prefStr.includes("Front");

                if (attacker.team === 1) {
                    if(isFrontPref) return a.x !== b.x ? a.x - b.x : tie - 0.5;
                    else return a.x !== b.x ? b.x - a.x : tie - 0.5;
                } else {
                    if(isFrontPref) return a.x !== b.x ? b.x - a.x : tie - 0.5;
                    else return a.x !== b.x ? a.x - b.x : tie - 0.5;
                }
            });
            return aliveEnemies[0];
        };

        while(this.team1.some(isAlive) && this.team2.some(isAlive)) {
            UIManager.logMessage(`<div class="log-turn">${LangManager.get("msg_turn", turn)}</div>`);
            const p1First = (turn % 2 !== 0);
            const maxChars = parseInt(UIManager.DOM.inputNumChars.value);

            for (let i = 0; i < maxChars; i++) {
                const firstTeam = p1First ? this.team1 : this.team2;
                const secondTeam = p1First ? this.team2 : this.team1;

                const performAttack = async (attacker, defenders) => {
                    if(!isAlive(attacker) || !defenders.some(isAlive)) return;
                    
                    const target = getTarget(attacker, defenders);
                    if(!target) return;

                    const { dmg, crit } = calcDamage(attacker, target);
                    target.hp = Math.max(0, target.hp - dmg);

                    UIManager.updateHPBar(target.hpBar, target.hp, target.maxHp);

                    attacker.dom.classList.add(attacker.team === 1 ? 'anim-attack-t1' : 'anim-attack-t2');
                    target.dom.classList.add('anim-hit');
                    
                    if (crit) UIManager.playSFX(UIManager.audio.crit); 
                    else UIManager.playSFX(UIManager.audio.hit);

                    UIManager.showDamageText(target.dom, dmg, crit);

                    const critStr = crit ? LangManager.get("msg_crit") : LangManager.get("msg_normal");
                    const attackerName = LangManager.get(attacker.nameKey);
                    const targetName = LangManager.get(target.nameKey);
                    
                    const msg = LangManager.get("msg_attack", 
                        attacker.team, attacker.icon, attackerName, 
                        target.team, target.icon, targetName, 
                        critStr, dmg
                    );
                    UIManager.logMessage(msg);

                    await this.sleep(200); 

                    attacker.dom.classList.remove('anim-attack-t1', 'anim-attack-t2');
                    target.dom.classList.remove('anim-hit');

                    if(!isAlive(target)) {
                        UIManager.playSFX(UIManager.audio.die);
                        target.dom.classList.add('anim-die');
                        const dieMsg = `<span class="log-death">${LangManager.get("msg_death", target.icon, targetName)}</span>`;
                        UIManager.logMessage(dieMsg);
                        await this.sleep(300); 
                    }
                };

                await performAttack(firstTeam[i], secondTeam);
                await performAttack(secondTeam[i], firstTeam);
            }
            turn++;
        }

        let winnerKey = "winner_tie";
        if (this.team1.some(isAlive)) winnerKey = "winner_p1";
        else if (this.team2.some(isAlive)) winnerKey = "winner_p2";

        UIManager.logMessage(`<br>${LangManager.get("msg_winner", LangManager.get(winnerKey))}`);
        UIManager.DOM.btnReset.classList.remove('hidden');
    }
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
});
