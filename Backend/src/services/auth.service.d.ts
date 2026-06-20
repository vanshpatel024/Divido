import { z } from 'zod';
export declare const authSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type AuthInput = z.infer<typeof authSchema>;
export declare class AuthService {
    static signup(input: AuthInput): Promise<{
        user: import("@supabase/auth-js").User | null;
        session: import("@supabase/auth-js").Session | null;
    }>;
    static login(input: AuthInput): Promise<{
        user: import("@supabase/auth-js").User;
        session: import("@supabase/auth-js").Session;
        weakPassword?: import("@supabase/auth-js").WeakPassword;
    }>;
    static logout(token: string): Promise<boolean>;
}
//# sourceMappingURL=auth.service.d.ts.map