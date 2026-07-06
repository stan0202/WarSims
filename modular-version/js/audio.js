// audio.js - 處理所有背景音樂與音效邏輯
const audio = {
    bgmMuted: false,
    sfxMuted: false,
    bgmVolume: 0.25,
    sfxVolume: 0.25,
    bgmStarted: false,

    bgm: document.getElementById('bgm-audio'),
    hit: document.getElementById('hit-audio'),
    crit: document.getElementById('crit-audio'),
    die: document.getElementById('die-audio'),
    magic: document.getElementById('magic-audio'),

    playSFX(soundElement) {
        if (!soundElement || this.sfxMuted) return;
        const clone = soundElement.cloneNode();
        clone.volume = this.sfxVolume;
        clone.play().catch(() => {});
    },

    playBGM() {
        if (this.bgmMuted || !this.bgm) return;
        this.bgm.volume = this.bgmVolume;
        this.bgm.play().catch(() => {});
    },

    stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }
    },

    init() {
        const volBgmSlider = document.getElementById('vol-bgm');
        const volSfxSlider = document.getElementById('vol-sfx');
        const toggleBgmBtn = document.getElementById('toggle-bgm');
        const toggleSfxBtn = document.getElementById('toggle-sfx');

        if (volBgmSlider) {
            volBgmSlider.addEventListener('input', e => {
                this.bgmVolume = parseFloat(e.target.value);
                if (this.bgm) this.bgm.volume = this.bgmVolume;
            });
        }

        if (volSfxSlider) {
            volSfxSlider.addEventListener('input', e => {
                this.sfxVolume = parseFloat(e.target.value);
            });
        }

        if (toggleBgmBtn) {
            toggleBgmBtn.addEventListener('click', () => {
                this.bgmMuted = !this.bgmMuted;
                toggleBgmBtn.classList.toggle('muted', this.bgmMuted);
                if (this.bgmMuted) {
                    this.bgm.pause();
                } else {
                    this.playBGM();
                }
            });
        }

        if (toggleSfxBtn) {
            toggleSfxBtn.addEventListener('click', () => {
                this.sfxMuted = !this.sfxMuted;
                toggleSfxBtn.classList.toggle('muted', this.sfxMuted);
            });
        }

        // 第一次點擊頁面時啟動背景音樂
        document.body.addEventListener('click', () => {
            if (!this.bgmStarted && !this.bgmMuted) {
                this.playBGM();
                this.bgmStarted = true;
            }
        }, { once: true });
    }
};

// 初始化綁定 UI 事件
window.addEventListener('DOMContentLoaded', () => {
    audio.init();
});
