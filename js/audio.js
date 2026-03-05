// 音效系统
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.ambientSounds = {};
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;
        this.isMuted = false;
        
        // 当前播放的状态
        this.currentEnginePitch = 1;
        this.isEnginePlaying = false;
        this.currentWeather = null;
        
        this.init();
    }
    
    init() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 处理浏览器自动播放策略
            if (this.audioContext.state === 'suspended') {
                console.log('🔇 音频上下文已暂停，等待用户交互...');

                // 添加一次性用户交互监听器
                const resumeAudio = () => {
                    if (this.audioContext && this.audioContext.state === 'suspended') {
                        this.audioContext.resume().then(() => {
                            console.log('🔊 音频上下文已通过用户交互恢复');
                        });
                    }
                    // 移除监听器
                    document.removeEventListener('click', resumeAudio);
                    document.removeEventListener('keydown', resumeAudio);
                    document.removeEventListener('touchstart', resumeAudio);
                };

                // 添加多种用户交互监听
                document.addEventListener('click', resumeAudio);
                document.addEventListener('keydown', resumeAudio);
                document.addEventListener('touchstart', resumeAudio);
            }

            console.log('✅ 音频系统初始化成功');
        } catch (e) {
            console.warn('⚠️ 浏览器不支持Web Audio API');
            this.disabled = true;
        }
    }
    
    // 生成合成音效
    generateSound(type, params = {}) {
        if (!this.audioContext || this.isMuted) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        switch (type) {
            case 'engine':
                return this.createEngineSound(params);
            case 'brake':
                return this.createBrakeSound();
            case 'horn':
                return this.createHornSound();
            case 'alert':
                return this.createAlertSound();
            case 'click':
                return this.createClickSound();
            case 'ambient':
                return this.createAmbientSound(params);
            case 'wind':
                return this.createWindSound(params.speed);
            case 'rain':
                return this.createRainSound(params.intensity);
            case 'tunnel':
                return this.createTunnelSound();
            case 'station':
                return this.createStationAnnouncement();
            default:
                console.warn(`未知音效类型: ${type}`);
        }
    }
    
    // 引擎声（持续音效）
    createEngineSound(params) {
        const ctx = this.audioContext;
        const speed = params.speed || 0;
        const maxSpeed = params.maxSpeed || 400;
        
        // 停止之前的引擎声
        if (this.sounds.engine) {
            this.stopSound('engine');
        }
        
        // 创建振荡器组合
        const oscillator1 = ctx.createOscillator();
        const oscillator2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // 基础频率随速度变化
        const speedRatio = speed / maxSpeed;
        const baseFreq = 60 + speedRatio * 180; // 60-240 Hz
        
        oscillator1.type = 'sawtooth';
        oscillator1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        
        oscillator2.type = 'square';
        oscillator2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime);
        
        // 音量随速度变化
        const volume = 0.05 + speedRatio * 0.1;
        gainNode.gain.setValueAtTime(volume * this.sfxVolume * this.masterVolume, ctx.currentTime);
        
        // 连接节点
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // 启动
        oscillator1.start();
        oscillator2.start();
        
        this.sounds.engine = {
            oscillators: [oscillator1, oscillator2],
            gainNode: gainNode,
            type: 'continuous'
        };
        
        this.isEnginePlaying = true;
        
        return this.sounds.engine;
    }
    
    // 更新引擎声（根据速度实时调整）
    updateEngineSound(speed, maxSpeed = 400) {
        if (!this.isEnginePlaying || !this.sounds.engine) return;
        
        const ctx = this.audioContext;
        const speedRatio = speed / maxSpeed;
        
        // 更新频率
        const baseFreq = 60 + speedRatio * 180;
        this.sounds.engine.oscillators[0].frequency.setValueAtTime(baseFreq, ctx.currentTime);
        this.sounds.engine.oscillators[1].frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime);
        
        // 更新音量
        const volume = 0.05 + speedRatio * 0.1;
        this.sounds.engine.gainNode.gain.setValueAtTime(
            volume * this.sfxVolume * this.masterVolume,
            ctx.currentTime
        );
    }
    
    // 刹车声
    createBrakeSound() {
        const ctx = this.audioContext;
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        // 金属摩擦声
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.5);
        
        // 低通滤波器
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.5);
        
        // 音量包络
        gainNode.gain.setValueAtTime(0.3 * this.sfxVolume * this.masterVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        
        // 连接
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + 1.5);
    }
    
    // 鸣笛声
    createHornSound() {
        const ctx = this.audioContext;
        
        // 主音
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(554, ctx.currentTime); // 大三度
        
        // 音量包络
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4 * this.sfxVolume * this.masterVolume, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.4 * this.sfxVolume * this.masterVolume, ctx.currentTime + 1.5);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
        
        // 连接
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 2);
        osc2.stop(ctx.currentTime + 2);
    }
    
    // 警报声
    createAlertSound() {
        const ctx = this.audioContext;
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        
        // 交替频率
        for (let i = 0; i < 4; i++) {
            oscillator.frequency.setValueAtTime(800, ctx.currentTime + i * 0.25);
            oscillator.frequency.setValueAtTime(600, ctx.currentTime + i * 0.25 + 0.125);
        }
        
        gainNode.gain.setValueAtTime(0.3 * this.sfxVolume * this.masterVolume, ctx.currentTime);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + 1);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + 1);
    }
    
    // 点击声
    createClickSound() {
        const ctx = this.audioContext;
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.2 * this.sfxVolume * this.masterVolume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.05);
    }
    
    // 风声（随速度变化）
    createWindSound(speed) {
        const ctx = this.audioContext;
        
        // 使用更小的缓冲区（0.5秒）并循环
        const bufferSize = Math.floor(0.5 * ctx.sampleRate);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // 生成白噪声
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300 + speed * 2, ctx.currentTime);
        filter.Q.setValueAtTime(0.5, ctx.currentTime);
        
        const gainNode = ctx.createGain();
        const volume = 0.02 + (speed / 400) * 0.08;
        gainNode.gain.setValueAtTime(volume * this.sfxVolume * this.masterVolume, ctx.currentTime);
        
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        whiteNoise.start();
        
        this.ambientSounds.wind = {
            source: whiteNoise,
            filter: filter,
            gainNode: gainNode,
            type: 'continuous'
        };
        
        return this.ambientSounds.wind;
    }
    
    // 更新风声
    updateWindSound(speed) {
        if (!this.ambientSounds.wind) return;
        
        const ctx = this.audioContext;
        const filter = this.ambientSounds.wind.filter;
        const gainNode = this.ambientSounds.wind.gainNode;
        
        filter.frequency.setValueAtTime(300 + speed * 2, ctx.currentTime);
        
        const volume = 0.02 + (speed / 400) * 0.08;
        gainNode.gain.setValueAtTime(volume * this.sfxVolume * this.masterVolume, ctx.currentTime);
    }
    
    // 雨声
    createRainSound(intensity = 0.5) {
        const ctx = this.audioContext;
        
        // 使用更小的缓冲区（0.5秒）并循环
        const bufferSize = Math.floor(0.5 * ctx.sampleRate);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11;
            b6 = white * 0.115926;
        }
        
        const rainNoise = ctx.createBufferSource();
        rainNoise.buffer = noiseBuffer;
        rainNoise.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
        
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(intensity * 0.15 * this.sfxVolume * this.masterVolume, ctx.currentTime);
        
        rainNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        rainNoise.start();
        
        this.ambientSounds.rain = {
            source: rainNoise,
            gainNode: gainNode,
            type: 'continuous'
        };
        
        this.currentWeather = 'rain';
        
        return this.ambientSounds.rain;
    }
    
    // 更新雨声强度
    updateRainSound(intensity) {
        if (!this.ambientSounds.rain) return;
        
        const ctx = this.audioContext;
        this.ambientSounds.rain.gainNode.gain.setValueAtTime(
            intensity * 0.15 * this.sfxVolume * this.masterVolume,
            ctx.currentTime
        );
    }
    
    // 隧道回音
    createTunnelSound() {
        const ctx = this.audioContext;
        
        // 延迟效果
        const delay = ctx.createDelay();
        delay.delayTime.setValueAtTime(0.15, ctx.currentTime);
        
        const feedback = ctx.createGain();
        feedback.gain.setValueAtTime(0.3, ctx.currentTime);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        
        // 连接延迟回路
        delay.connect(feedback);
        feedback.connect(filter);
        filter.connect(delay);
        
        this.ambientSounds.tunnel = {
            delay: delay,
            feedback: feedback,
            filter: filter,
            type: 'effect'
        };
    }
    
    // 车站广播
    createStationAnnouncement() {
        // 这里可以播放预录制的音频文件
        // 暂时使用简单的提示音
        const ctx = this.audioContext;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3); // G5
        
        gain.gain.setValueAtTime(0.2 * this.sfxVolume * this.masterVolume, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }
    
    // 停止音效
    stopSound(name) {
        if (this.sounds[name]) {
            if (this.sounds[name].oscillators) {
                this.sounds[name].oscillators.forEach(osc => {
                    try {
                        osc.stop();
                    } catch (e) {}
                });
            }
            if (this.sounds[name].source) {
                try {
                    this.sounds[name].source.stop();
                } catch (e) {}
            }
            delete this.sounds[name];
        }
        
        if (name === 'engine') {
            this.isEnginePlaying = false;
        }
    }
    
    // 停止环境音
    stopAmbientSound(name) {
        if (this.ambientSounds[name]) {
            if (this.ambientSounds[name].source) {
                try {
                    this.ambientSounds[name].source.stop();
                } catch (e) {}
            }
            delete this.ambientSounds[name];
        }
    }
    
    // 停止所有音效
    stopAll() {
        Object.keys(this.sounds).forEach(name => this.stopSound(name));
        Object.keys(this.ambientSounds).forEach(name => this.stopAmbientSound(name));
    }
    
    // 设置主音量
    setMasterVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
    }
    
    // 设置音效音量
    setSFXVolume(value) {
        this.sfxVolume = Math.max(0, Math.min(1, value));
    }
    
    // 设置音乐音量
    setMusicVolume(value) {
        this.musicVolume = Math.max(0, Math.min(1, value));
    }
    
    // 静音切换
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.stopAll();
        }
        
        return this.isMuted;
    }
    
    // 暂停（保留引擎声状态）
    pause() {
        this.stopAll();
    }
    
    // 恢复
    resume() {
        // 重新启动引擎声会在游戏循环中处理
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}