const CHARACTER_TEMPLATES = {
    "Warrior": { classId: "Warrior", nameKey: "class_warrior", icon: "🛡️", hp: 120, atk: 20, element: "石頭", prefKey: "pref_front" },
    "Assassin": { classId: "Assassin", nameKey: "class_assassin", icon: "⚔️", hp: 90, atk: 30, element: "剪刀", prefKey: "pref_back" },
    "Archer": { classId: "Archer", nameKey: "class_archer", icon: "🏹", hp: 100, atk: 26, element: "布", prefKey: "pref_front" },
    "Mage": { classId: "Mage", nameKey: "class_mage", icon: "🔮", hp: 80, atk: 19, element: "無", prefKey: "pref_crowd" }
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
        
        // Use t() for translations if available, otherwise fallback
        const translatedName = typeof t === "function" ? t(char.nameKey) : char.nameKey;
        const translatedPrefLabel = typeof t === "function" ? t("pref_label") : "優先: ";
        const translatedPref = typeof t === "function" ? t(char.prefKey) : char.prefKey;

        card.innerHTML = `
            <div class="icon">${char.icon}</div>
            <div class="info">
                <strong>${translatedName}</strong>
                <span>HP:${char.hp} | ATK:${char.atk}</span>
                <span>${translatedPrefLabel}${translatedPref}</span>
            </div>
        `;
        container.appendChild(card);
    }
}
