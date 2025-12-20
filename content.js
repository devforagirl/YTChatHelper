(function() {
    // ==========================================
    // Constants & Selectors (Centralized Management)
    // ==========================================
    const SELECTORS = {
        CHAT_CONTAINER: [
            '#items.style-scope.yt-live-chat-item-list-renderer',
            '#chat-messages #items', 
            'yt-live-chat-item-list-renderer'
        ],
        CHAT_MESSAGE_TEXT: '#message',
        PLAYER_CONTAINER: [
            '#movie_player', 
            '.html5-video-player', 
            '#ytd-player'
        ],
        HIDE_CHAT_TARGETS: 'ytd-live-chat-frame, #chat, #panels-full-bleed-container'
    };

    const CONSTANTS = {
        RESIZE_THROTTLE_MS: 150,
        OBSERVER_CHECK_INTERVAL_MS: 2000,
        SAFE_MARGIN_PX: 80
    };

    const CONTEXT = {
        isTopFrame: window.self === window.top,
        isWatchPage: window.location.pathname === '/watch',
        isChatIframe: window.location.pathname.includes('/live_chat')
    };

    // ==========================================
    // Module: ConfigManager
    // ==========================================
    class ConfigManager {
        constructor(onUpdate) {
            this.config = {
                enabled: true,
                fontFamily: 'Arial, sans-serif',
                fontSize: 24,
                fontSizeRandom: 0.05,
                speed: 1.0,
                opacity: 1.0,
                position: 'all',
                hideChat: false
            };
            this.onUpdate = onUpdate;
            this.init();
        }

        init() {
            chrome.storage.local.get(this.config, (res) => {
                Object.assign(this.config, res);
                this.notify();
            });

            chrome.storage.onChanged.addListener((changes) => {
                let hasChanges = false;
                for (let [key, { newValue }] of Object.entries(changes)) {
                    if (typeof this.config[key] === 'number') {
                        this.config[key] = parseFloat(newValue);
                    } else {
                        this.config[key] = newValue;
                    }
                    hasChanges = true;
                }
                if (hasChanges) this.notify();
            });
        }

        notify() {
            if (typeof this.onUpdate === 'function') {
                this.onUpdate(this.config);
            }
        }

        get() {
            return this.config;
        }
    }

    // ==========================================
    // Module: StyleInjector
    // ==========================================
    class StyleInjector {
        constructor() {
            this.styleEl = null;
        }

        update(config) {
            // Only hide if global switch is ON and hideChat is TRUE
            const shouldHide = config.enabled && config.hideChat;

            if (!this.styleEl) {
                this.styleEl = document.createElement('style');
                this.styleEl.id = 'yt-danmaku-hide-chat-style';
                document.head.appendChild(this.styleEl);
            }
            this.styleEl.textContent = shouldHide 
                ? `${SELECTORS.HIDE_CHAT_TARGETS} { display: none !important; }` 
                : '';
        }
    }

    // ==========================================
    // Module: DanmakuRenderer
    // ==========================================
    class DanmakuRenderer {
        constructor(configManager) {
            this.configMgr = configManager;
            this.canvas = null;
            this.ctx = null;
            this.danmakus = [];
            this.tracks = [];
            this.playerEl = null;
            this.resizeTimeout = null;
            this.animationFrameId = null;
            this.isRunning = false;

            // Do not auto-start on init, wait for ConfigManager notification
            chrome.runtime.onMessage.addListener((message) => {
                if (message.type === 'ADD_DANMAKU' && this.isRunning) {
                    this.addDanmaku(message.text);
                }
            });
        }

        start() {
            if (this.isRunning) return;
            console.log('YTChatHelper: Renderer Starting...');
            this.isRunning = true;
            this.findPlayerAndMount();
        }

        stop() {
            if (!this.isRunning) return;
            console.log('YTChatHelper: Renderer Stopping...');
            this.isRunning = false;
            
            // Stop animation loop
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            // Clear canvas
            if (this.ctx && this.canvas) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            // Remove Canvas (Optional, or just hide)
            if (this.canvas) {
                this.canvas.remove();
                this.canvas = null;
                this.ctx = null;
            }
            this.danmakus = []; // Clear existing danmakus
        }

        findPlayerAndMount() {
            const find = () => {
                for (let selector of SELECTORS.PLAYER_CONTAINER) {
                    const el = document.querySelector(selector);
                    if (el) return el;
                }
                return null;
            };

            this.playerEl = find();
            
            if (!this.playerEl) {
                setTimeout(() => {
                    if (this.isRunning) this.findPlayerAndMount();
                }, 1000);
                return;
            }
            this.mountCanvas();
        }

        mountCanvas() {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'yt-danmaku-player-layer';
            Object.assign(this.canvas.style, {
                position: 'absolute',
                top: '0', left: '0',
                width: '100%', height: '100%',
                zIndex: '10',
                pointerEvents: 'none',
                backgroundColor: 'transparent'
            });

            this.playerEl.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            const ro = new ResizeObserver(() => this.throttledResize());
            ro.observe(this.playerEl);
            
            this.syncCanvasSize();
            this.animate();
        }

        throttledResize() {
            if (!this.resizeTimeout) {
                this.resizeTimeout = setTimeout(() => {
                    this.syncCanvasSize();
                    this.resizeTimeout = null;
                }, CONSTANTS.RESIZE_THROTTLE_MS);
            }
        }

        syncCanvasSize() {
            if (!this.canvas || !this.playerEl) return;
            const rect = this.playerEl.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.updateTracks();
        }

        updateTracks() {
            if (!this.canvas) return;
            const conf = this.configMgr.get();
            const trackHeight = conf.fontSize * 1.6;
            let startY = 0;
            let endY = this.canvas.height;
            
            if (conf.position === 'top') endY = this.canvas.height / 2;
            else if (conf.position === 'bottom') startY = this.canvas.height / 2;
            
            const trackCount = Math.floor((endY - startY) / trackHeight) - 1;
            
            this.tracks = [];
            for (let i = 0; i < trackCount; i++) {
                this.tracks.push({ 
                    y: startY + (i + 1) * trackHeight, 
                    lastX: 0,
                    lastDanmaku: null
                });
            }
        }

        addDanmaku(text) {
            if (!this.canvas) return;
            this.danmakus.push(new DanmakuItem(text, this.configMgr.get(), this.canvas, this.ctx, this.tracks));
        }

        animate() {
            if (!this.isRunning || !this.ctx) return;
            
            const conf = this.configMgr.get();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = conf.opacity;
            
            for (let i = this.danmakus.length - 1; i >= 0; i--) {
                const d = this.danmakus[i];
                d.update();
                d.draw();
                if (d.isFinished()) {
                    this.danmakus.splice(i, 1);
                }
            }
            
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        }
    }

    // ==========================================
    // Class: DanmakuItem
    // ==========================================
    class DanmakuItem {
        constructor(text, config, canvas, ctx, tracks) {
            this.text = text;
            this.ctx = ctx;
            this.config = config;
            
            const variation = (1 - config.fontSizeRandom) + (Math.random() * config.fontSizeRandom * 2);
            this.fontSize = Math.floor(config.fontSize * variation);
            this.speed = (config.speed * (0.95 + Math.random() * 0.3)) + (Math.random() * 0.3);
            
            this.ctx.font = `bold ${this.fontSize}px ${config.fontFamily}`;
            this.width = this.ctx.measureText(text).width;
            this.x = canvas.width;
            
            this.track = this.findBestTrack(tracks, canvas.width);
            this.y = this.track ? this.track.y : 50;
            
            if (this.track) {
                this.track.lastDanmaku = this;
                this.track.lastX = this.x + this.width;
            }
        }

        findBestTrack(tracks, canvasWidth) {
            if (tracks.length === 0) return null;
            const available = tracks.filter(t => t.lastX < (canvasWidth - CONSTANTS.SAFE_MARGIN_PX));
            if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
            return tracks.reduce((min, t) => t.lastX < min.lastX ? t : min, tracks[0]);
        }

        update() {
            this.x -= this.speed;
            if (this.track && this.track.lastDanmaku === this) {
                this.track.lastX = this.x + this.width;
            }
        }

        draw() {
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 2;
            this.ctx.font = `bold ${this.fontSize}px ${this.config.fontFamily}`;
            this.ctx.strokeText(this.text, this.x, this.y);
            this.ctx.fillText(this.text, this.x, this.y);
        }

        isFinished() {
            return (this.x + this.width) < 0;
        }
    }

    // ==========================================
    // Module: DOMObserver
    // ==========================================
    class DOMObserver {
        constructor() {
            this.observer = null;
            this.targetNode = null;
            this.checkInterval = null;
            this.isRunning = false;
        }

        start() {
            if (this.isRunning) return;
            console.log('YTChatHelper: Observer Starting...');
            this.isRunning = true;
            this.scan();
            this.checkInterval = setInterval(() => this.scan(), CONSTANTS.OBSERVER_CHECK_INTERVAL_MS);
        }

        stop() {
            if (!this.isRunning) return;
            console.log('YTChatHelper: Observer Stopping...');
            this.isRunning = false;
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
            this.targetNode = null;
        }

        scan() {
            if (!this.isRunning) return;
            const node = this.findChatContainer();
            if (node && node !== this.targetNode) {
                this.reconnect(node);
            }
        }

        findChatContainer() {
            for (let selector of SELECTORS.CHAT_CONTAINER) {
                const el = document.querySelector(selector);
                if (el) return el;
            }
            return null;
        }

        reconnect(node) {
            if (this.observer) this.observer.disconnect();
            this.targetNode = node;
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((n) => {
                        if (n.nodeType === 1) {
                            this.processNode(n);
                        }
                    });
                });
            });
            this.observer.observe(node, { childList: true });
        }

        processNode(node) {
            const msgEl = node.querySelector(SELECTORS.CHAT_MESSAGE_TEXT);
            if (msgEl) {
                const text = msgEl.innerText.trim();
                if (text) this.sendMessage(text);
            }
        }

        sendMessage(text) {
            try {
                chrome.runtime.sendMessage({ type: 'NEW_MESSAGE_DATA', text: text });
            } catch (e) {}
        }
    }

    // ==========================================
    // App Entry Point
    // ==========================================
    class App {
        constructor() {
            this.configMgr = new ConfigManager((config) => this.onConfigUpdate(config));
            this.renderer = null;
            this.styleInjector = null;
            this.observer = null;

            if (CONTEXT.isTopFrame && CONTEXT.isWatchPage) {
                this.renderer = new DanmakuRenderer(this.configMgr);
                this.styleInjector = new StyleInjector();
            }

            if (CONTEXT.isChatIframe) {
                this.observer = new DOMObserver();
            }
        }

        onConfigUpdate(config) {
            // 1. Global Switch Control
            if (config.enabled) {
                if (this.renderer) this.renderer.start();
                if (this.observer) this.observer.start();
            } else {
                if (this.renderer) this.renderer.stop();
                if (this.observer) this.observer.stop();
            }

            // 2. Visual Style Control (Top Frame Only)
            if (CONTEXT.isTopFrame && this.renderer) {
                this.styleInjector.update(config); // Handle chat hiding
                if (config.enabled) {
                    this.renderer.updateTracks(); // Real-time font/area update
                }
            }
        }
    }

    new App();

})();
