import { createClient } from '@supabase/supabase-js';
import { env, SUPABASE_URL } from './env';

// We use the service role key for backend administrative tasks.
// IMPORTANT: Never expose the service role key to the frontend.
export const supabaseAdmin = createClient(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// We can also have an anon client if needed for some operations, but admin is usually preferred in backend contexts
export const supabaseAnon = createClient(SUPABASE_URL, env.ANON_PUBLIC, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
