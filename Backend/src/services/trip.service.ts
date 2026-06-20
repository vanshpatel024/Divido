import { supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

// Matches the exact frontend types
const categoryEnum = z.enum(["food", "hotel", "transport", "flight", "entertainment"]);

export const tripCreateSchema = z.object({
  name: z.string().min(2, "Trip name must be at least 2 characters long"),
  categories: z.array(categoryEnum).default([]),
  invitees: z.array(z.string().uuid()).default([]),
});

export type TripCreateInput = z.infer<typeof tripCreateSchema>;

export class TripService {
  /**
   * Fetch all trips created by or involving the user.
   */
  static async getUserTrips(userId: string) {
    const { data: userTrips, error: userTripsError } = await supabaseAdmin
      .from('trip_participants')
      .select('trip_id')
      .eq('user_id', userId);

    if (userTripsError) throw userTripsError;
    
    const tripIds = userTrips.map(ut => ut.trip_id);
    if (tripIds.length === 0) return [];

    const { data: trips, error: tripsError } = await supabaseAdmin
      .from('trips')
      .select(`
        *,
        trip_participants(
          user_id,
          user:profiles(
            id,
            display_name,
            avatar_url,
            username
          )
        )
      `)
      .in('id', tripIds)
      .order('created_at', { ascending: false });

    if (tripsError) {
      throw tripsError;
    }

    return trips.map((trip: any) => {
      // Create a nice date string from start_date to end_date
      let datesStr = "Active";
      if (trip.start_date) {
        const start = new Date(trip.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        if (trip.end_date) {
          const end = new Date(trip.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          datesStr = `${start} - ${end}`;
        } else {
          datesStr = `Started ${start}`;
        }
      }

      return {
        id: trip.id,
        name: trip.name,
        dates: datesStr,
        participants: (trip.trip_participants || []).map((tp: any) => ({
          id: tp.user?.id,
          name: tp.user?.display_name || tp.user?.username || 'Unknown',
          avatar_url: tp.user?.avatar_url,
          color: '#AAD9BB' // Default fallback
        })),
        total: 0, 
        balance: { kind: "settled" }, 
        categories: trip.categories || [],
        start_date: trip.start_date,
        end_date: trip.end_date
      };
    });
  }

  /**
   * Create a new trip
   */
  static async createTrip(userId: string, input: TripCreateInput) {
    // 1. Create the trip
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('trips')
      .insert({
        name: input.name,
        categories: input.categories,
        created_by: userId,
        start_date: new Date().toISOString()
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // 2. Insert the creator as a participant
    await supabaseAdmin
      .from('trip_participants')
      .insert({
        trip_id: trip.id,
        user_id: userId
      });

    // 3. Send invitations to invitees
    if (input.invitees.length > 0) {
      const invites = input.invitees.map(inviteeId => ({
        trip_id: trip.id,
        sender_id: userId,
        receiver_id: inviteeId
      }));
      await supabaseAdmin.from('trip_invitations').insert(invites);
    }

    return await this.getSingleTrip(trip.id);
  }

  static async endTrip(tripId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('trips')
      .update({ end_date: new Date().toISOString() })
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;
    return await this.getSingleTrip(tripId);
  }

  static async getSingleTrip(tripId: string) {
    const { data: trip, error: tripsError } = await supabaseAdmin
      .from('trips')
      .select(`
        *,
        trip_participants(
          user_id,
          user:profiles(
            id,
            display_name,
            avatar_url,
            username
          )
        )
      `)
      .eq('id', tripId)
      .single();

    if (tripsError) throw tripsError;

    let datesStr = "Active";
    if (trip.start_date) {
      const start = new Date(trip.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      if (trip.end_date) {
        const end = new Date(trip.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        datesStr = `${start} - ${end}`;
      } else {
        datesStr = `Started ${start}`;
      }
    }

    return {
      id: trip.id,
      name: trip.name,
      dates: datesStr,
      participants: (trip.trip_participants || []).map((tp: any) => ({
        id: tp.user?.id,
        name: tp.user?.display_name || tp.user?.username || 'Unknown',
        avatar_url: tp.user?.avatar_url,
        color: '#AAD9BB'
      })),
      total: 0,
      balance: { kind: "settled" },
      categories: trip.categories || [],
      start_date: trip.start_date,
      end_date: trip.end_date
    };
  }

  // --- Invitations Methods ---

  static async getPendingInvitations(userId: string) {
    const { data: invites, error } = await supabaseAdmin
      .from('trip_invitations')
      .select(`
        id,
        status,
        created_at,
        sender_id,
        trip_id,
        trip:trips(id, name)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!invites || invites.length === 0) return [];

    const senderIds = [...new Set(invites.map((i: any) => i.sender_id))];
    
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', senderIds);
      
    if (profilesError) throw profilesError;

    return invites.map((inv: any) => {
      const sender = profiles.find(p => p.id === inv.sender_id) || { 
        id: inv.sender_id, 
        username: 'Unknown',
        display_name: 'Unknown',
        avatar_url: ''
      };
      
      return {
        id: inv.id,
        status: inv.status,
        created_at: inv.created_at,
        trip: inv.trip,
        sender
      };
    });
  }

  static async respondToInvitation(invitationId: string, userId: string, accept: boolean) {
    // Verify invitation belongs to user
    const { data: inv, error: invError } = await supabaseAdmin
      .from('trip_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('receiver_id', userId)
      .single();

    if (invError || !inv) throw new Error("Invitation not found");

    const status = accept ? 'accepted' : 'declined';

    const { error: updateError } = await supabaseAdmin
      .from('trip_invitations')
      .update({ status })
      .eq('id', invitationId);

    if (updateError) throw updateError;

    if (accept) {
      await supabaseAdmin.from('trip_participants').insert({
        trip_id: inv.trip_id,
        user_id: userId
      });
    }

    return { success: true };
  }
}
