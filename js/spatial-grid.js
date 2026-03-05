/**
 * 空间哈希网格 - 优化环境对象距离检查
 * 性能提升: O(n) → O(1) 查找
 */

class SpatialGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.objectCount = 0;
    }

    /**
     * 添加对象到网格
     */
    add(object) {
        if (!object.position) return;

        const cellX = Math.floor(object.position.x / this.cellSize);
        const cellZ = Math.floor(object.position.z / this.cellSize);
        const key = `${cellX},${cellZ}`;

        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }

        this.grid.get(key).push(object);
        this.objectCount++;

        // 保存对象的网格键，用于后续移除
        object._spatialKey = key;
    }

    /**
     * 从网格移除对象
     */
    remove(object) {
        if (!object._spatialKey) return;

        const key = object._spatialKey;
        const cell = this.grid.get(key);

        if (cell) {
            const index = cell.indexOf(object);
            if (index > -1) {
                cell.splice(index, 1);
                this.objectCount--;

                // 如果单元格为空，删除它
                if (cell.length === 0) {
                    this.grid.delete(key);
                }
            }
        }

        delete object._spatialKey;
    }

    /**
     * 更新对象位置
     */
    update(object) {
        if (!object.position) return;

        const newCellX = Math.floor(object.position.x / this.cellSize);
        const newCellZ = Math.floor(object.position.z / this.cellSize);
        const newKey = `${newCellX},${newCellZ}`;

        // 如果单元格未变化，无需更新
        if (object._spatialKey === newKey) {
            return;
        }

        // 从旧单元格移除
        this.remove(object);

        // 添加到新单元格
        this.add(object);
    }

    /**
     * 获取附近的对象
     */
    getNearby(position, radius) {
        const results = [];
        const cellRadius = Math.ceil(radius / this.cellSize);

        const centerCellX = Math.floor(position.x / this.cellSize);
        const centerCellZ = Math.floor(position.z / this.cellSize);

        // 遍历附近的单元格
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dz = -cellRadius; dz <= cellRadius; dz++) {
                const key = `${centerCellX + dx},${centerCellZ + dz}`;
                const cell = this.grid.get(key);

                if (cell) {
                    // 精确距离检查
                    cell.forEach(object => {
                        const distance = this.calculateDistance(position, object.position);
                        if (distance <= radius) {
                            results.push({ object, distance });
                        }
                    });
                }
            }
        }

        // 按距离排序
        results.sort((a, b) => a.distance - b.distance);

        return results.map(r => r.object);
    }

    /**
     * 获取可见对象（相机视锥体）
     */
    getVisible(cameraPosition, viewDistance) {
        return this.getNearby(cameraPosition, viewDistance);
    }

    /**
     * 计算两点距离
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * 清空网格
     */
    clear() {
        this.grid.clear();
        this.objectCount = 0;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            cellCount: this.grid.size,
            objectCount: this.objectCount,
            averageObjectsPerCell: this.grid.size > 0
                ? this.objectCount / this.grid.size
                : 0,
            cellSize: this.cellSize
        };
    }

    /**
     * 调试：可视化网格（仅在开发环境）
     */
    visualize(scene) {
        if (!scene) return;

        // 移除旧的网格可视化
        const oldGrid = scene.getObjectByName('spatial-grid-debug');
        if (oldGrid) {
            scene.remove(oldGrid);
        }

        // 创建新的网格可视化
        const gridGroup = new THREE.Group();
        gridGroup.name = 'spatial-grid-debug';

        this.grid.forEach((objects, key) => {
            const [cellX, cellZ] = key.split(',').map(Number);

            // 绘制单元格边框
            const geometry = new THREE.PlaneGeometry(
                this.cellSize,
                this.cellSize
            );
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.1,
                wireframe: true
            });

            const cell = new THREE.Mesh(geometry, material);
            cell.rotation.x = -Math.PI / 2;
            cell.position.set(
                cellX * this.cellSize + this.cellSize / 2,
                0.1,
                cellZ * this.cellSize + this.cellSize / 2
            );

            gridGroup.add(cell);
        });

        scene.add(gridGroup);
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.SpatialGrid = SpatialGrid;
}
