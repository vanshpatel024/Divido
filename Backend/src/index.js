"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const response_1 = require("./utils/response");
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
// CORS configuration - permissive for local dev as requested
app.use((0, cors_1.default)({ origin: '*' }));
// Body parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Healthcheck
app.get('/health', (req, res) => {
    res.status(200).json((0, response_1.createResponse)(true, 'Server is running healthily'));
});
// Routes
app.use('/auth', auth_routes_1.default);
// 404 handler
app.use((req, res, next) => {
    res.status(404).json((0, response_1.createResponse)(false, 'Route not found'));
});
// Global Error Handler
app.use(error_middleware_1.errorHandler);
const PORT = env_1.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map