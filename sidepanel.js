const fontFamilySelect = document.getElementById('fontFamily');
const fontSizeInput = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const fontSizeRandomInput = document.getElementById('fontSizeRandom');
const fontSizeRandomValue = document.getElementById('fontSizeRandomValue');
const speedInput = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const opacityInput = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const positionSelect = document.getElementById('position');

// 初始化加载设置 (带有默认回退值)
chrome.storage.local.get({
    fontFamily: 'Arial',
    fontSize: 24,
    fontSizeRandom: 0.05,
    speed: 1.0,
    opacity: 1.0,
    position: 'all'
}, (res) => {
    fontFamilySelect.value = res.fontFamily;
    
    fontSizeInput.value = res.fontSize;
    fontSizeValue.textContent = res.fontSize;
    
    fontSizeRandomInput.value = res.fontSizeRandom;
    fontSizeRandomValue.textContent = Math.round(res.fontSizeRandom * 100);
    
    speedInput.value = res.speed;
    speedValue.textContent = parseFloat(res.speed).toFixed(1);
    
    opacityInput.value = res.opacity;
    opacityValue.textContent = res.opacity;
    
    positionSelect.value = res.position;
});

fontFamilySelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ fontFamily: e.target.value });
});

fontSizeInput.addEventListener('input', (e) => {
    const val = e.target.value;
    fontSizeValue.textContent = val;
    chrome.storage.local.set({ fontSize: val });
});

fontSizeRandomInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    fontSizeRandomValue.textContent = Math.round(val * 100);
    chrome.storage.local.set({ fontSizeRandom: val });
});

speedInput.addEventListener('input', (e) => {
    const val = e.target.value;
    speedValue.textContent = parseFloat(val).toFixed(1);
    chrome.storage.local.set({ speed: val });
});

opacityInput.addEventListener('input', (e) => {
    const val = e.target.value;
    opacityValue.textContent = val;
    chrome.storage.local.set({ opacity: val });
});

positionSelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ position: e.target.value });
});
