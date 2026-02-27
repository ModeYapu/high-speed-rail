// 轨道和环境
class Track {
    constructor() {
        this.segments = [];
        this.stations = [];
        this.totalLength = 50000; // 50公里
        this.environmentObjects = [];
        
        this.generateTrack();
    }
    
    generateTrack() {
        // 生成站点
        this.stations = [
            { name: '北京南站', position: 0, platform: 400 },
            { name: '天津南站', position: 12000, platform: 350 },
            { name: '济南西站', position: 25000, platform: 380 },
            { name: '南京南站', position: 40000, platform: 400 },
            { name: '上海虹桥', position: 50000, platform: 450 }
        ];
        
        // 生成轨道段
        for (let i = 0; i < this.stations.length - 1; i++) {
            const start = this.stations[i];
            const end = this.stations[i + 1];
            
            this.segments.push({
                start: start.position,
                end: end.position,
                curvature: this.calculateCurvature(start.position, end.position),
                elevation: this.calculateElevation(start.position, end.position),
                speedLimit: this.getSpeedLimit(start.position, end.position)
            });
        }
    }
    
    calculateCurvature(start, end) {
        // 简化的曲率计算
        const distance = end - start;
        const curves = [];
        
        // 每5公里可能有一个弯道
        for (let pos = start; pos < end; pos += 5000) {
            if (Math.random() > 0.6) {
                curves.push({
                    start: pos,
                    end: pos + 2000,
                    radius: Utils.random(3000, 7000) // 弯道半径
                });
            }
        }
        
        return curves;
    }
    
    calculateElevation(start, end) {
        // 简化的高程变化
        return (end - start) * 0.001; // 0.1% 坡度
    }
    
    getSpeedLimit(start, end) {
        // 速度限制
        const midPoint = (start + end) / 2;
        
        // 站点附近限速
        for (const station of this.stations) {
            if (Math.abs(midPoint - station.position) < 5000) {
                return 80; // 站点附近限速80km/h
            }
        }
        
        return 350; // 其他区域350km/h
    }
    
    getNextStation(position) {
        for (const station of this.stations) {
            if (station.position > position) {
                return station;
            }
        }
        return null;
    }
    
    getCurrentStation(position) {
        for (const station of this.stations) {
            if (Math.abs(position - station.position) < station.platform) {
                return station;
            }
        }
        return null;
    }
}

// 环境（地形、建筑等）
class Environment {
    constructor(scene, track) {
        this.scene = scene;
        this.track = track;
        this.ground = null;
        this.skybox = null;
        this.buildings = [];
        this.trees = [];
        this.poles = [];
        
        this.createEnvironment();
    }
    
    createEnvironment() {
        // 地面
        this.createGround();
        
        // 天空盒
        this.createSkybox();
        
        // 轨道
        this.createRailway();
        
        // 环境物体
        this.createBuildings();
        this.createTrees();
        this.createPoles();
        
        // 光照
        this.createLighting();
    }
    
    createGround() {
        // 大型地面
        const groundGeometry = new THREE.PlaneGeometry(10000, this.track.totalLength);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x3d6b3d,
            side: THREE.DoubleSide
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = Math.PI / 2;
        this.ground.position.y = -0.5;
        this.scene.add(this.ground);
        
        // 路基
        const bedGeometry = new THREE.BoxGeometry(15, 1, this.track.totalLength);
        const bedMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const bed = new THREE.Mesh(bedGeometry, bedMaterial);
        bed.position.y = 0;
        this.scene.add(bed);
    }
    
    createSkybox() {
        // 渐变天空
        const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077be) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 400 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skybox);
    }
    
    createRailway() {
        // 铁轨
        const railGeometry = new THREE.BoxGeometry(0.1, 0.15, this.track.totalLength);
        const railMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        
        const leftRail = new THREE.Mesh(railGeometry, railMaterial);
        leftRail.position.set(-0.75, 0.6, 0);
        this.scene.add(leftRail);
        
        const rightRail = new THREE.Mesh(railGeometry, railMaterial);
        rightRail.position.set(0.75, 0.6, 0);
        this.scene.add(rightRail);
        
        // 枕木
        const sleeperGeometry = new THREE.BoxGeometry(2.5, 0.15, 0.25);
        const sleeperMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
        
        for (let z = 0; z < this.track.totalLength; z += 0.6) {
            const sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial);
            sleeper.position.set(0, 0.4, z);
            this.scene.add(sleeper);
        }
    }
    
    createBuildings() {
        const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
        
        // 沿轨道生成建筑
        for (let z = 100; z < this.track.totalLength; z += Utils.random(200, 500)) {
            if (Math.random() > 0.3) {
                const width = Utils.random(10, 30);
                const height = Utils.random(15, 80);
                const depth = Utils.random(10, 30);
                
                const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
                const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
                
                const side = Math.random() > 0.5 ? 1 : -1;
                building.position.set(
                    side * Utils.random(50, 200),
                    height / 2,
                    z
                );
                
                this.scene.add(building);
                this.buildings.push(building);
            }
        }
    }
    
    createTrees() {
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
        const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
        
        for (let z = 50; z < this.track.totalLength; z += Utils.random(30, 80)) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = side * Utils.random(20, 100);
            
            // 树干
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(x, 2, z);
            this.scene.add(trunk);
            
            // 树冠
            const leavesGeometry = new THREE.ConeGeometry(2, 5, 8);
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.set(x, 6, z);
            this.scene.add(leaves);
            
            this.trees.push({ trunk, leaves });
        }
    }
    
    createPoles() {
        const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
        
        // 电线杆
        for (let z = 0; z < this.track.totalLength; z += 50) {
            const poleGeometry = new THREE.CylinderGeometry(0.2, 0.3, 12, 8);
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            
            const side = z % 100 === 0 ? 5 : -5;
            pole.position.set(side, 6, z);
            this.scene.add(pole);
            
            this.poles.push(pole);
        }
    }
    
    createLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // 平行光（太阳）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 200, 100);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // 半球光
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3d6b3d, 0.4);
        this.scene.add(hemisphereLight);
    }
    
    update(playerPosition) {
        // 动态加载/卸载远处物体（优化性能）
        const viewDistance = 5000;
        
        this.buildings.forEach(building => {
            const distance = Math.abs(building.position.z - playerPosition);
            building.visible = distance < viewDistance;
        });
        
        this.trees.forEach(tree => {
            const distance = Math.abs(tree.trunk.position.z - playerPosition);
            tree.trunk.visible = distance < viewDistance;
            tree.leaves.visible = distance < viewDistance;
        });
    }
}
