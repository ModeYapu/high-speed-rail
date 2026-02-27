// 游戏主逻辑
class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        
        this.train = null;
        this.track = null;
        this.environment = null;
        this.physics = null;
        this.controls = null;
        this.weather = null;
        
        this.selectedTrain = 'hexie';
        this.gameMode = 'free';
        this.isPaused = false;
        this.isRunning = false;
        
        this.gameTime = 0;
        this.lastStation = null;
        
        this.lightsOn = true;
        this.headlight = null;
    }
    
    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        
        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // 时钟
        this.clock = new THREE.Clock();
        
        // 窗口调整
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('游戏初始化完成');
    }
    
    start(mode) {
        this.gameMode = mode;
        
        // 显示加载界面
        showScreen('loadingScreen');
        updateLoadingProgress(10, '创建列车...');
        
        setTimeout(() => {
            this.init();
            
            updateLoadingProgress(30, '生成轨道...');
            this.createTrack();
            
            updateLoadingProgress(50, '创建环境...');
            this.createEnvironment();
            
            updateLoadingProgress(70, '初始化物理...');
            this.createPhysics();
            
            updateLoadingProgress(85, '设置控制...');
            this.createControls();
            
            updateLoadingProgress(95, '准备天气系统...');
            this.createWeather();
            
            updateLoadingProgress(100, '完成！');
            
            setTimeout(() => {
                showScreen('gameScreen');
                this.isRunning = true;
                this.animate();
                
                // 根据模式设置天气
                if (mode === 'level2') {
                    this.weather.setWeather('rain', 0.7);
                }
            }, 500);
        }, 100);
    }
    
    createTrack() {
        this.track = new Track();
    }
    
    createEnvironment() {
        this.environment = new Environment(this.scene, this.track);
        
        // 创建列车
        this.train = new Train(this.selectedTrain);
        this.train.mesh.position.z = this.train.config.length / 2;
        this.scene.add(this.train.mesh);
        
        // 前照灯
        this.headlight = new THREE.SpotLight(0xffffaa, 2, 500, Math.PI / 6, 0.5);
        this.headlight.position.set(0, 5, -this.train.config.length / 2);
        this.headlight.target.position.set(0, 0, -this.train.config.length / 2 - 100);
        this.train.mesh.add(this.headlight);
        this.train.mesh.add(this.headlight.target);
    }
    
    createPhysics() {
        this.physics = new Physics(this.train, this.track);
    }
    
    createControls() {
        this.controls = new Controls(this);
    }
    
    createWeather() {
        this.weather = new Weather(this.scene);
    }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        if (this.isPaused) return;
        
        const deltaTime = this.clock.getDelta();
        
        // 更新游戏时间
        this.gameTime += deltaTime;
        
        // 更新控制
        this.controls.update(deltaTime);
        
        // 更新物理
        this.physics.update(deltaTime);
        
        // 更新列车
        this.train.update(deltaTime);
        
        // 更新相机位置
        this.updateCamera();
        
        // 更新环境
        this.environment.update(this.train.position);
        
        // 更新天气
        this.weather.update(deltaTime, this.train.position);
        
        // 更新HUD
        this.updateHUD();
        
        // 检查关卡条件
        this.checkLevelConditions();
        
        // 渲染
        this.renderer.render(this.scene, this.camera);
    }
    
    updateCamera() {
        // 相机跟随列车
        const trainPos = this.train.position;
        const trainSpeed = this.train.getSpeedKmh();
        
        // 相机位置（第三人称视角）
        const cameraDistance = 30 + trainSpeed * 0.05;
        const cameraHeight = 8 + trainSpeed * 0.01;
        
        // 平滑过渡
        const targetX = 0;
        const targetY = cameraHeight;
        const targetZ = trainPos + cameraDistance;
        
        this.camera.position.x = Utils.lerp(this.camera.position.x, targetX, 0.05);
        this.camera.position.y = Utils.lerp(this.camera.position.y, targetY, 0.05);
        this.camera.position.z = Utils.lerp(this.camera.position.z, targetZ, 0.1);
        
        // 看向列车前方
        this.camera.lookAt(0, 3, trainPos - 50);
        
        // 更新列车mesh位置
        this.train.mesh.position.z = trainPos - this.train.config.length / 2;
    }
    
    updateHUD() {
        // 速度
        const speed = Math.round(this.train.getSpeedKmh());
        document.getElementById('speedValue').textContent = speed;
        
        // 速度指针角度 (-135度到135度)
        const maxSpeed = this.train.config.maxSpeed;
        const angle = -135 + (speed / maxSpeed) * 270;
        document.getElementById('speedNeedle').style.transform = 
            `translateX(-50%) rotate(${angle}deg)`;
        
        // 距离
        const distance = Utils.formatDistance(this.train.position);
        document.getElementById('distance').textContent = distance;
        
        // 时间
        document.getElementById('gameTime').textContent = Utils.formatTime(this.gameTime);
        
        // 列车名称
        document.getElementById('trainName').textContent = this.train.config.name.split(' ')[0];
        
        // 下一站
        const nextStation = this.track.getNextStation(this.train.position);
        if (nextStation) {
            const dist = ((nextStation.position - this.train.position) / 1000).toFixed(1);
            document.getElementById('nextStation').textContent = 
                `${nextStation.name} (${dist}km)`;
        } else {
            document.getElementById('nextStation').textContent = '终点站';
        }
        
        // 更新迷你地图
        this.updateMiniMap();
    }
    
    updateMiniMap() {
        const canvas = document.getElementById('miniMapCanvas');
        const ctx = canvas.getContext('2d');
        
        // 清空
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制轨道
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        
        // 绘制站点
        this.track.stations.forEach(station => {
            const x = (station.position / this.track.totalLength) * canvas.width;
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(x - 3, canvas.height / 2 - 10, 6, 20);
        });
        
        // 绘制列车位置
        const trainX = (this.train.position / this.track.totalLength) * canvas.width;
        ctx.fillStyle = '#e94560';
        ctx.beginPath();
        ctx.arc(trainX, canvas.height / 2, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    checkLevelConditions() {
        const currentStation = this.track.getCurrentStation(this.train.position);
        
        // 检查是否到达站点
        if (currentStation && currentStation !== this.lastStation) {
            this.lastStation = currentStation;
            
            if (currentStation.name === this.track.stations[this.track.stations.length - 1].name) {
                // 到达终点
                this.levelComplete();
            }
        }
        
        // 检查超速
        const speedLimit = this.physics.getSpeedLimit(this.train.position);
        if (this.train.getSpeedKmh() > speedLimit + 10) {
            this.showWarning('超速警告！请减速！');
        }
    }
    
    levelComplete() {
        this.isPaused = true;
        
        const stats = {
            time: Utils.formatTime(this.gameTime),
            avgSpeed: Math.round((this.train.position / 1000) / (this.gameTime / 3600)),
            punctuality: Math.max(0, 100 - Math.abs(this.gameTime - 1800) / 18)
        };
        
        document.getElementById('finalTime').textContent = stats.time;
        document.getElementById('avgSpeed').textContent = stats.avgSpeed;
        document.getElementById('punctuality').textContent = stats.punctuality.toFixed(0);
        
        // 星级评价
        const stars = stats.punctuality > 90 ? '⭐⭐⭐' : 
                      stats.punctuality > 70 ? '⭐⭐' : '⭐';
        document.getElementById('stars').textContent = stars;
        
        document.getElementById('levelComplete').classList.remove('hidden');
    }
    
    showWarning(text) {
        const panel = document.getElementById('warningPanel');
        document.getElementById('warningText').textContent = text;
        panel.classList.remove('hidden');
        
        setTimeout(() => {
            panel.classList.add('hidden');
        }, 2000);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            document.getElementById('pauseMenu').classList.remove('hidden');
        } else {
            document.getElementById('pauseMenu').classList.add('hidden');
        }
    }
    
    playHorn() {
        // 播放鸣笛音效（简化版）
        console.log('🔔 鸣笛！');
        
        // 闪烁提示
        const btn = document.getElementById('hornBtn');
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 200);
    }
    
    toggleLights() {
        this.lightsOn = !this.lightsOn;
        
        if (this.headlight) {
            this.headlight.intensity = this.lightsOn ? 2 : 0;
        }
        
        const btn = document.getElementById('lightBtn');
        btn.style.opacity = this.lightsOn ? '1' : '0.5';
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// 全局游戏实例
let game = null;

// 辅助函数
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function updateLoadingProgress(percent, text) {
    document.getElementById('loadingProgress').style.width = percent + '%';
    if (text) {
        document.getElementById('loadingText').textContent = text;
    }
}

function selectTrain(type) {
    document.querySelectorAll('.train-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-train="${type}"]`).classList.add('selected');
    
    if (game) {
        game.selectedTrain = type;
    }
}

function startGame(mode) {
    if (!game) {
        game = new Game();
    }
    game.selectedTrain = document.querySelector('.train-card.selected')?.dataset.train || 'hexie';
    game.start(mode);
}

function resumeGame() {
    if (game) {
        game.isPaused = false;
        document.getElementById('pauseMenu').classList.add('hidden');
    }
}

function restartGame() {
    if (game) {
        game.isPaused = false;
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('levelComplete').classList.add('hidden');
        game.start(game.gameMode);
    }
}

function exitGame() {
    if (game) {
        game.isRunning = false;
        game.isPaused = false;
    }
    showScreen('startScreen');
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('levelComplete').classList.add('hidden');
}
