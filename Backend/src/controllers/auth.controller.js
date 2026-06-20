"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
class AuthController {
    static async signup(req, res, next) {
        try {
            const parsedData = auth_service_1.authSchema.parse(req.body);
            const data = await auth_service_1.AuthService.signup(parsedData);
            res.status(201).json((0, response_1.createResponse)(true, 'User signed up successfully', data));
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json((0, response_1.createResponse)(false, 'Validation error', undefined, error.errors));
                return;
            }
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const parsedData = auth_service_1.authSchema.parse(req.body);
            const data = await auth_service_1.AuthService.login(parsedData);
            res.status(200).json((0, response_1.createResponse)(true, 'User logged in successfully', data));
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json((0, response_1.createResponse)(false, 'Validation error', undefined, error.errors));
                return;
            }
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            // In a pure JWT stateless setup with Supabase, client simply drops the token.
            // We can also tell Supabase to signout if we had session management.
            // For now, we just acknowledge.
            res.status(200).json((0, response_1.createResponse)(true, 'User logged out successfully'));
        }
        catch (error) {
            next(error);
        }
    }
    static async me(req, res, next) {
        try {
            // req.user is attached by authMiddleware
            res.status(200).json((0, response_1.createResponse)(true, 'User profile retrieved', req.user));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map