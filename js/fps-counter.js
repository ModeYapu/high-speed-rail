// FPS计数器
class FPSCounter {
    constructor() {
        this.fps = 0;
        this.frames = 0;
        this.lastTime = performance.now();
        this.updateInterval = 1000;  // 每秒更新一次

        this.element = null;
        this.visible = false;

        this.init();
    }

    init() {
        // 创建DOM元素
        this.element = document.createElement('div');
        this.element.id = 'fpsCounter';
        this.element.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #00ff00;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
            z-index: 9999;
            display: none;
        `;
        this.element.textContent = 'FPS: --';

        document.body.appendChild(this.element);
    }

    update(currentTime) {
        this.frames++;

        const elapsed = currentTime - this.lastTime;

        if (elapsed >= this.updateInterval) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.frames = 0;
            this.lastTime = currentTime;

            if (this.visible && this.element) {
                this.element.textContent = `FPS: ${this.fps}`;

                // 根据FPS改变颜色
                if (this.fps >= 55) {
                    this.element.style.color = '#00ff00';  // 绿色 - 优秀
                } else if (this.fps >= 30) {
                    this.element.style.color = '#ffff00';  // 黄色 - 一般
                } else {
                    this.element.style.color = '#ff0000';  // 红色 - 差
                }
            }
        }
    }

    show() {
        this.visible = true;
        if (this.element) {
            this.element.style.display = 'block';
        }
    }

    hide() {
        this.visible = false;
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
        return this.visible;
    }
}

// 创建全局FPS计数器
const fpsCounter = new FPSCounter();
