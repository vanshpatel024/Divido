import { supabaseAdmin } from './src/config/supabase';

async function checkFKs() {
  const query = `
    SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
          AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND (tc.table_name = 'trips' OR tc.table_name = 'trip_participants' OR tc.table_name = 'trip_invitations');
  `;

  // We can run raw SQL using RPC or run it via supabaseAdmin pg interface
  // Wait, does supabaseAdmin have a way to run raw SQL? Usually, there is no direct SQL executor via PostgREST unless there is a custom function.
  // Let's check if we can run it, or if we can query pg_catalog using standard select.
  // Wait! PostgREST does not let us run raw SELECT on information_schema directly unless it is exposed in the REST API (which it is usually not).
  // Let's check if we can just try to run it.
  const { data, error } = await supabaseAdmin.rpc('execute_sql_raw', { sql_query: query });
  if (error) {
    console.log("RPC execute_sql_raw failed (probably doesn't exist). Trying normal query...");
    console.error(error);
  } else {
    console.log("Foreign keys info:", data);
  }
}

checkFKs();
