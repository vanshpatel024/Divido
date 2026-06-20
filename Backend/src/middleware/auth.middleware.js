"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json((0, response_1.createResponse)(false, 'Missing or invalid authorization header'));
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json((0, response_1.createResponse)(false, 'Token missing from authorization header'));
            return;
        }
        // Verify token with Supabase
        // Using supabaseAnon.auth.getUser(token) is the secure way to validate a JWT
        const { data: { user }, error } = await supabase_1.supabaseAnon.auth.getUser(token);
        if (error || !user) {
            console.error('Supabase auth error:', error?.message);
            res.status(401).json((0, response_1.createResponse)(false, 'Invalid or expired token', undefined, error?.message));
            return;
        }
        // Attach user to request object
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map