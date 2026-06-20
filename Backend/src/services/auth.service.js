"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.authSchema = void 0;
const supabase_1 = require("../config/supabase");
const zod_1 = require("zod");
exports.authSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
});
class AuthService {
    static async signup(input) {
        const { data, error } = await supabase_1.supabaseAnon.auth.signUp({
            email: input.email,
            password: input.password,
        });
        if (error) {
            throw error;
        }
        return data;
    }
    static async login(input) {
        const { data, error } = await supabase_1.supabaseAnon.auth.signInWithPassword({
            email: input.email,
            password: input.password,
        });
        if (error) {
            throw error;
        }
        return data;
    }
    static async logout(token) {
        // In a stateless JWT backend, logout is typically handled by the client dropping the token.
        // Supabase tokens expire based on the project's JWT expiration settings.
        // If we wanted to globally revoke all sessions for a user, we could use:
        // await supabaseAdmin.auth.admin.signOut(userId, 'global')
        return true;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map