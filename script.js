class RaidTool {
    constructor() {
        this.isRunning = false;
        this.currentRaid = null;
        this.messagesSent = 0;
        this.totalMessages = 0;
        this.webhookUrl = '';
        
        this.initializeElements();
        this.bindEvents();
        this.updateStatus('Desconectado', false);
        this.addLog('Sistema inicializado', 'info');
        this.initializeTheme();
        this.initializeStats();
    }

    initializeElements() {
        // Form elements
        this.webhookUrlInput = document.getElementById('webhookUrl');
        this.messageContentInput = document.getElementById('messageContent');
        this.messageCountInput = document.getElementById('messageCount');
        this.delayBetweenInput = document.getElementById('delayBetween');
        this.usernameInput = document.getElementById('username');
        this.avatarUrlInput = document.getElementById('avatarUrl');
        this.randomizeMessagesInput = document.getElementById('randomizeMessages');

        // Control elements
        this.testWebhookBtn = document.getElementById('testWebhook');
        this.startRaidBtn = document.getElementById('startRaid');
        this.stopRaidBtn = document.getElementById('stopRaid');
        this.clearLogsBtn = document.getElementById('clearLogs');

        // Status elements
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.progressText = document.getElementById('progressText');
        this.raidStatus = document.getElementById('raidStatus');
        this.progressFill = document.getElementById('progressFill');

        // Logs
        this.logsContainer = document.getElementById('logsContainer');
        this.toastContainer = document.getElementById('toastContainer');
    }

    bindEvents() {
        this.testWebhookBtn.addEventListener('click', () => this.testWebhook());
        this.startRaidBtn.addEventListener('click', () => this.startRaid());
        this.stopRaidBtn.addEventListener('click', () => this.stopRaid());
        this.clearLogsBtn.addEventListener('click', () => this.clearLogs());
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Settings modal
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        
        settingsToggle.addEventListener('click', () => this.openSettings());
        closeSettings.addEventListener('click', () => this.closeSettings());
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) this.closeSettings();
        });
        
        // Additional buttons
        const saveConfig = document.getElementById('saveConfig');
        const loadConfig = document.getElementById('loadConfig');
        const exportLogs = document.getElementById('exportLogs');
        const configFileInput = document.getElementById('configFileInput');
        
        if (saveConfig) saveConfig.addEventListener('click', () => this.saveConfiguration());
        if (loadConfig) loadConfig.addEventListener('click', () => this.loadConfiguration());
        if (exportLogs) exportLogs.addEventListener('click', () => this.exportLogs());
        if (configFileInput) configFileInput.addEventListener('change', (e) => this.handleConfigFile(e));
        
        // Embed toggle
        const enableEmbed = document.getElementById('enableEmbed');
        if (enableEmbed) {
            enableEmbed.addEventListener('change', () => this.toggleEmbedConfig());
        }
        
        // Auto-save webhook URL
        this.webhookUrlInput.addEventListener('input', () => {
            this.webhookUrl = this.webhookUrlInput.value;
            localStorage.setItem('webhookUrl', this.webhookUrl);
        });

        // Load saved webhook URL
        const savedWebhookUrl = localStorage.getItem('webhookUrl');
        if (savedWebhookUrl) {
            this.webhookUrlInput.value = savedWebhookUrl;
            this.webhookUrl = savedWebhookUrl;
        }

        // Form validation
        this.webhookUrlInput.addEventListener('blur', () => this.validateWebhookUrl());
        this.messageContentInput.addEventListener('input', () => this.validateForm());
        this.messageCountInput.addEventListener('input', () => this.validateForm());
    }

    validateWebhookUrl() {
        const url = this.webhookUrlInput.value.trim();
        const isValid = url.match(/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/);
        
        if (url && !isValid) {
            this.showToast('URL Inválida', 'Por favor, insira uma URL de webhook válida do Discord', 'error');
            this.webhookUrlInput.style.borderColor = '#ff4757';
        } else {
            this.webhookUrlInput.style.borderColor = '#e0e6ed';
        }
        
        return isValid;
    }

    validateForm() {
        const webhookValid = this.validateWebhookUrl();
        const messageValid = this.messageContentInput.value.trim().length > 0;
        const countValid = parseInt(this.messageCountInput.value) > 0;
        
        const isValid = webhookValid && messageValid && countValid;
        this.startRaidBtn.disabled = !isValid || this.isRunning;
        
        return isValid;
    }

    async testWebhook() {
        if (!this.validateWebhookUrl()) {
            this.showToast('Erro', 'URL do webhook inválida', 'error');
            return;
        }

        this.testWebhookBtn.disabled = true;
        this.testWebhookBtn.innerHTML = '<div class="loading"></div> Testando...';
        
        try {
            const response = await this.sendWebhookMessage({
                content: '🔧 **Teste de Webhook** - Conexão estabelecida com sucesso!',
                username: 'Raid Tool - Teste',
                avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
            });

            if (response.ok) {
                this.updateStatus('Conectado', true);
                this.showToast('Sucesso', 'Webhook testado com sucesso!', 'success');
                this.addLog('Webhook testado com sucesso', 'success');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.updateStatus('Erro de Conexão', false);
            this.showToast('Erro', `Falha no teste: ${error.message}`, 'error');
            this.addLog(`Erro no teste do webhook: ${error.message}`, 'error');
        } finally {
            this.testWebhookBtn.disabled = false;
            this.testWebhookBtn.innerHTML = '<i class="fas fa-vial"></i> Testar';
        }
    }

    async sendWebhookMessage(payload) {
        const url = this.webhookUrlInput.value.trim();
        
        return await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
    }

    async startRaid() {
        if (!this.validateForm()) {
            this.showToast('Erro', 'Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }

        this.isRunning = true;
        this.messagesSent = 0;
        this.totalMessages = parseInt(this.messageCountInput.value);
        
        // Update UI
        this.startRaidBtn.disabled = true;
        this.stopRaidBtn.disabled = false;
        this.raidStatus.textContent = 'Executando';
        this.updateProgress();
        
        // Get configuration
        const config = this.getRaidConfig();
        
        this.addLog(`Iniciando raid: ${this.totalMessages} mensagens com delay de ${config.delay}ms`, 'info');
        this.showToast('Raid Iniciado', `Enviando ${this.totalMessages} mensagens`, 'info');

        try {
            await this.executeRaid(config);
        } catch (error) {
            this.addLog(`Erro durante o raid: ${error.message}`, 'error');
            this.showToast('Erro', `Raid falhou: ${error.message}`, 'error');
        } finally {
            this.stopRaid();
        }
    }

    getRaidConfig() {
        const baseMessage = this.messageContentInput.value.trim();
        const messages = this.randomizeMessagesInput.checked 
            ? this.generateRandomMessages(baseMessage)
            : [baseMessage];

        return {
            messages,
            count: parseInt(this.messageCountInput.value),
            delay: parseInt(this.delayBetweenInput.value),
            username: this.usernameInput.value.trim() || 'Raid Bot',
            avatarUrl: this.avatarUrlInput.value.trim() || null,
            randomize: this.randomizeMessagesInput.checked
        };
    }

    generateRandomMessages(baseMessage) {
        const variations = [
            baseMessage,
            `${baseMessage} 🔥`,
            `💥 ${baseMessage}`,
            `${baseMessage} ⚡`,
            `🚀 ${baseMessage}`,
            `${baseMessage} 💯`,
            `⭐ ${baseMessage}`,
            `${baseMessage} 🎯`,
            `🌟 ${baseMessage}`,
            `${baseMessage} 🎉`
        ];
        return variations;
    }

    async executeRaid(config) {
        for (let i = 0; i < config.count && this.isRunning; i++) {
            try {
                const message = config.randomize 
                    ? config.messages[Math.floor(Math.random() * config.messages.length)]
                    : config.messages[0];

                const payload = {
                    content: message,
                    username: config.username
                };

                if (config.avatarUrl) {
                    payload.avatar_url = config.avatarUrl;
                }

                const response = await this.sendWebhookMessage(payload);
                
                if (response.ok) {
                    this.messagesSent++;
                    this.addLog(`Mensagem ${this.messagesSent}/${this.totalMessages} enviada`, 'success');
                } else {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                this.updateProgress();

                // Delay between messages
                if (i < config.count - 1 && this.isRunning) {
                    await this.sleep(config.delay);
                }

            } catch (error) {
                this.addLog(`Erro ao enviar mensagem ${i + 1}: ${error.message}`, 'error');
                
                // Handle rate limiting
                if (error.message.includes('429')) {
                    this.addLog('Rate limit detectado, aguardando...', 'warning');
                    await this.sleep(5000); // Wait 5 seconds for rate limit
                }
            }
        }

        if (this.isRunning) {
            this.addLog(`Raid concluído! ${this.messagesSent}/${this.totalMessages} mensagens enviadas`, 'success');
            this.showToast('Concluído', `Raid finalizado: ${this.messagesSent} mensagens enviadas`, 'success');
        }
    }

    stopRaid() {
        this.isRunning = false;
        this.startRaidBtn.disabled = false;
        this.stopRaidBtn.disabled = true;
        this.raidStatus.textContent = 'Parado';
        
        if (this.messagesSent > 0) {
            this.addLog(`Raid parado. ${this.messagesSent}/${this.totalMessages} mensagens enviadas`, 'warning');
        }
    }

    updateProgress() {
        const percentage = this.totalMessages > 0 ? (this.messagesSent / this.totalMessages) * 100 : 0;
        this.progressText.textContent = `${this.messagesSent}/${this.totalMessages}`;
        this.progressFill.style.width = `${percentage}%`;
    }

    updateStatus(text, connected) {
        this.statusText.textContent = text;
        this.statusDot.classList.toggle('connected', connected);
    }

    addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="message">${message}</span>
        `;
        
        this.logsContainer.appendChild(logEntry);
        this.logsContainer.scrollTop = this.logsContainer.scrollHeight;

        // Limit log entries to prevent memory issues
        const logEntries = this.logsContainer.children;
        if (logEntries.length > 1000) {
            logEntries[0].remove();
        }
    }

    clearLogs() {
        this.logsContainer.innerHTML = '';
        this.addLog('Logs limpos', 'info');
    }

    showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Auto-remove toast after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Theme System
    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        this.addLog(`Tema alterado para: ${theme === 'dark' ? 'escuro' : 'claro'}`, 'info');
    }

    // Statistics
    initializeStats() {
        this.stats = {
            totalRaids: parseInt(localStorage.getItem('totalRaids') || '0'),
            totalMessagesSent: parseInt(localStorage.getItem('totalMessagesSent') || '0'),
            successfulRequests: parseInt(localStorage.getItem('successfulRequests') || '0'),
            failedRequests: parseInt(localStorage.getItem('failedRequests') || '0'),
            startTime: Date.now()
        };
        this.updateStatsDisplay();
        this.startUptimeCounter();
    }

    updateStatsDisplay() {
        const totalRaidsEl = document.getElementById('totalRaids');
        const totalMessagesEl = document.getElementById('totalMessages');
        const successRateEl = document.getElementById('successRate');
        
        if (totalRaidsEl) totalRaidsEl.textContent = this.stats.totalRaids;
        if (totalMessagesEl) totalMessagesEl.textContent = this.stats.totalMessagesSent;
        
        if (successRateEl) {
            const total = this.stats.successfulRequests + this.stats.failedRequests;
            const rate = total > 0 ? Math.round((this.stats.successfulRequests / total) * 100) : 0;
            successRateEl.textContent = rate + '%';
        }
    }

    startUptimeCounter() {
        const uptimeEl = document.getElementById('uptime');
        if (uptimeEl) {
            setInterval(() => {
                const uptime = Date.now() - this.stats.startTime;
                const hours = Math.floor(uptime / 3600000);
                const minutes = Math.floor((uptime % 3600000) / 60000);
                const seconds = Math.floor((uptime % 60000) / 1000);
                uptimeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);
        }
    }

    // Settings Modal
    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    // Configuration Management
    saveConfiguration() {
        const config = {
            webhookUrl: this.webhookUrlInput.value,
            messageContent: this.messageContentInput.value,
            messageCount: this.messageCountInput.value,
            delayBetween: this.delayBetweenInput.value,
            username: this.usernameInput.value,
            avatarUrl: this.avatarUrlInput.value,
            randomizeMessages: this.randomizeMessagesInput.checked,
            enableEmbed: document.getElementById('enableEmbed')?.checked || false,
            embedTitle: document.getElementById('embedTitle')?.value || '',
            embedColor: document.getElementById('embedColor')?.value || '#667eea'
        };

        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'raid-config.json';
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Sucesso', 'Configuração salva com sucesso!', 'success');
    }

    loadConfiguration() {
        document.getElementById('configFileInput').click();
    }

    handleConfigFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                // Load configuration
                if (config.webhookUrl) this.webhookUrlInput.value = config.webhookUrl;
                if (config.messageContent) this.messageContentInput.value = config.messageContent;
                if (config.messageCount) this.messageCountInput.value = config.messageCount;
                if (config.delayBetween) this.delayBetweenInput.value = config.delayBetween;
                if (config.username) this.usernameInput.value = config.username;
                if (config.avatarUrl) this.avatarUrlInput.value = config.avatarUrl;
                if (config.randomizeMessages !== undefined) this.randomizeMessagesInput.checked = config.randomizeMessages;
                
                const enableEmbed = document.getElementById('enableEmbed');
                const embedTitle = document.getElementById('embedTitle');
                const embedColor = document.getElementById('embedColor');
                
                if (enableEmbed && config.enableEmbed !== undefined) {
                    enableEmbed.checked = config.enableEmbed;
                    this.toggleEmbedConfig();
                }
                if (embedTitle && config.embedTitle) embedTitle.value = config.embedTitle;
                if (embedColor && config.embedColor) embedColor.value = config.embedColor;

                this.showToast('Sucesso', 'Configuração carregada com sucesso!', 'success');
                this.addLog('Configuração carregada do arquivo', 'info');
            } catch (error) {
                this.showToast('Erro', 'Erro ao carregar configuração: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    exportLogs() {
        const logs = Array.from(this.logsContainer.children).map(entry => {
            const timestamp = entry.querySelector('.timestamp').textContent;
            const message = entry.querySelector('.message').textContent;
            const type = entry.className.split(' ').find(c => ['success', 'error', 'warning', 'info'].includes(c)) || 'info';
            return { timestamp, message, type };
        });

        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `raid-logs-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Sucesso', 'Logs exportados com sucesso!', 'success');
    }

    toggleEmbedConfig() {
        const enableEmbed = document.getElementById('enableEmbed');
        const embedConfigs = document.querySelectorAll('.embed-config');
        
        if (enableEmbed && embedConfigs) {
            embedConfigs.forEach(config => {
                if (enableEmbed.checked) {
                    config.style.display = 'flex';
                    config.classList.add('show');
                } else {
                    config.style.display = 'none';
                    config.classList.remove('show');
                }
            });
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.raidTool = new RaidTool();
    initializeAnimatedBackground();
    
    // Add some example messages for demonstration
    const exampleMessages = [
        "🔥 Raid em andamento! 🔥",
        "💥 Sistema ativo! 💥",
        "⚡ Mensagem automatizada ⚡",
        "🚀 Bot funcionando! 🚀",
        "💯 Teste de webhook 💯"
    ];
    
    // Set a random example message
    const messageInput = document.getElementById('messageContent');
    if (messageInput && !messageInput.value) {
        messageInput.placeholder = exampleMessages[Math.floor(Math.random() * exampleMessages.length)];
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (!window.raidTool.isRunning) {
                    window.raidTool.startRaid();
                }
                break;
            case 'Escape':
                e.preventDefault();
                if (window.raidTool.isRunning) {
                    window.raidTool.stopRaid();
                }
                break;
        }
    }
});

// Handle page visibility change to pause raid when tab is not active
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.raidTool && window.raidTool.isRunning) {
        window.raidTool.addLog('Aba inativa detectada - raid pode ser mais lento', 'warning');
    }
});

