// 天气系统
class Weather {
    constructor(scene) {
        this.scene = scene;
        this.currentWeather = 'clear'; // clear, rain, snow, fog
        this.particles = null;
        this.fog = null;
        this.intensity = 0;
    }
    
    setWeather(type, intensity = 0.5) {
        this.clearWeather();
        this.currentWeather = type;
        this.intensity = intensity;
        
        switch(type) {
            case 'rain':
                this.createRain(intensity);
                break;
            case 'snow':
                this.createSnow(intensity);
                break;
            case 'fog':
                this.createFog(intensity);
                break;
        }
    }
    
    createRain(intensity) {
        const particleCount = Math.floor(5000 * intensity);
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = Utils.random(-500, 500);
            positions[i * 3 + 1] = Utils.random(0, 300);
            positions[i * 3 + 2] = Utils.random(-500, 500);
            velocities[i] = Utils.random(20, 30);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.userData.velocities = velocities;
        
        const material = new THREE.PointsMaterial({
            color: 0xaaaaff,
            size: 0.5,
            transparent: true,
            opacity: 0.6
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    createSnow(intensity) {
        const particleCount = Math.floor(3000 * intensity);
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = Utils.random(-500, 500);
            positions[i * 3 + 1] = Utils.random(0, 300);
            positions[i * 3 + 2] = Utils.random(-500, 500);
            velocities[i] = Utils.random(2, 5);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.userData.velocities = velocities;
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            transparent: true,
            opacity: 0.8
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    createFog(intensity) {
        this.fog = new THREE.FogExp2(0xcccccc, 0.002 * intensity);
        this.scene.fog = this.fog;
    }
    
    clearWeather() {
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles = null;
        }
        if (this.fog) {
            this.scene.fog = null;
            this.fog = null;
        }
    }
    
    update(deltaTime, playerPosition) {
        if (!this.particles) return;
        
        const positions = this.particles.geometry.attributes.position.array;
        const velocities = this.particles.geometry.userData.velocities;
        
        for (let i = 0; i < positions.length / 3; i++) {
            // 移动粒子
            if (this.currentWeather === 'rain') {
                positions[i * 3 + 1] -= velocities[i] * deltaTime;
            } else if (this.currentWeather === 'snow') {
                positions[i * 3 + 1] -= velocities[i] * deltaTime;
                positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.1;
            }
            
            // 重置超出范围的粒子
            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 300;
                positions[i * 3 + 2] = playerPosition + Utils.random(-500, 500);
            }
            
            // 跟随玩家
            if (Math.abs(positions[i * 3 + 2] - playerPosition) > 500) {
                positions[i * 3 + 2] = playerPosition + Utils.random(-500, 500);
            }
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
    }
}
