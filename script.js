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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.raidTool = new RaidTool();
    
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