// battle.js - 處理戰鬥核心機制與時間軸邏輯

const BattleEngine = {
    sleep: (ms) => new Promise(r => setTimeout(r, ms)),

    calcDamage(atk, def) {
        let mult = 1.0;
        if ((atk.element === "石頭" && def.element === "剪刀") ||
            (atk.element === "剪刀" && def.element === "布") ||
            (atk.element === "布" && def.element === "石頭")) {
            mult = 1.5;
        }
        return { dmg: Math.floor(atk.atk * mult), crit: mult > 1.0 };
    },

    isAlive(c) {
        return c.hp > 0;
    },

    getTarget(attacker, enemies) {
        const aliveEnemies = enemies.filter(this.isAlive);
        if(aliveEnemies.length === 0) return [];

        // Group enemies by x
        const xGroups = {};
        for (const e of aliveEnemies) {
            if (!xGroups[e.x]) xGroups[e.x] = [];
            xGroups[e.x].push(e);
        }
        
        const xKeys = Object.keys(xGroups).map(Number);
        
        if (attacker.prefKey === "pref_crowd") {
            const counts = xKeys.map(x => xGroups[x].length);
            const maxCount = Math.max(...counts);
            const maxRows = xKeys.filter(x => xGroups[x].length === maxCount);
            const targetX = maxRows[Math.floor(Math.random() * maxRows.length)];
            return xGroups[targetX];
        } else {
            let targetRowEnemies = [];
            if (attacker.prefKey === "pref_front") {
                const minX = Math.min(...xKeys);
                targetRowEnemies = xGroups[minX];
            } else {
                const maxX = Math.max(...xKeys);
                targetRowEnemies = xGroups[maxX];
            }
            const randomIndex = Math.floor(Math.random() * targetRowEnemies.length);
            return [targetRowEnemies[randomIndex]];
        }
    },

    async runBattle(team1, team2, context) {
        const { battleSpeed, logI18n, audio, btnReset } = context;

        audio.playBGM();
        logI18n('{content}', "log_battle_start");
        
        // 將所有角色設為不可拖曳
        document.querySelectorAll('.character').forEach(el => el.draggable = false);

        // 初始化所有角色的 nextAttackTime
        for (const c of [...team1, ...team2]) {
            c.maxHp = c.maxHp || c.hp;
            if (c.nameKey === "class_assassin") {
                c.nextAttackTime = 0.0; // 刺客先手
            } else {
                c.nextAttackTime = c.cd || 1.0;
            }
        }

        let simTime = 0.0;
        let nextTiedTeamPriority = 1; // 輪流先手優先權，開局 Team 1 優先

        while(team1.some(this.isAlive) && team2.some(this.isAlive)) {
            // 尋找下一個要發動攻擊的存活角色
            const living = [...team1, ...team2].filter(this.isAlive);
            if(living.length === 0) break;

            // 依據 nextAttackTime 排序；若時間相同，則根據雙方輪流先手優先權決定，再以 ID 排序
            living.sort((a, b) => {
                if (Math.abs(a.nextAttackTime - b.nextAttackTime) > 0.0001) {
                    return a.nextAttackTime - b.nextAttackTime;
                }
                if (a.team !== b.team) {
                    return a.team === nextTiedTeamPriority ? -1 : 1;
                }
                return a.id.localeCompare(b.id);
            });

            const attacker = living[0];
            simTime = attacker.nextAttackTime;

            // 檢查在相同的時間點是否有其他角色也準備攻擊（即發生同時攻擊的情況）
            const hasTie = living.slice(1).some(other => 
                Math.abs(other.nextAttackTime - attacker.nextAttackTime) <= 0.0001
            );
            if (hasTie) {
                // 只要同時間點還有角色未攻擊，就將下一順位的優先權交給對手陣營
                nextTiedTeamPriority = attacker.team === 1 ? 2 : 1;
            }

            const defenders = attacker.team === 1 ? team2 : team1;
            if (!defenders.some(this.isAlive)) break;

            const targets = this.getTarget(attacker, defenders);
            if (targets && targets.length > 0) {
                const isMagic = attacker.nameKey === "class_mage";

                attacker.dom.classList.add(attacker.team === 1 ? 'anim-attack-t1' : 'anim-attack-t2');
                
                let playCritSound = false;
                let playHitSound = false;
                let anyoneDied = false;
                const dmgTexts = [];

                for (const target of targets) {
                    if (!this.isAlive(target)) continue;

                    const { dmg, crit } = this.calcDamage(attacker, target);
                    target.hp = Math.max(0, target.hp - dmg);

                    const hpPercent = (target.hp / target.maxHp) * 100;
                    target.hpBar.style.width = `${hpPercent}%`;
                    if(hpPercent < 30) target.hpBar.classList.add('low');

                    if (isMagic) {
                        target.dom.classList.add('anim-magic-hit');
                    } else {
                        target.dom.classList.add('anim-hit');
                    }
                    
                    if (crit) playCritSound = true; 
                    else playHitSound = true;

                    const dmgText = document.createElement('div');
                    dmgText.className = `damage-text ${crit ? 'crit' : ''}`;
                    dmgText.innerText = `-${dmg}`;
                    target.dom.parentElement.appendChild(dmgText);
                    dmgTexts.push({text: dmgText, target: target});

                    const critArg = crit ? "log_crit" : "log_no_crit";
                    logI18n('{content}', "log_attack", [simTime.toFixed(1), attacker.team, attacker.icon, attacker.nameKey, target.team, target.icon, target.nameKey, critArg, dmg]);

                    if(!this.isAlive(target)) {
                        target.dom.classList.add('anim-die');
                        logI18n('<span class="log-death">{content}</span>', "log_death", [simTime.toFixed(1), target.icon, target.nameKey]);
                        anyoneDied = true;
                    }
                }

                if (isMagic) audio.playSFX(audio.magic);
                else if (playCritSound) audio.playSFX(audio.crit);
                else if (playHitSound) audio.playSFX(audio.hit);

                if (anyoneDied) audio.playSFX(audio.die);

                await this.sleep((isMagic ? 500 : 200) / battleSpeed); 

                attacker.dom.classList.remove('anim-attack-t1', 'anim-attack-t2');
                for (const dt of dmgTexts) {
                    dt.target.dom.classList.remove('anim-hit', 'anim-magic-hit');
                    dt.text.remove();
                }

                if (anyoneDied) {
                    await this.sleep(300 / battleSpeed); 
                }
            }

            // 更新該攻擊者的下一次攻擊時間
            attacker.nextAttackTime = simTime + (attacker.cd || 1.0);
        }

        let winnerArg = "log_draw";
        let winnerArgs = [];
        if (team1.some(this.isAlive)) { winnerArg = "log_win"; winnerArgs = ["1"]; }
        else if (team2.some(this.isAlive)) { winnerArg = "log_win"; winnerArgs = ["2"]; }

        logI18n('<br>{content}', winnerArg, winnerArgs);

        btnReset.classList.remove('hidden');
    }
};
