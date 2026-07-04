import random

class Character:
    def __init__(self, name, icon, hp, atk, element, target_pref, team):
        self.name = name
        self.icon = icon
        self.hp = hp
        self.atk = atk
        self.element = element
        self.target_pref = target_pref
        self.team = team
        self.x = -1
        self.y = -1

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

def select_target(attacker, enemies):
    alive_enemies = [e for e in enemies if e.is_alive()]
    if not alive_enemies:
        return None
        
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
    return alive_enemies[0]

def get_team_selection(player_name, templates, mode, num_chars):
    chars = []
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
            
        team_id = 1 if player_name == "玩家 1" else 2
        char = Character(team=team_id, **template)
        chars.append(char)
        
    # 隨機分配 3x3 位置
    positions = random.sample([(x, y) for x in range(3) for y in range(3)], num_chars)
    for i in range(num_chars):
        chars[i].x, chars[i].y = positions[i]
    return chars

def main():
    templates = [
        {"name": "戰士", "icon": "🛡️", "hp": 120, "atk": 20, "element": "石頭", "target_pref": "前排"},
        {"name": "刺客", "icon": "⚔️", "hp": 80, "atk": 30, "element": "剪刀", "target_pref": "後排"},
        {"name": "弓手", "icon": "🏹", "hp": 100, "atk": 25, "element": "布", "target_pref": "前排"}
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

        print("\n1. 手動選擇角色")
        print("2. 自動隨機分配 (全自動)")
        mode = input("請選擇模式 (1 或 2，預設為 2): ").strip()
        if mode not in ["1", "2"]:
            mode = "2"

        t1_chars = get_team_selection("玩家 1", templates, mode, num_chars)
        t2_chars = get_team_selection("玩家 2", templates, mode, num_chars)

        print("\n=== 初始棋盤與陣容 ===")
        print_grids(t1_chars, t2_chars)
        
        print("玩家 1 陣容 (左):")
        for c in t1_chars:
             print(f" - {c.icon} {c.name} ({c.element}) HP: {c.hp}, ATK: {c.atk}, 目標: {c.target_pref} (位置: {c.x},{c.y})")
        print("玩家 2 陣容 (右):")
        for c in t2_chars:
             print(f" - {c.icon} {c.name} ({c.element}) HP: {c.hp}, ATK: {c.atk}, 目標: {c.target_pref} (位置: {c.x},{c.y})")

        print("\n=== 戰鬥模擬開始 ===")
        turn = 1
        
        while any(c.is_alive() for c in t1_chars) and any(c.is_alive() for c in t2_chars):
            print(f"\n--- 回合 {turn} ---")
            
            # 單數回合由玩家 1 先手，雙數回合由玩家 2 先手
            p1_first = (turn % 2 != 0)
            
            # 雙方角色交替攻擊
            for i in range(num_chars):
                first_team = t1_chars if p1_first else t2_chars
                second_team = t2_chars if p1_first else t1_chars
                
                # 第一順位隊伍攻擊
                if i < len(first_team) and first_team[i].is_alive() and any(c.is_alive() for c in second_team):
                    attacker = first_team[i]
                    target = select_target(attacker, second_team)
                    if target:
                        damage = attacker.calculate_damage(target)
                        is_crit = damage > attacker.atk
                        crit_msg = "，屬性克制！" if is_crit else "。"
                        target.hp -= damage
                        print(f"* [玩家 {attacker.team}] {attacker.icon}{attacker.name} 攻擊 [玩家 {target.team}] {target.icon}{target.name}{crit_msg} 造成 {damage} 點傷害。 ({target.name} HP: {max(0, target.hp)})")
                        if not target.is_alive():
                            print(f"  -> 💀 {target.icon}{target.name} 陣亡！")

                # 第二順位隊伍攻擊
                if i < len(second_team) and second_team[i].is_alive() and any(c.is_alive() for c in first_team):
                    attacker = second_team[i]
                    target = select_target(attacker, first_team)
                    if target:
                        damage = attacker.calculate_damage(target)
                        is_crit = damage > attacker.atk
                        crit_msg = "，屬性克制！" if is_crit else "。"
                        target.hp -= damage
                        print(f"* [玩家 {attacker.team}] {attacker.icon}{attacker.name} 攻擊 [玩家 {target.team}] {target.icon}{target.name}{crit_msg} 造成 {damage} 點傷害。 ({target.name} HP: {max(0, target.hp)})")
                        if not target.is_alive():
                            print(f"  -> 💀 {target.icon}{target.name} 陣亡！")

            print(f"\n[回合 {turn} 結束 - 戰場現況]")
            print_grids(t1_chars, t2_chars)
            turn += 1

        print("\n=== 戰鬥結束 ===")
        
        if any(c.is_alive() for c in t1_chars):
            print("🏆 獲勝者是：玩家 1！")
        elif any(c.is_alive() for c in t2_chars):
            print("🏆 獲勝者是：玩家 2！")
        else:
            print("🤝 雙方平手！ (同歸於盡)")
            
        replay = input("\n是否進行下一局？(輸入 N 離開，其他鍵繼續): ").strip().upper()
        if replay == "N":
            print("模擬器已關閉，下次見！")
            break
        print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    main()
