// 列车配置数据
const TrainConfigs = {
    hexie: {
        name: '和谐号 CRH380A',
        maxSpeed: 380, // km/h
        acceleration: 0.8, // m/s²
        deceleration: 1.2, // m/s²
        emergencyDecel: 2.5, // m/s²
        length: 200, // 米
        cars: 8, // 车厢数
        color: 0x1e3c72,
        stripeColor: 0x2a5298,
        mass: 450000, // kg
        dragCoefficient: 0.13,
        description: '中国高速铁路主力车型之一，以平稳舒适著称'
    },
    
    fuxing: {
        name: '复兴号 CR400AF',
        maxSpeed: 400, // km/h
        acceleration: 0.9, // m/s²
        deceleration: 1.4, // m/s²
        emergencyDecel: 2.8, // m/s²
        length: 210, // 米
        cars: 8, // 车厢数
        color: 0xe94560,
        stripeColor: 0xff6b6b,
        mass: 470000, // kg
        dragCoefficient: 0.11,
        description: '中国标准动车组，世界领先技术水平'
    }
};

// 列车类
class Train {
    constructor(type) {
        this.config = TrainConfigs[type];
        this.type = type;
        
        // 状态
        this.speed = 0; // m/s
        this.position = 0; // 米（沿轨道）
        this.throttle = 0; // 0-1
        this.brake = 0; // 0-1
        this.emergencyBrake = false;
        
        // 3D对象
        this.mesh = null;
        this.parts = {};
        
        // 创建3D模型
        this.createMesh();
    }
    
    createMesh() {
        this.mesh = new THREE.Group();
        
        const config = this.config;
        const carLength = config.length / config.cars;
        const carWidth = 3.4;
        const carHeight = 3.5;
        
        // 创建每节车厢
        for (let i = 0; i < config.cars; i++) {
            const car = this.createCar(i, carLength, carWidth, carHeight, i === 0 || i === config.cars - 1);
            car.position.x = i * carLength;
            this.mesh.add(car);
        }
        
        // 整体偏移使列车中心在原点
        this.mesh.position.x = -config.length / 2;
    }
    
    createCar(index, length, width, height, isEnd) {
        const car = new THREE.Group();
        const config = this.config;
        
        // 车身主体
        const bodyGeometry = new THREE.BoxGeometry(length - 0.5, height - 0.5, width);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 100
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = height / 2;
        car.add(body);
        
        // 车顶（圆弧形）
        const roofGeometry = new THREE.CylinderGeometry(width / 2, width / 2, length - 0.5, 16, 1, false, 0, Math.PI);
        const roofMaterial = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 100
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.rotation.z = Math.PI / 2;
        roof.position.y = height;
        car.add(roof);
        
        // 装饰条纹
        const stripeGeometry = new THREE.BoxGeometry(length - 0.3, 0.3, width + 0.1);
        const stripeMaterial = new THREE.MeshPhongMaterial({
            color: config.stripeColor,
            shininess: 120
        });
        
        // 上条纹
        const topStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        topStripe.position.y = height - 0.5;
        car.add(topStripe);
        
        // 下条纹
        const bottomStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        bottomStripe.position.y = 0.5;
        car.add(bottomStripe);
        
        // 车窗
        const windowCount = Math.floor((length - 2) / 1.5);
        const windowMaterial = new THREE.MeshPhongMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.7,
            shininess: 150
        });
        
        for (let i = 0; i < windowCount; i++) {
            const windowGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.05);
            const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
            windowMesh.position.set(
                -length / 2 + 1 + i * 1.5,
                height / 2 + 0.3,
                width / 2 + 0.02
            );
            car.add(windowMesh);
            
            // 对称的另一侧
            const windowMesh2 = windowMesh.clone();
            windowMesh2.position.z = -width / 2 - 0.02;
            car.add(windowMesh2);
        }
        
        // 车轮/转向架
        const bogieGeometry = new THREE.BoxGeometry(2.5, 0.5, 2.5);
        const bogieMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        const frontBogie = new THREE.Mesh(bogieGeometry, bogieMaterial);
        frontBogie.position.set(length / 4, 0.25, 0);
        car.add(frontBogie);
        
        const rearBogie = new THREE.Mesh(bogieGeometry, bogieMaterial);
        rearBogie.position.set(-length / 4, 0.25, 0);
        car.add(rearBogie);
        
        // 车轮
        const wheelGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.2, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        const wheelPositions = [
            [length / 4 - 0.6, 0.45, width / 2 + 0.1],
            [length / 4 + 0.6, 0.45, width / 2 + 0.1],
            [length / 4 - 0.6, 0.45, -width / 2 - 0.1],
            [length / 4 + 0.6, 0.45, -width / 2 - 0.1],
            [-length / 4 - 0.6, 0.45, width / 2 + 0.1],
            [-length / 4 + 0.6, 0.45, width / 2 + 0.1],
            [-length / 4 - 0.6, 0.45, -width / 2 - 0.1],
            [-length / 4 + 0.6, 0.45, -width / 2 - 0.1]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(...pos);
            car.add(wheel);
        });
        
        // 车头/车尾特殊处理
        if (isEnd) {
            // 流线型车头
            const noseGeometry = new THREE.ConeGeometry(width / 2, 4, 16);
            const noseMaterial = new THREE.MeshPhongMaterial({
                color: config.color,
                shininess: 100
            });
            const nose = new THREE.Mesh(noseGeometry, noseMaterial);
            nose.rotation.z = index === 0 ? -Math.PI / 2 : Math.PI / 2;
            nose.position.x = index === 0 ? -length / 2 - 2 : length / 2 + 2;
            nose.position.y = height / 2;
            car.add(nose);
            
            // 前灯
            const lightGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.8);
            const lightMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffaa,
                emissive: 0xffffaa,
                emissiveIntensity: 0.5
            });
            
            const headlight1 = new THREE.Mesh(lightGeometry, lightMaterial);
            headlight1.position.set(
                index === 0 ? -length / 2 - 3.5 : length / 2 + 3.5,
                height / 2 + 0.5,
                0.8
            );
            car.add(headlight1);
            
            const headlight2 = headlight1.clone();
            headlight2.position.z = -0.8;
            car.add(headlight2);
        }
        
        return car;
    }
    
    update(deltaTime) {
        // 物理更新在physics.js中处理
    }
    
    getSpeedKmh() {
        return this.speed * 3.6; // m/s 转 km/h
    }
    
    setSpeedKmh(kmh) {
        this.speed = kmh / 3.6;
    }
}
