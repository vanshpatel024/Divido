import { supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

// Matches the exact frontend types
const categoryEnum = z.enum(["food", "hotel", "transport", "flight", "entertainment"]);

export const tripCreateSchema = z.object({
  name: z.string().min(2, "Trip name must be at least 2 characters long"),
  dates: z.string().min(1, "Dates are required"),
  categories: z.array(categoryEnum).default([]),
  participants: z.array(z.object({
    name: z.string(),
    color: z.string()
  })).min(1, "At least one participant is required"),
});

export type TripCreateInput = z.infer<typeof tripCreateSchema>;

export class TripService {
  /**
   * Fetch all trips created by or involving the user.
   * Format them exactly as the Frontend expects.
   */
  static async getUserTrips(userId: string) {
    const { data: trips, error: tripsError } = await supabaseAdmin
      .from('trips')
      .select(`
        *,
        trip_participants(
          name,
          color
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (tripsError) {
      throw tripsError;
    }

    // Map database results to Frontend structure
    return trips.map((trip: any) => ({
      id: trip.id,
      name: trip.name,
      dates: trip.dates,
      participants: trip.trip_participants || [],
      // MOCK values for now until we build the Expenses module
      total: 0, 
      balance: { kind: "settled" }, 
      categories: trip.categories || []
    }));
  }

  /**
   * Create a new trip along with its participants
   */
  static async createTrip(userId: string, input: TripCreateInput) {
    // 1. Create the trip
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('trips')
      .insert({
        name: input.name,
        dates: input.dates,
        categories: input.categories,
        created_by: userId
      })
      .select()
      .single();

    if (tripError) {
      throw tripError;
    }

    // 2. Insert the participants
    const participantsData = input.participants.map(p => ({
      trip_id: trip.id,
      name: p.name,
      color: p.color
    }));

    const { error: participantsError } = await supabaseAdmin
      .from('trip_participants')
      .insert(participantsData);

    if (participantsError) {
      // In a real production app we might want to rollback the trip creation or use an RPC/Transaction here.
      throw participantsError;
    }

    // Return the newly created trip mapped to the Frontend structure
    return {
      id: trip.id,
      name: trip.name,
      dates: trip.dates,
      participants: input.participants,
      total: 0,
      balance: { kind: "settled" },
      categories: trip.categories || []
    };
  }
}
