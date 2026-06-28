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
    const activities: any[] = [];

    // 1. Invitations (Accepted/Declined sent by user)
    const { data: invites } = await supabaseAdmin
      .from('trip_invitations')
      .select(`
        id, status, created_at, trip_id, receiver_id,
        trips (name),
        receiver:profiles!trip_invitations_receiver_id_fkey (display_name, avatar_url)
      `)
      .eq('sender_id', userId)
      .in('status', ['accepted', 'declined']);

    if (invites) {
      for (const invRaw of invites) {
        const inv = invRaw as any;
        activities.push({
          id: `inv-${inv.id}`,
          type: 'invitation_response',
          status: inv.status,
          tripName: Array.isArray(inv.trips) ? inv.trips[0]?.name : inv.trips?.name || 'A trip',
          tripId: inv.trip_id,
          userName: Array.isArray(inv.receiver) ? inv.receiver[0]?.display_name : inv.receiver?.display_name || 'Someone',
          userAvatar: Array.isArray(inv.receiver) ? inv.receiver[0]?.avatar_url : inv.receiver?.avatar_url || '',
          date: inv.created_at,
          actorId: inv.receiver_id,
        });
      }
    }

    // 2. Ended trips
    const { data: endedTrips } = await supabaseAdmin
      .from('trip_participants')
      .select(`
        trip_id,
        trips!inner (id, name, end_date)
      `)
      .eq('user_id', userId)
      .not('trips.end_date', 'is', null);

    if (endedTrips) {
      for (const tpRaw of endedTrips) {
        const tp = tpRaw as any;
        const trip = Array.isArray(tp.trips) ? tp.trips[0] : tp.trips;
        if (trip) {
          activities.push({
            id: `trip-end-${trip.id}`,
            type: 'trip_ended',
            tripName: trip.name,
            tripId: trip.id,
            date: trip.end_date,
          });
        }
      }
    }

    // First get all trips of the user
    const { data: myTrips } = await supabaseAdmin
      .from('trip_participants')
      .select('trip_id')
      .eq('user_id', userId);
      
    const tripIds = myTrips ? myTrips.map(t => t.trip_id) : [];

    // Also get all stops where the user is involved (via stop_payments or stop_splits)
    const { data: myPayments } = await supabaseAdmin
      .from('stop_payments')
      .select('stop_id')
      .eq('user_id', userId);

    const { data: mySplits } = await supabaseAdmin
      .from('stop_splits')
      .select('stop_id')
      .eq('user_id', userId);

    const involvedStopIds = [
      ...new Set([
        ...(myPayments?.map(p => p.stop_id) || []),
        ...(mySplits?.map(s => s.stop_id) || [])
      ])
    ];

    if (tripIds.length > 0) {
      // 3. Member joined notifications
      // Fetch all accepted invitations for trips the user is a participant of
      const { data: memberJoinedInvites } = await supabaseAdmin
        .from('trip_invitations')
        .select(`
          id, status, created_at, trip_id,
          receiver_id, sender_id,
          trips (name),
          receiver:profiles!trip_invitations_receiver_id_fkey (display_name, avatar_url)
        `)
        .in('trip_id', tripIds)
        .eq('status', 'accepted');

      if (memberJoinedInvites) {
        for (const invRaw of memberJoinedInvites) {
          const inv = invRaw as any;
          // Don't show "joined" notification to the person who joined themselves
          if (inv.receiver_id === userId) continue;
          
          // Don't show to the sender of the invitation either (they already see invitation_response)
          if (inv.sender_id === userId) continue;

          const trip = Array.isArray(inv.trips) ? inv.trips[0] : inv.trips;
          const receiver = Array.isArray(inv.receiver) ? inv.receiver[0] : inv.receiver;

          if (trip && receiver) {
            activities.push({
              id: `member-joined-${inv.id}`,
              type: 'member_joined',
              tripName: trip.name,
              tripId: inv.trip_id,
              userName: receiver.display_name,
              userAvatar: receiver.avatar_url,
              date: inv.created_at,
              actorId: inv.receiver_id,
            });
          }
        }
      }
    }
      
    // 4. Settlements & Left Trip activities
    const stopsMap = new Map<string, any>();

    if (tripIds.length > 0) {
      const { data: stopsByTrip } = await supabaseAdmin
        .from('stops')
        .select(`
          id, name, date, created_at, trip_id, total_amount,
          stop_payments (user_id),
          stop_splits (user_id)
        `)
        .in('trip_id', tripIds);
        
      if (stopsByTrip) {
        stopsByTrip.forEach(s => stopsMap.set(s.id, s));
      }
    }

    if (involvedStopIds.length > 0) {
      const { data: stopsByInvolvement } = await supabaseAdmin
        .from('stops')
        .select(`
          id, name, date, created_at, trip_id, total_amount,
          stop_payments (user_id),
          stop_splits (user_id)
        `)
        .in('id', involvedStopIds);
        
      if (stopsByInvolvement) {
        stopsByInvolvement.forEach(s => stopsMap.set(s.id, s));
      }
    }

    const stops = Array.from(stopsMap.values());
      
    if (stops.length > 0) {
      for (const s of stops) {
        if (!s.name) continue;
        
        if (s.name.startsWith('Settlement:')) {
          const isPayer = s.stop_payments?.some((p: any) => p.user_id === userId);
          const isReceiver = s.stop_splits?.some((p: any) => p.user_id === userId);
          
          if (isPayer || isReceiver) {
            const receiverId = s.stop_splits?.[0]?.user_id;
            activities.push({
              id: `settlement-${s.id}`,
              type: 'settlement',
              amount: s.total_amount,
              tripId: s.trip_id,
              name: s.name, // e.g. "Settlement: John to Jane"
              role: isPayer ? 'payer' : 'receiver',
              date: s.created_at || s.date,
              actorId: receiverId,
            });
          }
        } else if (s.name.startsWith('Activity:')) {
          const leaverId = s.stop_splits?.[0]?.user_id;
          activities.push({
            id: `activity-${s.id}`,
            type: 'member_left',
            tripId: s.trip_id,
            name: s.name, // e.g. "Activity: Jane left the trip"
            date: s.created_at || s.date,
            actorId: leaverId,
          });
        }
      }
    }

    // Sort by date descending
    activities.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });

    return activities;
  }
}
