import { supabaseAdmin } from '../../config/supabase';
import { z } from 'zod';

const categoryEnum = z.enum(["food", "hotel", "transport", "flight", "entertainment", "shopping"]);

export const tripCreateSchema = z.object({
  name: z.string().min(2, "Trip name must be at least 2 characters long"),
  categories: z.array(categoryEnum).default([]),
  invitees: z.array(z.string().uuid()).default([]),
});

export const stopCreateSchema = z.object({
  name: z.string().min(2, "Stop name must be at least 2 characters long"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  totalAmount: z.number().positive("Total amount must be positive"),
  payments: z.array(z.object({
    userId: z.string().uuid(),
    amount: z.number().nonnegative("Payment amount cannot be negative")
  })).min(1, "At least one payment must be specified"),
  splits: z.array(z.string().uuid()).min(1, "At least one split participant must be specified")
});

export type TripCreateInput = z.infer<typeof tripCreateSchema>;
export type StopCreateInput = z.infer<typeof stopCreateSchema>;

export const tripInviteSchema = z.object({
  invitees: z.array(z.string().uuid()).min(1, "At least one invitee must be specified"),
});
export type TripInviteInput = z.infer<typeof tripInviteSchema>;


export class TripService {
  /**
   * Returns an array of user IDs for all participants of a trip.
   * Used by controllers to broadcast dashboard events to the right users.
   */
  static async getTripParticipantIds(tripId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', tripId);
    if (error || !data) return [];
    return data.map((p: any) => p.user_id);
  }

  static async getTripStats(tripId: string, userId: string) {
    const { data: stops, error: stopsError } = await supabaseAdmin
      .from('stops')
      .select('id, name, total_amount')
      .eq('trip_id', tripId);

    if (stopsError) throw stopsError;
    if (!stops || stops.length === 0) {
      return { total: 0, balance: { kind: 'settled' } };
    }

    const stopIds = stops.map(s => s.id);

    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('stop_payments')
      .select('stop_id, amount')
      .eq('user_id', userId)
      .in('stop_id', stopIds);

    if (paymentsError) throw paymentsError;

    const { data: splits, error: splitsError } = await supabaseAdmin
      .from('stop_splits')
      .select('stop_id, user_id')
      .in('stop_id', stopIds);

    if (splitsError) throw splitsError;

    const totalSpend = stops
      .filter(s => !s.name.startsWith('Settlement:'))
      .reduce((sum, s) => sum + Number(s.total_amount), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    let totalShare = 0;
    for (const stop of stops) {
      const stopSplits = splits.filter(sp => sp.stop_id === stop.id);
      const splitCount = stopSplits.length;
      const isInSplit = stopSplits.some(sp => sp.user_id === userId);
      
      if (isInSplit && splitCount > 0) {
        totalShare += Number(stop.total_amount) / splitCount;
      }
    }

    const roundedPaid = Math.round(totalPaid * 100) / 100;
    const roundedShare = Math.round(totalShare * 100) / 100;
    const total = Math.round(totalSpend * 100) / 100;

    let balance: any = { kind: 'settled' };
    const diff = roundedPaid - roundedShare;
    if (Math.abs(diff) >= 0.01) {
      if (diff > 0) {
        balance = { kind: 'owed', amount: Math.round(diff * 100) / 100 };
      } else {
        balance = { kind: 'owe', amount: Math.round(-diff * 100) / 100 };
      }
    }

    return { total, balance, raw: { roundedPaid, roundedShare } };
  }

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

    if (tripsError) throw tripsError;

    const tripPromises = trips.map(async (trip: any) => {
      const stats = await this.getTripStats(trip.id, userId);
      
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
        total: stats.total,
        balance: stats.balance,
        categories: trip.categories || [],
        start_date: trip.start_date,
        end_date: trip.end_date
      };
    });

    return await Promise.all(tripPromises);
  }

  static async getTripDebts(tripId: string) {
    // 1. Get all participants
    const { data: participants, error: partError } = await supabaseAdmin
      .from('trip_participants')
      .select('user_id, user:profiles(id, display_name, username)')
      .eq('trip_id', tripId);
      
    if (partError || !participants) throw partError || new Error("Trip participants not found");
    
    // 2. Get all stops
    const { data: stops, error: stopsError } = await supabaseAdmin
      .from('stops')
      .select('id, name, total_amount')
      .eq('trip_id', tripId);
      
    if (stopsError || !stops) throw stopsError;
    if (stops.length === 0) return [];
    
    const stopIds = stops.map(s => s.id);
    
    // 3. Get all payments
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('stop_payments')
      .select('stop_id, user_id, amount')
      .in('stop_id', stopIds);
      
    if (paymentsError || !payments) throw paymentsError;
    
    // 4. Get all splits
    const { data: splits, error: splitsError } = await supabaseAdmin
      .from('stop_splits')
      .select('stop_id, user_id')
      .in('stop_id', stopIds);
      
    if (splitsError || !splits) throw splitsError;
    
    // 5. Calculate net balance for each participant (Payments - Share)
    const netBalances: Record<string, number> = {};
    const userNames: Record<string, string> = {};
    
    participants.forEach((p: any) => {
      netBalances[p.user_id] = 0;
      userNames[p.user_id] = p.user?.display_name || p.user?.username || 'Unknown';
    });
    
    for (const stop of stops) {
      const stopSplits = splits.filter(sp => sp.stop_id === stop.id);
      const splitCount = stopSplits.length;
      const stopPayments = payments.filter(p => p.stop_id === stop.id);
      
      // Credit payments
      stopPayments.forEach(p => {
        if (netBalances[p.user_id] !== undefined) {
          netBalances[p.user_id] += Number(p.amount);
        }
      });
      
      // Debit shares
      if (splitCount > 0) {
        const share = Number(stop.total_amount) / splitCount;
        stopSplits.forEach(sp => {
          if (netBalances[sp.user_id] !== undefined) {
            netBalances[sp.user_id] -= share;
          }
        });
      }
    }
    
    // 6. Partition into debtors and creditors
    const debtors: { userId: string; balance: number }[] = [];
    const creditors: { userId: string; balance: number }[] = [];
    
    Object.keys(netBalances).forEach(userId => {
      const bal = Math.round(netBalances[userId] * 100) / 100;
      if (bal < -0.01) {
        debtors.push({ userId, balance: bal });
      } else if (bal > 0.01) {
        creditors.push({ userId, balance: bal });
      }
    });
    
    // Sort so matching is efficient
    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => b.balance - a.balance);
    
    const debts: { fromId: string; fromName: string; toId: string; toName: string; amount: number }[] = [];
    
    let dIdx = 0;
    let cIdx = 0;
    
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      
      const debtAmount = Math.min(Math.abs(debtor.balance), creditor.balance);
      const roundedAmount = Math.round(debtAmount * 100) / 100;
      
      if (roundedAmount > 0) {
        debts.push({
          fromId: debtor.userId,
          fromName: userNames[debtor.userId],
          toId: creditor.userId,
          toName: userNames[creditor.userId],
          amount: roundedAmount
        });
      }
      
      debtor.balance += debtAmount;
      creditor.balance -= debtAmount;
      
      if (Math.abs(debtor.balance) < 0.01) {
        dIdx++;
      }
      if (Math.abs(creditor.balance) < 0.01) {
        cIdx++;
      }
    }
    
    return debts;
  }

  static async getSingleTrip(tripId: string, userId: string) {
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

    const stats = await this.getTripStats(trip.id, userId);
    const debts = await this.getTripDebts(trip.id);

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
      total: stats.total,
      balance: stats.balance,
      categories: trip.categories || [],
      start_date: trip.start_date,
      end_date: trip.end_date,
      debts
    };
  }

  static async createTrip(userId: string, input: TripCreateInput) {
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

    await supabaseAdmin
      .from('trip_participants')
      .insert({
        trip_id: trip.id,
        user_id: userId
      });

    if (input.invitees.length > 0) {
      const invites = input.invitees.map(inviteeId => ({
        trip_id: trip.id,
        sender_id: userId,
        receiver_id: inviteeId
      }));
      await supabaseAdmin.from('trip_invitations').insert(invites);
    }

    return await this.getSingleTrip(trip.id, userId);
  }

  static async endTrip(tripId: string, userId: string) {
    const { data, error } = await supabaseAdmin
      .from('trips')
      .update({ end_date: new Date().toISOString() })
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw error;
    return await this.getSingleTrip(tripId, userId);
  }

  static async deleteTrip(tripId: string, userId: string) {
    // 1. Verify trip exists and user is participant
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('trips')
      .select('id, name, end_date')
      .eq('id', tripId)
      .single();

    if (tripError) throw new Error("Trip not found");

    const { data: participant, error: partError } = await supabaseAdmin
      .from('trip_participants')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .maybeSingle();

    if (partError || !participant) throw new Error("You are not a participant in this trip");

    // 2. Validate end_date
    if (!trip.end_date) {
      throw new Error("The trip has not ended yet. You can only leave or delete a trip after it has ended.");
    }

    // 3. Validate settled balance
    const stats = await this.getTripStats(tripId, userId);
    if (stats.balance.kind !== 'settled') {
      throw new Error("Your balance must be settled before you can leave or delete the trip.");
    }

    // Get the user's name before leaving
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    // Get all participant IDs before leaving
    const participantIds = await this.getTripParticipantIds(tripId);

    // 4. Remove participant
    await supabaseAdmin
      .from('trip_participants')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId);

    // 5. Clean up pending invitations for this user on this trip
    await supabaseAdmin
      .from('trip_invitations')
      .delete()
      .eq('trip_id', tripId)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    // Create an Activity log stop to persist the leave event for remaining participants
    const userDisplayName = userProfile?.display_name || 'A user';
    const { data: newStop } = await supabaseAdmin
      .from('stops')
      .insert({
        trip_id: tripId,
        name: `Activity: ${userDisplayName} left the ${trip.name} trip`,
        total_amount: 0,
        date: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (newStop) {
      await supabaseAdmin.from('stop_splits').insert({
        stop_id: newStop.id,
        user_id: userId
      });
    }

    // 6. Check remaining participants
    const { data: remainingParts, error: countError } = await supabaseAdmin
      .from('trip_participants')
      .select('id')
      .eq('trip_id', tripId);

    if (countError) throw countError;

    // 7. Delete trip if empty
    if (!remainingParts || remainingParts.length === 0) {
      await supabaseAdmin
        .from('trips')
        .delete()
        .eq('id', tripId);
    }

    return {
      success: true,
      tripName: trip.name,
      userDisplayName,
      participantIds: participantIds.filter(id => id !== userId)
    };
  }

  static async getStops(tripId: string) {
    const { data: stops, error: stopsError } = await supabaseAdmin
      .from('stops')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (stopsError) throw stopsError;
    if (!stops || stops.length === 0) return [];

    const stopIds = stops.map(s => s.id);

    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('stop_payments')
      .select(`
        stop_id,
        amount,
        user_id,
        user:profiles(display_name, username)
      `)
      .in('stop_id', stopIds);

    if (paymentsError) throw paymentsError;

    const { data: splits, error: splitsError } = await supabaseAdmin
      .from('stop_splits')
      .select('stop_id, user_id')
      .in('stop_id', stopIds);

    if (splitsError) throw splitsError;

    return stops.map((stop: any) => {
      const stopSplits = splits.filter(sp => sp.stop_id === stop.id);
      const splitCount = stopSplits.length;

      const stopPayments = payments.filter(p => p.stop_id === stop.id);
      
      const transactions = stopPayments.map((p: any) => ({
        paidBy: p.user?.display_name || p.user?.username || 'Unknown',
        amount: Number(p.amount),
        splitCount,
        avatarColor: '#AAD9BB'
      }));

      return {
        id: stop.id,
        name: stop.name,
        date: stop.date,
        created_at: stop.created_at,
        total: Number(stop.total_amount),
        transactions
      };
    });
  }

  static async createStop(tripId: string, creatorId: string, input: StopCreateInput) {
    const { data: isMember, error: memberError } = await supabaseAdmin
      .from('trip_participants')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', creatorId)
      .maybeSingle();

    if (memberError || !isMember) {
      throw new Error("You are not a participant in this trip.");
    }

    const { data: stop, error: stopError } = await supabaseAdmin
      .from('stops')
      .insert({
        trip_id: tripId,
        name: input.name,
        date: input.date,
        total_amount: input.totalAmount
      })
      .select()
      .single();

    if (stopError) throw stopError;

    const paymentsData = input.payments.map(p => ({
      stop_id: stop.id,
      user_id: p.userId,
      amount: p.amount
    }));
    const { error: paymentsError } = await supabaseAdmin
      .from('stop_payments')
      .insert(paymentsData);

    if (paymentsError) {
      await supabaseAdmin.from('stops').delete().eq('id', stop.id);
      throw paymentsError;
    }

    const splitsData = input.splits.map(userId => ({
      stop_id: stop.id,
      user_id: userId
    }));
    const { error: splitsError } = await supabaseAdmin
      .from('stop_splits')
      .insert(splitsData);

    if (splitsError) {
      await supabaseAdmin.from('stops').delete().eq('id', stop.id);
      throw splitsError;
    }

    return stop;
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
    const { data: inv, error: invError } = await supabaseAdmin
      .from('trip_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('receiver_id', userId)
      .single();

    if (invError || !inv) throw new Error("Invitation not found");

    // Guard: Prevent processing already-handled invitations (blocks duplicate client requests)
    if (inv.status !== 'pending') {
      return { success: true };
    }

    const status = accept ? 'accepted' : 'declined';

    // Update all pending invitations for this user and trip to clean up any duplicates
    const { error: updateError } = await supabaseAdmin
      .from('trip_invitations')
      .update({ status })
      .eq('trip_id', inv.trip_id)
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (updateError) throw updateError;

    let alreadyParticipant = false;
    if (accept) {
      // Guard: Ensure user isn't already a participant to prevent double-insertions
      const { data: existingParticipant } = await supabaseAdmin
        .from('trip_participants')
        .select('id')
        .eq('trip_id', inv.trip_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingParticipant) {
        await supabaseAdmin.from('trip_participants').insert({
          trip_id: inv.trip_id,
          user_id: userId
        });
      } else {
        alreadyParticipant = true;
      }
    }

    // Get joined user's name
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    return { 
      success: true, 
      tripId: inv.trip_id, 
      senderId: inv.sender_id, 
      status,
      userDisplayName: userProfile?.display_name || 'A user',
      alreadyParticipant
    };
  }

  static async getTripPendingInvitations(tripId: string) {
    const { data, error } = await supabaseAdmin
      .from('trip_invitations')
      .select('receiver_id, receiver:profiles!trip_invitations_receiver_id_fkey(id, username, display_name, avatar_url)')
      .eq('trip_id', tripId)
      .eq('status', 'pending');

    if (error) throw error;
    
    return (data || []).map((inv: any) => {
      const rec = Array.isArray(inv.receiver) ? inv.receiver[0] : inv.receiver;
      return {
        id: rec?.id,
        username: rec?.username,
        display_name: rec?.display_name,
        avatar_url: rec?.avatar_url
      };
    });
  }

  static async inviteParticipants(tripId: string, senderId: string, inviteeIds: string[]) {
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('trips')
      .select('id, end_date')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      throw new Error('Trip not found');
    }

    if (trip.end_date) {
      throw new Error('Cannot invite participants to a trip that has already ended');
    }

    // Get current participants
    const { data: existingParts, error: partsError } = await supabaseAdmin
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', tripId);

    if (partsError) throw partsError;
    const participantSet = new Set((existingParts || []).map((p: any) => p.user_id));

    // Get all existing invites for this trip
    const { data: existingInvites, error: invitesError } = await supabaseAdmin
      .from('trip_invitations')
      .select('id, receiver_id, status')
      .eq('trip_id', tripId);

    if (invitesError) throw invitesError;

    const insertList: string[] = [];
    const updateList: { id: string; receiver_id: string }[] = [];
    const alreadyJoined: string[] = [];
    const alreadyInvited: string[] = [];

    for (const inviteeId of inviteeIds) {
      if (participantSet.has(inviteeId)) {
        alreadyJoined.push(inviteeId);
        continue;
      }

      const existingInvite = (existingInvites || []).find((inv: any) => inv.receiver_id === inviteeId);

      if (existingInvite) {
        if (existingInvite.status === 'pending') {
          alreadyInvited.push(inviteeId);
        } else {
          // Re-activate the existing invitation
          updateList.push({ id: existingInvite.id, receiver_id: inviteeId });
        }
      } else {
        insertList.push(inviteeId);
      }
    }

    // Fetch names of already invited / already joined users
    let alreadyInvitedNames: string[] = [];
    let alreadyJoinedNames: string[] = [];
    const idsToFetch = [...alreadyInvited, ...alreadyJoined];

    if (idsToFetch.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, username')
        .in('id', idsToFetch);

      if (profiles) {
        profiles.forEach(p => {
          const name = p.display_name || p.username || 'Unknown';
          if (alreadyInvited.includes(p.id)) {
            alreadyInvitedNames.push(name);
          }
          if (alreadyJoined.includes(p.id)) {
            alreadyJoinedNames.push(name);
          }
        });
      }
    }

    if (insertList.length === 0 && updateList.length === 0) {
      return {
        success: true,
        invitees: [],
        alreadyInvited: alreadyInvitedNames,
        alreadyJoined: alreadyJoinedNames,
        alreadyInvitedIds: alreadyInvited,
        alreadyJoinedIds: alreadyJoined
      };
    }

    if (updateList.length > 0) {
      const updateIds = updateList.map(item => item.id);
      const { error: updateError } = await supabaseAdmin
        .from('trip_invitations')
        .update({
          status: 'pending',
          sender_id: senderId,
          created_at: new Date().toISOString()
        })
        .in('id', updateIds);

      if (updateError) throw updateError;
    }

    if (insertList.length > 0) {
      const invites = insertList.map(inviteeId => ({
        trip_id: tripId,
        sender_id: senderId,
        receiver_id: inviteeId,
        status: 'pending'
      }));

      const { error: insertError } = await supabaseAdmin
        .from('trip_invitations')
        .insert(invites);

      if (insertError) throw insertError;
    }

    const successfullyInvited = [...insertList, ...updateList.map(item => item.receiver_id)];
    return {
      success: true,
      invitees: successfullyInvited,
      alreadyInvited: alreadyInvitedNames,
      alreadyJoined: alreadyJoinedNames,
      alreadyInvitedIds: alreadyInvited,
      alreadyJoinedIds: alreadyJoined
    };
  }
}