// Add error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.raidTool) {
        window.raidTool.addLog(`Erro não tratado: ${event.reason}`, 'error');
    }
});

// Add global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.raidTool) {
        window.raidTool.addLog(`Erro global: ${event.message}`, 'error');
    }
});

// Animated Background Functions
function initializeAnimatedBackground() {
    createFloatingSquares();
    createParticleEffect();
    startGeometricAnimations();
}

function createFloatingSquares() {
    const squaresContainer = document.querySelector('.floating-squares');
    const numberOfSquares = 12;
    
    for (let i = 0; i < numberOfSquares; i++) {
        const square = document.createElement('div');
        square.className = 'floating-square';
        
        // Random properties
        const size = Math.random() * 80 + 40; // 40px to 120px
        const startX = Math.random() * window.innerWidth;
        const animationDuration = Math.random() * 20 + 15; // 15s to 35s
        const delay = Math.random() * 20; // 0s to 20s delay
        const rotation = Math.random() * 360;
        
        square.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.1 + 0.05});
            border-radius: ${Math.random() * 20 + 10}px;
            left: ${startX}px;
            top: 100vh;
            transform: rotate(${rotation}deg);
            animation: floatUp ${animationDuration}s infinite linear;
            animation-delay: -${delay}s;
            pointer-events: none;
        `;
        
        squaresContainer.appendChild(square);
    }
}

function createParticleEffect() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    `;
    
    document.body.appendChild(particleContainer);
    
    // Create particles
    for (let i = 0; i < 50; i++) {
        createParticle(particleContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    const size = Math.random() * 4 + 2;
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const duration = Math.random() * 3 + 2;
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1});
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        animation: twinkle ${duration}s infinite ease-in-out;
        animation-delay: ${Math.random() * 2}s;
    `;
    
    container.appendChild(particle);
}

function startGeometricAnimations() {
    // Add geometric shapes that move around
    const geometricContainer = document.createElement('div');
    geometricContainer.className = 'geometric-shapes';
    geometricContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    `;
    
    document.body.appendChild(geometricContainer);
    
    // Create different geometric shapes
    createTriangle(geometricContainer);
    createHexagon(geometricContainer);
    createCircle(geometricContainer);
}

