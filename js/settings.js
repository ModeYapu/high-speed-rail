// 设置管理器
class SettingsManager {
    constructor() {
        this.settings = {
            // 音频设置
            masterVolume: 0.7,
            sfxVolume: 0.8,
            ambientVolume: 0.6,

            // 图形设置
            graphics: 'medium',  // low, medium, high
            renderDistance: 500,  // 视距
            particleCount: 3000,  // 粒子数量

            // 游戏设置
            difficulty: 'normal',  // easy, normal, hard
            showFPS: false,  // 显示帧率
            showTutorial: true  // 显示教程
        };

        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem('trainGameSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
                console.log('✅ 设置已加载');
            }
        } catch (e) {
            console.warn('⚠️ 加载设置失败，使用默认值');
        }
    }

    save() {
        try {
            localStorage.setItem('trainGameSettings', JSON.stringify(this.settings));
            console.log('✅ 设置已保存');
        } catch (e) {
            console.warn('⚠️ 保存设置失败');
        }
    }

    apply() {
        // 应用音量设置
        if (window.game && window.game.audio) {
            window.game.audio.masterVolume = this.settings.masterVolume;
            window.game.audio.sfxVolume = this.settings.sfxVolume;
        }

        // 应用画质设置
        this.applyGraphics(this.settings.graphics);

        console.log('✅ 设置已应用');
    }

    applyGraphics(level) {
        const configs = {
            low: {
                renderDistance: 300,
                particleCount: 1000,
                shadowMapSize: 512,
                antialias: false
            },
            medium: {
                renderDistance: 500,
                particleCount: 3000,
                shadowMapSize: 1024,
                antialias: true
            },
            high: {
                renderDistance: 800,
                particleCount: 5000,
                shadowMapSize: 2048,
                antialias: true
            }
        };

        const config = configs[level] || configs.medium;

        // 应用到游戏
        if (window.game) {
            window.game.renderDistance = config.renderDistance;

            if (window.game.weather) {
                window.game.weather.maxParticles = config.particleCount;
            }

            if (window.game.renderer) {
                window.game.renderer.shadowMap.setSize(config.shadowMapSize);
            }
        }
    }

    reset() {
        this.settings = {
            masterVolume: 0.7,
            sfxVolume: 0.8,
            ambientVolume: 0.6,
            graphics: 'medium',
            renderDistance: 500,
            particleCount: 3000,
            difficulty: 'normal',
            showFPS: false,
            showTutorial: true
        };

        this.save();
        this.apply();

        console.log('✅ 设置已重置');
    }
}

// 创建全局设置管理器
const settingsManager = new SettingsManager();
