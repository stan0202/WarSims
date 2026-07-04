const CHARACTER_TEMPLATES = {
    "Warrior": { classId: "Warrior", name: "戰士", icon: "🛡️", hp: 120, atk: 20, element: "石頭", pref: "前排" },
    "Assassin": { classId: "Assassin", name: "刺客", icon: "⚔️", hp: 90, atk: 30, element: "剪刀", pref: "後排" },
    "Archer": { classId: "Archer", name: "弓手", icon: "🏹", hp: 100, atk: 26, element: "布", pref: "前排" },
    "Mage": { classId: "Mage", name: "法師", icon: "🔮", hp: 80, atk: 19, element: "無", pref: "人多的一排" }
};

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
        
        card.innerHTML = `
            <div class="icon">${char.icon}</div>
            <div class="info">
                <strong>${char.name}</strong>
                <span>HP:${char.hp} | ATK:${char.atk}</span>
                <span>優先: ${char.pref}</span>
            </div>
        `;
        container.appendChild(card);
    }
}
