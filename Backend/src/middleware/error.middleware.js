"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const express_1 = require("express");
const response_1 = require("../utils/response");
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json((0, response_1.createResponse)(false, message, undefined, process.env.NODE_ENV === 'development' ? err : undefined));
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map