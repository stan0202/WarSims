import random

class Character:
    def __init__(self, name, icon, hp, atk, element, target_pref, team, cd=1.0):
        self.name = name
        self.icon = icon
        self.hp = hp
        self.atk = atk
        self.element = element
        self.target_pref = target_pref
        self.team = team
        self.cd = cd
        self.x = -1
        self.y = -1
        self.next_attack_time = 0.0 if self.name == "刺客" else self.cd

    def is_alive(self):
        return self.hp > 0

    def calculate_damage(self, target):
        # 屬性相剋：石頭 > 剪刀 > 布 > 石頭
        multiplier = 1.0
        if (self.element == "石頭" and target.element == "剪刀") or \
           (self.element == "剪刀" and target.element == "布") or \
           (self.element == "布" and target.element == "石頭"):
            multiplier = 1.5
        return int(self.atk * multiplier)

def print_grids(team1_chars, team2_chars):
    grid1 = [["[  ]" for _ in range(3)] for _ in range(3)]
    grid2 = [["[  ]" for _ in range(3)] for _ in range(3)]
    
    for c in team1_chars:
        if c.is_alive():
            grid1[c.y][c.x] = f"[{c.icon}]"
        else:
            grid1[c.y][c.x] = "[💀]"
            
    for c in team2_chars:
        if c.is_alive():
            grid2[c.y][c.x] = f"[{c.icon}]"
        else:
            grid2[c.y][c.x] = "[💀]"
            
    print("  玩家 1 (左)           玩家 2 (右)")
    print(" 後  中  前           前  中  後 ")
    for r in range(3):
        r1 = "".join(grid1[r])
        r2 = "".join(grid2[r])
        print(f"{r1}   VS   {r2}")
    print()

def select_targets(attacker, enemies):
    alive_enemies = [e for e in enemies if e.is_alive()]
    if not alive_enemies:
        return []
        
    if attacker.target_pref == "人多的一排":
        row_counts = {}
        for e in alive_enemies:
            row_counts[e.x] = row_counts.get(e.x, 0) + 1
            
        max_count = max(row_counts.values())
        max_rows = [x for x, count in row_counts.items() if count == max_count]
        
        target_row = random.choice(max_rows)
        return [e for e in alive_enemies if e.x == target_row]

    def get_sort_key(enemy):
        # 決定優先攻擊目標 (加入些許隨機性處理同一排有多個敵人的狀況)
        tiebreaker = random.random()
        
        # 玩家 1 攻擊玩家 2 (玩家 2 陣地：x=0 為前排, x=2 為後排)
        if attacker.team == 1:
            if attacker.target_pref == "前排":
                return (enemy.x, tiebreaker) # x 越小越優先 (前排)
            else:
                return (-enemy.x, tiebreaker) # x 越大越優先 (後排)
        
        # 玩家 2 攻擊玩家 1 (玩家 1 陣地：x=2 為前排, x=0 為後排)
        else:
            if attacker.target_pref == "前排":
                return (-enemy.x, tiebreaker) # x 越大越優先 (前排)
            else:
                return (enemy.x, tiebreaker) # x 越小越優先 (後排)
                
    alive_enemies.sort(key=get_sort_key)
    return [alive_enemies[0]]

def get_team_selection(player_name, templates, mode, num_chars):
    selected_templates = []
    print(f"\n--- {player_name} 陣容選擇 ---")
    for i in range(num_chars):
        if mode == "1":
            print(f"請選擇 {player_name} 的第 {i+1} 個角色:")
            for j, t in enumerate(templates):
                print(f"  {j+1}. {t['icon']} {t['name']} (屬性: {t['element']}, HP: {t['hp']}, ATK: {t['atk']}, 目標: {t['target_pref']})")
            try:
                idx = int(input("輸入選項 (1-3): ")) - 1
                if idx not in [0, 1, 2]: 
                    print("無效輸入，自動隨機選擇！")
                    idx = random.randint(0, 2)
            except ValueError:
                print("無效輸入，自動隨機選擇！")
                idx = random.randint(0, 2)
            template = templates[idx]
        else:
            template = random.choice(templates)
            
        selected_templates.append(template)
    return selected_templates

