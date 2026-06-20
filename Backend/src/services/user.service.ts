import { supabaseAdmin } from '../config/supabase';

export class UserService {
  static async searchUsers(query: string) {
    if (!query || query.length < 2) return [];
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);
      
    if (error) {
      throw error;
    }
    return data;
  }
}
