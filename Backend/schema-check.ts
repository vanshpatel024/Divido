import { supabaseAdmin } from './src/config/supabase';

async function fetchSchema() {
  console.log("---- Profiles ----");
  const { data: profiles, error: pe } = await supabaseAdmin.from('profiles').select('*').limit(1);
  if (pe) console.error("Profiles error:", pe);
  else console.log(profiles?.[0] ? Object.keys(profiles[0]) : "No data, but table exists");

  console.log("---- Trips ----");
  const { data: trips, error: te } = await supabaseAdmin.from('trips').select('*').limit(1);
  if (te) console.error("Trips error:", te);
  else console.log(trips?.[0] ? Object.keys(trips[0]) : "No data, but table exists");

  console.log("---- Trip Participants ----");
  const { data: tp, error: tpe } = await supabaseAdmin.from('trip_participants').select('*').limit(1);
  if (tpe) console.error("Trip participants error:", tpe);
  else console.log(tp?.[0] ? Object.keys(tp[0]) : "No data, but table exists");
}

fetchSchema();
