// 设置面板控制函数

function showSettings() {
    // 暂停游戏
    if (game && !game.isPaused) {
        game.togglePause();
    }

    // 显示设置面板
    document.getElementById('settingsPanel').classList.remove('hidden');

    // 加载当前设置
    loadSettingsUI();
}

function hideSettings() {
    document.getElementById('settingsPanel').classList.add('hidden');
}

function loadSettingsUI() {
    const settings = settingsManager.settings;

    // 音频设置
    document.getElementById('masterVolume').value = settings.masterVolume * 100;
    document.getElementById('masterVolumeValue').textContent = Math.round(settings.masterVolume * 100) + '%';

    document.getElementById('sfxVolume').value = settings.sfxVolume * 100;
    document.getElementById('sfxVolumeValue').textContent = Math.round(settings.sfxVolume * 100) + '%';

    document.getElementById('ambientVolume').value = settings.ambientVolume * 100;
    document.getElementById('ambientVolumeValue').textContent = Math.round(settings.ambientVolume * 100) + '%';

    // 图形设置
    document.getElementById('graphics').value = settings.graphics;
    document.getElementById('showFPS').checked = settings.showFPS;

    // 游戏设置
    document.getElementById('difficulty').value = settings.difficulty;
}

function updateSetting(key, value) {
    // 更新设置
    settingsManager.settings[key] = value;

    // 保存设置
    settingsManager.save();

    // 应用设置
    settingsManager.apply();

    // 更新UI显示
    if (key.includes('Volume')) {
        const valueElement = document.getElementById(key + 'Value');
        if (valueElement) {
            valueElement.textContent = Math.round(value * 100) + '%';
        }
    }

    // 特殊处理：FPS显示
    if (key === 'showFPS') {
        if (value) {
            fpsCounter.show();
        } else {
            fpsCounter.hide();
        }
    }

    console.log(`✅ 设置已更新: ${key} = ${value}`);
}

function resetSettings() {
    // 重置设置
    settingsManager.reset();

    // 重新加载UI
    loadSettingsUI();

    // 应用设置
    settingsManager.apply();

    // 隐藏FPS
    if (!settingsManager.settings.showFPS) {
        fpsCounter.hide();
    }

    alert('设置已恢复默认值');
}

console.log('✅ 设置UI控制器已加载');
