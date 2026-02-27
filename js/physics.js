// 物理引擎
class Physics {
    constructor(train, track) {
        this.train = train;
        this.track = track;
        
        // 物理常数
        this.gravity = 9.81;
        this.airDensity = 1.225; // kg/m³
        this.rollingResistance = 0.002;
    }
    
    update(deltaTime) {
        const train = this.train;
        const config = train.config;
        
        // 当前速度 km/h
        const speedKmh = train.getSpeedKmh();
        
        // 牵引力
        let tractionForce = 0;
        if (train.throttle > 0 && train.speed < config.maxSpeed / 3.6) {
            // 电机功率限制的牵引力
            const maxPower = config.mass * config.acceleration * (config.maxSpeed / 3.6);
            const currentPower = maxPower * train.throttle;
            
            if (train.speed > 1) {
                tractionForce = currentPower / train.speed;
            } else {
                tractionForce = config.mass * config.acceleration * train.throttle;
            }
        }
        
        // 制动力
        let brakeForce = 0;
        if (train.brake > 0) {
            brakeForce = config.mass * config.deceleration * train.brake;
        }
        
        // 紧急制动
        if (train.emergencyBrake) {
            brakeForce = config.mass * config.emergencyDecel;
        }
        
        // 空气阻力
        const frontalArea = 10; // m²
        const dragForce = 0.5 * this.airDensity * config.dragCoefficient * frontalArea * train.speed * train.speed;
        
        // 滚动阻力
        const rollingForce = config.mass * this.gravity * this.rollingResistance;
        
        // 坡度阻力（简化）
        const grade = this.getGrade(train.position);
        const gradeForce = config.mass * this.gravity * Math.sin(grade);
        
        // 弯道阻力（简化）
        const curveForce = this.getCurveForce(train.position, train.speed);
        
        // 合力
        const totalForce = tractionForce - brakeForce - dragForce - rollingForce - gradeForce - curveForce;
        
        // 加速度
        const acceleration = totalForce / config.mass;
        
        // 更新速度
        train.speed = Math.max(0, train.speed + acceleration * deltaTime);
        
        // 限制最大速度
        const maxSpeedMs = config.maxSpeed / 3.6;
        train.speed = Math.min(train.speed, maxSpeedMs);
        
        // 更新位置
        train.position += train.speed * deltaTime;
        
        // 限制位置范围
        train.position = Utils.clamp(train.position, 0, this.track.totalLength);
    }
    
    getGrade(position) {
        // 获取当前坡度（简化）
        const segment = this.getCurrentSegment(position);
        if (segment) {
            return segment.elevation / (segment.end - segment.start);
        }
        return 0;
    }
    
    getCurveForce(position, speed) {
        // 弯道阻力
        const segment = this.getCurrentSegment(position);
        if (segment && segment.curvature) {
            for (const curve of segment.curvature) {
                if (position >= curve.start && position <= curve.end) {
                    // 离心力产生的横向力
                    const lateralAccel = (speed * speed) / curve.radius;
                    return this.train.config.mass * lateralAccel * 0.1; // 简化
                }
            }
        }
        return 0;
    }
    
    getCurrentSegment(position) {
        for (const segment of this.track.segments) {
            if (position >= segment.start && position < segment.end) {
                return segment;
            }
        }
        return null;
    }
    
    getSpeedLimit(position) {
        const segment = this.getCurrentSegment(position);
        return segment ? segment.speedLimit : 350;
    }
}
