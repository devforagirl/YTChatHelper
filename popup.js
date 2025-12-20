const ids = ['fontFamily', 'fontSize', 'fontSizeRandom', 'speed', 'opacity', 'position'];
const elements = {};
ids.forEach(id => elements[id] = document.getElementById(id));
const hideChatCheckbox = document.getElementById('hideChat');
const enabledCheckbox = document.getElementById('enabled');
const rateBtn = document.getElementById('rateBtn');

// ==========================================
// 1. i18n Logic
// ==========================================
const TRANSLATIONS = {
    // English (Default)
    'en': {
        appName: 'YT Chat Helper',
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
        rateMe: 'Rate me 5 stars ★'
    },
    // Simplified Chinese
    'zh': {
        appName: 'YouTube 弹幕助手',
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
        rateMe: '给个五星好评 ★'
    },
    // Traditional Chinese (zh-TW, zh-HK)
    'zh-TW': {
        appName: 'YouTube 彈幕助手',
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
        rateMe: '給個五星好評 ★'
    },
    // Japanese
    'ja': {
        appName: 'YouTube 弾幕ヘルパー',
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
        rateMe: '5つ星で評価する ★'
    },
    // Korean
    'ko': {
        appName: 'YouTube 탄막 도우미',
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
        rateMe: '별 5개 평가하기 ★'
    },
    // French
    'fr': {
        appName: 'Assistant Chat YouTube',
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
        rateMe: 'Notez-moi 5 étoiles ★'
    },
    // Thai
    'th': {
        appName: 'ผู้ช่วยแชท YouTube',
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
        rateMe: 'ให้คะแนน 5 ดาว ★'
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


// ==========================================
// 2. Rate Me Handler
// ==========================================
rateBtn.addEventListener('click', () => {
    // This is a placeholder URL. Replace with real Web Store URL after publishing.
    const fakeUrl = 'https://chrome.google.com/webstore/category/extensions';
    chrome.tabs.create({ url: fakeUrl });
});


// ==========================================
// 3. Existing Settings Logic
// ==========================================
chrome.storage.local.get({
    enabled: true, // Default to enabled
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    fontSizeRandom: 0.05,
    speed: 1.0,
    opacity: 1.0,
    position: 'all',
    hideChat: false
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

document.body.addEventListener('input', (e) => {
    const id = e.target.id;
    if (id === 'enabled' || id === 'hideChat') return;

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