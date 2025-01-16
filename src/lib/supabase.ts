import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const databaseUrl = import.meta.env.VITE_DATABASE_URL;

console.log('Supabase initialization:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length || 0,
  hasDbUrl: !!databaseUrl
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    hasDbUrl: !!databaseUrl
  });
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: true
  },
  db: {
    schema: 'public'
  }
});

// Test the connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', { 
    event, 
    hasSession: !!session,
    sessionUser: session?.user,
    sessionRole: session?.user?.role
  });
});

export { supabase };