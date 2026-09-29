const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

let supabase = null;
let isConfigured = false;

if (
  env.NODE_ENV !== 'test' &&
  env.SUPABASE_URL &&
  env.SUPABASE_SERVICE_ROLE_KEY &&
  env.SUPABASE_URL.startsWith('http') &&
  !env.SUPABASE_URL.includes('your-project')
) {
  try {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    isConfigured = true;
    console.log('[Database] Supabase client initialized successfully.');
  } catch (error) {
    console.warn('[Database] Failed to initialize Supabase client:', error.message);
  }
} else {
  console.info('[Database] Supabase credentials not set or placeholder detected. Operating with built-in resilient development store.');
}

module.exports = {
  supabase,
  isConfigured,
  getSupabase: () => supabase
};
