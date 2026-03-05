// 控制系统
class Controls {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.touches = {};
        
        // 保存事件监听器引用以便清理
        this.boundHandlers = {
            keydown: null,
            keyup: null,
            touchstart: null,
            touchmove: null,
            touchend: null
        };
        
        this.setupKeyboard();
        this.setupTouch();
        this.setupButtons();
    }
    
    setupKeyboard() {
        this.boundHandlers.keydown = (e) => {
            this.keys[e.code] = true;
            
            // 防止页面滚动
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            
            // 紧急制动
            if (e.code === 'Space') {
                this.game.train.emergencyBrake = true;
                // 播放刹车声
                if (this.game.audio && this.game.train.getSpeedKmh() > 10) {
                    this.game.audio.generateSound('brake');
                }
            }
            
            // 暂停
            if (e.code === 'Escape') {
                this.game.togglePause();
            }
        };
        
        this.boundHandlers.keyup = (e) => {
            this.keys[e.code] = false;
            
            if (e.code === 'Space') {
                this.game.train.emergencyBrake = false;
            }
        };
        
        document.addEventListener('keydown', this.boundHandlers.keydown);
        document.addEventListener('keyup', this.boundHandlers.keyup);
    }
    
    setupTouch() {
        // 触摸控制（移动端）
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchmove', (e) => {
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;
            
            // 上下滑动控制速度
            if (deltaY < -30) {
                this.keys['ArrowUp'] = true;
                this.keys['ArrowDown'] = false;
            } else if (deltaY > 30) {
                this.keys['ArrowDown'] = true;
                this.keys['ArrowUp'] = false;
            } else {
                this.keys['ArrowUp'] = false;
                this.keys['ArrowDown'] = false;
            }
        });
        
        document.addEventListener('touchend', () => {
            this.keys['ArrowUp'] = false;
            this.keys['ArrowDown'] = false;
        });
    }
    
    setupButtons() {
        // 制动按钮
        const brakeBtn = document.getElementById('brakeBtn');
        if (brakeBtn) {
            brakeBtn.addEventListener('mousedown', () => this.keys['KeyS'] = true);
            brakeBtn.addEventListener('mouseup', () => this.keys['KeyS'] = false);
            brakeBtn.addEventListener('touchstart', () => this.keys['KeyS'] = true);
            brakeBtn.addEventListener('touchend', () => this.keys['KeyS'] = false);
        }
        
        // 紧急制动
        const emergencyBtn = document.getElementById('emergencyBtn');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => {
                this.game.train.emergencyBrake = true;
                setTimeout(() => {
                    this.game.train.emergencyBrake = false;
                }, 100);
            });
        }
        
        // 鸣笛
        const hornBtn = document.getElementById('hornBtn');
        if (hornBtn) {
            hornBtn.addEventListener('click', () => {
                this.game.playHorn();
            });
        }
        
        // 车灯
        const lightBtn = document.getElementById('lightBtn');
        if (lightBtn) {
            lightBtn.addEventListener('click', () => {
                this.game.toggleLights();
            });
        }
        
        // 音效控制
        const audioBtn = document.getElementById('audioBtn');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                this.game.toggleAudio();
            });
        }
    }
    
    update(deltaTime) {
        const train = this.game.train;
        
        // 油门控制
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            train.throttle = Math.min(1, train.throttle + deltaTime * 0.5);
        } else {
            train.throttle = Math.max(0, train.throttle - deltaTime * 0.3);
        }
        
        // 制动控制
        const wasBraking = train.brake > 0.1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            train.brake = Math.min(1, train.brake + deltaTime * 0.8);
            
            // 播放刹车声（仅在开始刹车且速度较高时）
            if (!wasBraking && train.brake > 0.3 && this.game.audio && train.getSpeedKmh() > 20) {
                this.game.audio.generateSound('brake');
            }
        } else {
            train.brake = Math.max(0, train.brake - deltaTime * 0.5);
        }
        
        // 更新UI
        this.updateUI();
    }
    
    updateUI() {
        const train = this.game.train;
        
        // 推力指示器
        const throttleFill = document.getElementById('throttleFill');
        if (throttleFill) {
            throttleFill.style.height = (train.throttle * 100) + '%';
        }
    }
    
    cleanup() {
        // 移除所有事件监听器
        if (this.boundHandlers.keydown) {
            document.removeEventListener('keydown', this.boundHandlers.keydown);
        }
        if (this.boundHandlers.keyup) {
            document.removeEventListener('keyup', this.boundHandlers.keyup);
        }
        if (this.boundHandlers.touchstart) {
            document.removeEventListener('touchstart', this.boundHandlers.touchstart);
        }
        if (this.boundHandlers.touchmove) {
            document.removeEventListener('touchmove', this.boundHandlers.touchmove);
        }
        if (this.boundHandlers.touchend) {
            document.removeEventListener('touchend', this.boundHandlers.touchend);
        }
        
        console.log('🧹 控制器资源清理完成');
    }
}
