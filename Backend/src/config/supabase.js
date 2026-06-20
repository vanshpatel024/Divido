"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAnon = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
// We use the service role key for backend administrative tasks.
// IMPORTANT: Never expose the service role key to the frontend.
exports.supabaseAdmin = (0, supabase_js_1.createClient)(env_1.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
// We can also have an anon client if needed for some operations, but admin is usually preferred in backend contexts
exports.supabaseAnon = (0, supabase_js_1.createClient)(env_1.SUPABASE_URL, env_1.env.ANON_PUBLIC, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
//# sourceMappingURL=supabase.js.map