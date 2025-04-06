import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const retryFetch = async (url: string, options = {}, retries = MAX_RETRIES): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryFetch(url, options, retries - 1);
    }
    throw new Error('Network error - unable to connect to the database. Please check your connection and try again.');
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    },
    fetch: retryFetch
  }
});

// Initialize auth state with better error handling
supabase.auth.onAuthStateChange((event, session) => {
  try {
    if (event === 'SIGNED_IN') {
      console.log('User signed in:', session?.user?.email);
    } else if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    }
  } catch (error) {
    console.error('Auth state change error:', error);
  }
});

// Add health check function with lightweight query
export const checkSupabaseConnection = async () => {
  try {
    // Use a lightweight query that doesn't fetch actual data
    const { error } = await supabase.from('inventory_items').select('id', { count: 'exact', head: true });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};