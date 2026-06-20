import { supabaseAnon, supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type AuthInput = z.infer<typeof authSchema>;

export class AuthService {
  static async signup(input: AuthInput) {
    const { data, error } = await supabaseAnon.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  static async login(input: AuthInput) {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  static async logout(token: string) {
    // In a stateless JWT backend, logout is typically handled by the client dropping the token.
    // Supabase tokens expire based on the project's JWT expiration settings.
    // If we wanted to globally revoke all sessions for a user, we could use:
    // await supabaseAdmin.auth.admin.signOut(userId, 'global')
    return true;
  }
}
