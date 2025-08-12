"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const studyPlanRoutes_1 = __importDefault(require("./routes/studyPlanRoutes"));
const logger_1 = __importDefault(require("./utils/logger"));
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('combined', {
    stream: { write: message => logger_1.default.info(message.trim()) }
}));
// Request logging middleware
app.use((req, res, next) => {
    logger_1.default.info('Incoming request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    next();
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'ai-schedule-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
// MVP API Routes (matching requirements)
app.use('/plans', studyPlanRoutes_1.default); // /plans/generate, /plans/:id
app.use('/sessions', studyPlanRoutes_1.default); // /sessions/:id/status, /sessions/:id/remarks
// Legacy API v1 Routes (for backward compatibility)
app.use('/api/v1/plans', studyPlanRoutes_1.default);
app.use('/api/v1/sessions', studyPlanRoutes_1.default);
// Global error handler
app.use((error, req, res, next) => {
    logger_1.default.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
    });
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});
app.use((error, req, res, next) => {
    logger_1.default.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
    });
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});
// 404 handler
app.use('*', (req, res) => {
    logger_1.default.warn('Route not found:', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
        timestamp: new Date().toISOString()
    });
});
// Start server
const server = app.listen(PORT, () => {
    logger_1.default.info('AI Schedule Service started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_1.default.info('AI Schedule Service shut down complete');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger_1.default.info('AI Schedule Service shut down complete');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map