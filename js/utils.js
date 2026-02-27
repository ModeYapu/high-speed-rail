// 工具函数
const Utils = {
    // 数值约束
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    
    // 线性插值
    lerp: (start, end, t) => start + (end - start) * t,
    
    // 角度转弧度
    degToRad: (deg) => deg * Math.PI / 180,
    
    // 弧度转角度
    radToDeg: (rad) => rad * 180 / Math.PI,
    
    // 随机范围
    random: (min, max) => Math.random() * (max - min) + min,
    
    // 格式化时间
    formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // 格式化距离
    formatDistance: (meters) => {
        if (meters >= 1000) {
            return (meters / 1000).toFixed(2);
        }
        return meters.toFixed(0);
    },
    
    // 平滑过渡
    smoothStep: (x) => x * x * (3 - 2 * x),
    
    // 缓动函数
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    
    // 颜色插值
    lerpColor: (color1, color2, t) => {
        const r = Math.round(Utils.lerp(color1.r, color2.r, t));
        const g = Math.round(Utils.lerp(color1.g, color2.g, t));
        const b = Math.round(Utils.lerp(color1.b, color2.b, t));
        return { r, g, b };
    }
};

// 简单的信号/事件系统
class Signal {
    constructor() {
        this.listeners = [];
    }
    
    add(callback) {
        this.listeners.push(callback);
    }
    
    remove(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    emit(...args) {
        this.listeners.forEach(callback => callback(...args));
    }
}

// 对象池
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }
    
    get() {
        let obj = this.pool.pop();
        if (!obj) {
            obj = this.createFn();
        }
        this.active.push(obj);
        return obj;
    }
    
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    
    releaseAll() {
        while (this.active.length > 0) {
            this.release(this.active[0]);
        }
    }
}
