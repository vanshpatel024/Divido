import { supabaseAnon, supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters long').optional(),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters long').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

export type AuthInput = z.infer<typeof authSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export class AuthService {
  static async signup(input: AuthInput) {
    const { data, error } = await supabaseAnon.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          display_name: input.displayName, // This will be read by our DB trigger
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  static async login(input: Omit<AuthInput, 'displayName'>) {
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
    return true;
  }

  static async updateProfile(userId: string, input: ProfileUpdateInput) {
    const updateData: Record<string, any> = {};
    if (input.displayName) updateData.display_name = input.displayName;
    if (input.avatarUrl) updateData.avatar_url = input.avatarUrl;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  static async getProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
