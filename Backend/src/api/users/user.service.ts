import { supabaseAdmin } from '../../config/supabase';

export class UserService {
  static async searchUsers(query: string, tripId?: string) {
    if (!query || query.length < 2) return [];
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);
      
    if (error) {
      throw error;
    }

    if (tripId && data && data.length > 0) {
      const userIds = data.map(u => u.id);

      // Fetch participants
      const { data: participants } = await supabaseAdmin
        .from('trip_participants')
        .select('user_id')
        .eq('trip_id', tripId)
        .in('user_id', userIds);

      const participantIds = new Set(participants?.map(p => p.user_id) || []);

      // Fetch pending invitations
      const { data: invitations } = await supabaseAdmin
        .from('trip_invitations')
        .select('receiver_id')
        .eq('trip_id', tripId)
        .eq('status', 'pending')
        .in('receiver_id', userIds);

      const invitedIds = new Set(invitations?.map(i => i.receiver_id) || []);

      return data.map(u => ({
        ...u,
        isParticipant: participantIds.has(u.id),
        isInvited: invitedIds.has(u.id)
      }));
    }

    return data;
  }

  static async getActivities(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((act: any) => ({
      id: act.id,
      type: act.type,
      tripId: act.trip_id,
      tripName: act.trip_name,
      userName: act.user_name,
      userAvatar: act.user_avatar,
      amount: act.amount ? Number(act.amount) : undefined,
      role: act.role,
      status: act.status,
      name: act.name,
      actorId: act.actor_id,
      date: act.created_at
    }));
  }

  static async createActivity(userId: string, activity: {
    type: string;
    tripId?: string;
    tripName?: string;
    userName?: string;
    userAvatar?: string;
    amount?: number;
    role?: string;
    status?: string;
    name?: string;
    actorId?: string;
    date?: string;
  }) {
    // 1. Get current activity count for this user
    const { count, error: countError } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    // 2. If count >= 25, delete the oldest activities to bring count down to 24
    if (count && count >= 25) {
      const excess = count - 24;
      const { data: oldest, error: selectError } = await supabaseAdmin
        .from('activities')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(excess);

      if (selectError) throw selectError;

      if (oldest && oldest.length > 0) {
        const idsToDelete = oldest.map((a: any) => a.id);
        const { error: deleteError } = await supabaseAdmin
          .from('activities')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;
      }
    }

    // 3. Insert the new activity
    const { data, error: insertError } = await supabaseAdmin
      .from('activities')
      .insert({
        user_id: userId,
        type: activity.type,
        trip_id: activity.tripId,
        trip_name: activity.tripName,
        user_name: activity.userName,
        user_avatar: activity.userAvatar,
        amount: activity.amount,
        role: activity.role,
        status: activity.status,
        name: activity.name,
        actor_id: activity.actorId,
        created_at: activity.date || new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return data;
  }

  static async clearActivities(userId: string) {
    const { error } = await supabaseAdmin
      .from('activities')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}