def instantiate_team(selected_templates, team_id, num_chars):
    chars = []
    for template in selected_templates:
        char = Character(team=team_id, **template)
        chars.append(char)
        
    # 隨機分配 3x3 位置
    positions = random.sample([(x, y) for x in range(3) for y in range(3)], num_chars)
    for i in range(num_chars):
        chars[i].x, chars[i].y = positions[i]
    return chars

def simulate_battle(t1_templates, t2_templates, num_chars, verbose=True):
    t1_chars = instantiate_team(t1_templates, 1, num_chars)
    t2_chars = instantiate_team(t2_templates, 2, num_chars)

    if verbose:
        print("\n=== 初始棋盤與陣容 ===")
        print_grids(t1_chars, t2_chars)
        
        print("玩家 1 陣容 (左):")
        for c in t1_chars:
             print(f" - {c.icon} {c.name} ({c.element}) HP: {c.hp}, ATK: {c.atk}, 目標: {c.target_pref} (位置: {c.x},{c.y})")
        print("玩家 2 陣容 (右):")
        for c in t2_chars:
             print(f" - {c.icon} {c.name} ({c.element}) HP: {c.hp}, ATK: {c.atk}, 目標: {c.target_pref} (位置: {c.x},{c.y})")

        print("\n=== 戰鬥模擬開始 ===")
        
    sim_time = 0.0
    while any(c.is_alive() for c in t1_chars) and any(c.is_alive() for c in t2_chars):
        living = [c for c in t1_chars + t2_chars if c.is_alive()]
        if not living:
            break
            
        def sort_key(c):
            # 優先比較 next_attack_time，若相同則 team1 (team=1) 優先
            return (c.next_attack_time, c.team)
            
        living.sort(key=sort_key)
        attacker = living[0]
        sim_time = attacker.next_attack_time
        
        defenders = t2_chars if attacker.team == 1 else t1_chars
        if not any(c.is_alive() for c in defenders):
            break

        targets = select_targets(attacker, defenders)
        
        if targets:
            for target in targets:
                if target.is_alive():
                    damage = attacker.calculate_damage(target)
                    is_crit = damage > attacker.atk
                    crit_msg = "，屬性克制！" if is_crit else "。"
                    target.hp -= damage
                    if verbose:
                        print(f"[{sim_time:.1f}s] * [玩家 {attacker.team}] {attacker.icon}{attacker.name} 攻擊 [玩家 {target.team}] {target.icon}{target.name}{crit_msg} 造成 {damage} 點傷害。 ({target.name} HP: {max(0, target.hp)})")
                    if not target.is_alive() and verbose:
                        print(f"  -> 💀 [{sim_time:.1f}s] {target.icon}{target.name} 陣亡！")
                        
        attacker.next_attack_time = sim_time + attacker.cd
        
    if verbose:
        print(f"\n[戰鬥結束 - 戰場現況]")
        print_grids(t1_chars, t2_chars)

    winner = 0 # 0:平手, 1:玩家1, 2:玩家2
    if any(c.is_alive() for c in t1_chars):
        winner = 1
    elif any(c.is_alive() for c in t2_chars):
        winner = 2

    if verbose:
        print("\n=== 戰鬥結束 ===")
        if winner == 1:
            print("🏆 獲勝者是：玩家 1！")
        elif winner == 2:
            print("🏆 獲勝者是：玩家 2！")
        else:
            print("🤝 雙方平手！ (同歸於盡)")
            
    return winner, t1_chars, t2_chars