function createTriangle(container) {
    const triangle = document.createElement('div');
    triangle.style.cssText = `
        position: absolute;
        width: 0;
        height: 0;
        border-left: 30px solid transparent;
        border-right: 30px solid transparent;
        border-bottom: 50px solid rgba(255, 215, 0, 0.1);
        top: 20%;
        right: 15%;
        animation: rotateFloat 25s infinite ease-in-out;
        transform-origin: center;
    `;
    
    container.appendChild(triangle);
}

function createHexagon(container) {
    const hexagon = document.createElement('div');
    hexagon.style.cssText = `
        position: absolute;
        width: 60px;
        height: 34.64px;
        background: rgba(102, 126, 234, 0.1);
        margin: 17.32px 0;
        transform: rotate(30deg);
        top: 60%;
        left: 5%;
        animation: hexagonFloat 20s infinite ease-in-out;
    `;
    
    // Add pseudo elements for hexagon shape
    hexagon.innerHTML = `
        <style>
            .hexagon::before,
            .hexagon::after {
                content: "";
                position: absolute;
                width: 0;
                border-left: 30px solid transparent;
                border-right: 30px solid transparent;
            }
            .hexagon::before {
                bottom: 100%;
                border-bottom: 17.32px solid rgba(102, 126, 234, 0.1);
            }
            .hexagon::after {
                top: 100%;
                border-top: 17.32px solid rgba(102, 126, 234, 0.1);
            }
        </style>
    `;
    
    hexagon.className = 'hexagon';
    container.appendChild(hexagon);
}

function createCircle(container) {
    const circle = document.createElement('div');
    circle.style.cssText = `
        position: absolute;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, transparent 70%);
        border: 2px solid rgba(255, 255, 255, 0.1);
        top: 40%;
        right: 25%;
        animation: pulseFloat 18s infinite ease-in-out;
    `;
    
    container.appendChild(circle);
}