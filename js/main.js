// 主入口
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚄 高铁模拟驾驶游戏启动');
    
    // 默认选择和谐号
    selectTrain('hexie');
    
    // 预加载资源提示
    console.log('提示: 选择列车和模式后点击开始游戏');
    console.log('操作: W/↑加速, S/↓减速, 空格紧急制动, ESC暂停');
});