def main():
    templates = [
        {"name": "戰士", "icon": "🛡️", "hp": 120, "atk": 20, "element": "石頭", "target_pref": "前排", "cd": 1.0},
        {"name": "刺客", "icon": "⚔️", "hp": 90, "atk": 30, "element": "剪刀", "target_pref": "後排", "cd": 0.8},
        {"name": "弓手", "icon": "🏹", "hp": 100, "atk": 26, "element": "布", "target_pref": "前排", "cd": 0.8},
        {"name": "法師", "icon": "🔮", "hp": 80, "atk": 19, "element": "無", "target_pref": "人多的一排", "cd": 1.5}
    ]

    while True:
        print("=== 雙九宮格團隊戰鬥模擬器 ===")
        
        try:
            num_chars_input = input("請輸入雙方上場人數 (2~5，預設為 2): ").strip()
            num_chars = int(num_chars_input) if num_chars_input else 2
            if not 2 <= num_chars <= 5:
                print("人數不在 2~5 的範圍內，將預設為 2。")
                num_chars = 2
        except ValueError:
            print("無效的輸入，人數預設為 2。")
            num_chars = 2

        mode = "2"

        try:
            sim_count_input = input("請輸入模擬戰鬥場數 (預設為 10000): ").strip()
            sim_count = int(sim_count_input) if sim_count_input else 10000
            if sim_count <= 0:
                print("場數必須大於 0，預設為 10000。")
                sim_count = 10000
        except ValueError:
            print("無效的輸入，場數預設為 10000。")
            sim_count = 10000

        re_roll_teams = True

        # 如果跑多場，詢問是否輸出詳細戰鬥過程
        verbose = True
        if sim_count > 1:
            verbose_choice = input("是否輸出每場的詳細戰鬥過程？(Y/N，預設為 N): ").strip().upper()
            verbose = (verbose_choice == "Y")

        # 初始化統計資料
        stats = {
            "戰士": {"deployed": 0, "wins": 0, "survived": 0},
            "刺客": {"deployed": 0, "wins": 0, "survived": 0},
            "弓手": {"deployed": 0, "wins": 0, "survived": 0},
            "法師": {"deployed": 0, "wins": 0, "survived": 0}
        }
        p1_wins = 0
        p2_wins = 0
        draws = 0

        # 如果不需要每場重新生成，先在外面選好 templates
        if not re_roll_teams or mode == "1":
            t1_templates = get_team_selection("玩家 1", templates, mode, num_chars)
            t2_templates = get_team_selection("玩家 2", templates, mode, num_chars)

        for match_idx in range(sim_count):
            if verbose or sim_count == 1:
                print(f"\n================ 模擬第 {match_idx + 1} / {sim_count} 場 ================")

            # 如果需要每場重新生成隨機陣容
            if mode == "2" and re_roll_teams:
                t1_templates = get_team_selection("玩家 1", templates, mode, num_chars)
                t2_templates = get_team_selection("玩家 2", templates, mode, num_chars)

            # 執行戰鬥
            winner, t1_final, t2_final = simulate_battle(t1_templates, t2_templates, num_chars, verbose=(verbose or sim_count == 1))

            # 統計勝負
            if winner == 1:
                p1_wins += 1
            elif winner == 2:
                p2_wins += 1
            else:
                draws += 1

            # 統計各職業表現
            for c in t1_final:
                stats[c.name]["deployed"] += 1
                if winner == 1:
                    stats[c.name]["wins"] += 1
                if c.is_alive():
                    stats[c.name]["survived"] += 1

            for c in t2_final:
                stats[c.name]["deployed"] += 1
                if winner == 2:
                    stats[c.name]["wins"] += 1
                if c.is_alive():
                    stats[c.name]["survived"] += 1

        # 輸出最終統計結果
        print("\n" + "="*20 + " 模擬統計結果 " + "="*20)
        print(f"總模擬場數: {sim_count}")
        print(f"雙方上場人數: {num_chars} 人")
        print(f"玩家 1 勝場: {p1_wins} ({p1_wins / sim_count * 100:.2f}%)")
        print(f"玩家 2 勝場: {p2_wins} ({p2_wins / sim_count * 100:.2f}%)")
        print(f"平手場數: {draws} ({draws / sim_count * 100:.2f}%)")
        print("-" * 54)
        print(f"{'職業':<6} | {'總登場次數':<10} | {'勝場數 (勝率)':<16} | {'生存次數 (生存率)'}")
        print("-" * 54)
        for class_name, data in stats.items():
            dep = data["deployed"]
            if dep > 0:
                win_pct = data["wins"] / dep * 100
                surv_pct = data["survived"] / dep * 100
                win_str = f"{data['wins']} ({win_pct:.2f}%)"
                surv_str = f"{data['survived']} ({surv_pct:.2f}%)"
            else:
                win_str = "0 (0.00%)"
                surv_str = "0 (0.00%)"
            print(f"{class_name:<6} | {dep:<10} | {win_str:<16} | {surv_str}")
        print("=" * 54)

        replay = input("\n是否繼續進行模擬？(輸入 N 離開，其他鍵繼續): ").strip().upper()
        if replay == "N":
            print("模擬器已關閉，下次見！")
            break
        print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    main()
