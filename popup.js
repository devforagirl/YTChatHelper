const ids = ['fontFamily', 'fontSize', 'fontSizeRandom', 'speed', 'opacity', 'position'];
const elements = {};
ids.forEach(id => elements[id] = document.getElementById(id));
const hideChatCheckbox = document.getElementById('hideChat');
const debugModeCheckbox = document.getElementById('debugMode');
const enabledCheckbox = document.getElementById('enabled');

// ==========================================
// 1. i18n Logic
// ==========================================
const TRANSLATIONS = {
    // English (Default)
    'en': {
        fonts: 'Fonts',
        fontSize: 'Font Size',
        fontRandomSize: 'Font Random Size',
        movingSpeed: 'Moving Speed',
        opacity: 'Opacity',
        displayArea: 'Display Area',
        fullScreen: 'Full Screen',
        topHalf: 'Top Half (50%)',
        bottomHalf: 'Bottom Half (50%)',
        hideChatWindow: 'Hide Chat Window',
        debugMode: 'Debug Mode (Logs)'
    },
    // Simplified Chinese
    'zh': {
        fonts: '字体',
        fontSize: '字体大小',
        fontRandomSize: '字体随机大小',
        movingSpeed: '移动速度',
        opacity: '不透明度',
        displayArea: '显示区域',
        fullScreen: '全屏显示',
        topHalf: '上半屏 (50%)',
        bottomHalf: '下半屏 (50%)',
        hideChatWindow: '隐藏聊天窗口',
        debugMode: '调试模式 (控制台日志)'
    },
    // Traditional Chinese (zh-TW, zh-HK)
    'zh-TW': {
        fonts: '字體',
        fontSize: '字體大小',
        fontRandomSize: '字體隨機大小',
        movingSpeed: '移動速度',
        opacity: '不透明度',
        displayArea: '顯示區域',
        fullScreen: '全螢幕顯示',
        topHalf: '上半屏 (50%)',
        bottomHalf: '下半屏 (50%)',
        hideChatWindow: '隱藏聊天視窗',
        debugMode: '調試模式 (控制台日誌)'
    },
    // Japanese
    'ja': {
        fonts: 'フォント',
        fontSize: '文字サイズ',
        fontRandomSize: '文字サイズ (ランダム)',
        movingSpeed: '移動速度',
        opacity: '不透明度',
        displayArea: '表示エリア',
        fullScreen: '全画面',
        topHalf: '上半分 (50%)',
        bottomHalf: '下半分 (50%)',
        hideChatWindow: 'チャット欄を隠す',
        debugMode: 'デバッグモード (ログ)'
    },
    // Korean
    'ko': {
        fonts: '글꼴',
        fontSize: '글자 크기',
        fontRandomSize: '글자 크기 (랜덤)',
        movingSpeed: '이동 속도',
        opacity: '불투명도',
        displayArea: '표시 영역',
        fullScreen: '전체 화면',
        topHalf: '상단 (50%)',
        bottomHalf: '하단 (50%)',
        hideChatWindow: '채팅창 숨기기',
        debugMode: '디버그 모드'
    },
    // French
    'fr': {
        fonts: 'Polices',
        fontSize: 'Taille de police',
        fontRandomSize: 'Taille aléatoire',
        movingSpeed: 'Vitesse',
        opacity: 'Opacité',
        displayArea: 'Zone d\'affichage',
        fullScreen: 'Plein écran',
        topHalf: 'Moitié supérieure',
        bottomHalf: 'Moitié inférieure',
        hideChatWindow: 'Masquer le chat',
        debugMode: 'Mode débogage'
    },
    // Thai
    'th': {
        fonts: 'แบบอักษร',
        fontSize: 'ขนาดตัวอักษร',
        fontRandomSize: 'ขนาดสุ่ม',
        movingSpeed: 'ความเร็ว',
        opacity: 'ความทึบแสง',
        displayArea: 'พื้นที่แสดงผล',
        fullScreen: 'เต็มหน้าจอ',
        topHalf: 'ครึ่งบน',
        bottomHalf: 'ครึ่งล่าง',
        hideChatWindow: 'ซ่อนหน้าต่างแชท',
        debugMode: 'โหมดดีบัก'
    }
};

function applyI18n() {
    // 1. Get Browser Language (e.g. 'en-US', 'zh-CN', 'ja')
    const userLang = navigator.language;
    
    // 2. Match Dictionary Key
    let langKey = 'en'; // Default English
    
    if (userLang.startsWith('zh')) {
        // Special handling for Traditional Chinese
        langKey = (userLang === 'zh-TW' || userLang === 'zh-HK') ? 'zh-TW' : 'zh';
    } else {
        // Other languages use prefix (e.g., 'fr-CA' -> 'fr')
        const prefix = userLang.split('-')[0];
        if (TRANSLATIONS[prefix]) {
            langKey = prefix;
        }
    }

    const t = TRANSLATIONS[langKey];

    // 3. Replace content for all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });
}

// Apply translation immediately
applyI18n();

// Set dynamic version
const manifest = chrome.runtime.getManifest();
document.getElementById('appTitle').textContent = `Livechat Danmaku Helper v${manifest.version}`;


// ==========================================
// 2. Settings Logic
// ==========================================
chrome.storage.local.get({
    enabled: true, // Default to enabled
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    fontSizeRandom: 0.05,
    speed: 1.0,
    opacity: 1.0,
    position: 'all',
    hideChat: false,
    debugMode: false
}, (res) => {
    enabledCheckbox.checked = res.enabled;
    updateUiState(res.enabled);

    Object.keys(res).forEach(key => {
        if (elements[key]) {
            elements[key].value = res[key];
            updateDisplay(key, res[key]);
        }
    });
    hideChatCheckbox.checked = res.hideChat;
    debugModeCheckbox.checked = res.debugMode || false;
});

// Listen for Power Switch
enabledCheckbox.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ enabled: isEnabled });
    updateUiState(isEnabled);
});

// Listen for Hide Chat
hideChatCheckbox.addEventListener('change', (e) => {
    chrome.storage.local.set({ hideChat: e.target.checked });
});

// Listen for Debug Mode
debugModeCheckbox.addEventListener('change', (e) => {
    chrome.storage.local.set({ debugMode: e.target.checked });
});

document.body.addEventListener('input', (e) => {
    const id = e.target.id;
    if (id === 'enabled' || id === 'hideChat' || id === 'debugMode') return;

    const val = e.target.value;
    const update = {};
    update[id] = (id === 'fontFamily' || id === 'position') ? val : parseFloat(val);
    chrome.storage.local.set(update);
    
    updateDisplay(id, val);
});

function updateDisplay(id, val) {
    const display = document.getElementById(id + 'Value');
    if (display) {
        if (id === 'fontSizeRandom') display.textContent = Math.round(val * 100);
        else if (id === 'speed') display.textContent = parseFloat(val).toFixed(1);
        else display.textContent = val;
    }
}

function updateUiState(isEnabled) {
    if (isEnabled) {
        document.body.classList.remove('disabled');
    } else {
        document.body.classList.add('disabled');
    }
}
