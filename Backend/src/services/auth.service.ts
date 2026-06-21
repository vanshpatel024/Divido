import { supabaseAnon, supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters long').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscores only'),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters long').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

export type AuthInput = z.infer<typeof authSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export class AuthService {
  static async signup(input: AuthInput) {
    // Check if username is already taken
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', input.username)
      .maybeSingle();

    if (existingUser) {
      const err = new Error('Username is already taken');
      (err as any).status = 409;
      throw err;
    }

    const colors = ["AAD9BB", "C9B7E0", "F7DCB9", "FBC4AB", "B7D4E0", "E0CFB7"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const displayName = input.displayName || '';
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${randomColor}&color=000`;

    const { data, error } = await supabaseAnon.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          display_name: displayName, // This will be read by our DB trigger
          avatar_url: avatarUrl,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user && input.username) {
      // Assuming trigger already created the profile row, we just update it
      await supabaseAdmin.from('profiles').update({ username: input.username }).eq('id', data.user.id);
    }

    return data;
  }

  static async login(input: Pick<AuthInput, 'email' | 'password'>) {
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

  static async requestPasswordReset(email: string, redirectTo?: string) {
    const { data, error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      throw error;
    }
    return data;
  }

  static async checkEmailExists(email: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      throw error;
    }
    return (data.users || []).some((user: any) => user.email?.toLowerCase() === email.toLowerCase());
  }

  static async updatePassword(userId: string, newPassword: string) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });
    if (error) {
      throw error;
    }
    return data;
  }

  static async deleteAccount(userId: string) {
    // 1. Delete all invitations sent or received by this user
    await supabaseAdmin
      .from('trip_invitations')
      .delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    // 2. Delete all trips created by this user
    // (This cascades to delete participants, stops, and transactions for these trips)
    await supabaseAdmin
      .from('trips')
      .delete()
      .eq('created_by', userId);

    // 3. Delete participant entries for trips owned by other users
    await supabaseAdmin
      .from('trip_participants')
      .delete()
      .eq('user_id', userId);

    // 4. Finally, delete the user from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      throw error;
    }
    return true;
  }
}
