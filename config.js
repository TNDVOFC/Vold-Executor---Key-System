// Configuration file for Discord Raid Tool
const CONFIG = {
    // Application Settings
    app: {
        title: 'Discord Raid Tool',
        version: '1.0.0',
        author: 'Raid Tool Team'
    },

    // Default Values
    defaults: {
        messageCount: 10,
        delayBetween: 1000,
        username: 'Raid Bot',
        maxMessages: 100,
        minDelay: 100,
        maxDelay: 10000
    },

    // Rate Limiting
    rateLimiting: {
        retryDelay: 5000,
        maxRetries: 3,
        backoffMultiplier: 2
    },

    // UI Settings
    ui: {
        maxLogEntries: 1000,
        toastDuration: 5000,
        animationDuration: 300,
        autoScrollLogs: true
    },

    // Webhook Settings
    webhook: {
        timeout: 10000,
        validateUrl: true,
        allowedDomains: ['discord.com', 'discordapp.com']
    },

    // Example Messages
    exampleMessages: [
        "🔥 Raid em andamento! 🔥",
        "💥 Sistema ativo! 💥", 
        "⚡ Mensagem automatizada ⚡",
        "🚀 Bot funcionando! 🚀",
        "💯 Teste de webhook 💯",
        "🌟 Raid tool operacional! 🌟",
        "🎯 Mensagem de teste 🎯",
        "🎉 Sistema funcionando! 🎉",
        "⭐ Bot online! ⭐",
        "🔧 Teste de funcionalidade 🔧"
    ],

    // Message Variations for Randomization
    messageVariations: {
        prefixes: ['🔥', '💥', '⚡', '🚀', '💯', '🌟', '🎯', '🎉', '⭐', '🔧'],
        suffixes: ['🔥', '💥', '⚡', '🚀', '💯', '🌟', '🎯', '🎉', '⭐', '🔧'],
        separators: [' - ', ' | ', ' :: ', ' » ', ' ⟩ ']
    },

    // Theme Colors
    theme: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#2ed573',
        error: '#ff4757',
        warning: '#ffa502',
        info: '#70a1ff'
    },

    // Security Settings
    security: {
        maxMessageLength: 2000,
        allowedProtocols: ['https:'],
        validateWebhookFormat: true,
        sanitizeInput: true
    },

    // Performance Settings
    performance: {
        batchSize: 10,
        concurrentRequests: 1,
        memoryLimit: 50 * 1024 * 1024, // 50MB
        gcInterval: 60000 // 1 minute
    },

    // Debug Settings
    debug: {
        enabled: false,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        showTimestamps: true,
        showStackTrace: false
    }
};

// Make config globally available
if (typeof window !== 'undefined') {
    window.RAID_CONFIG = CONFIG;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}