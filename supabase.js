// supabase.js
import 'react-native-url-polyfill/auto';           // <-- add this at top
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,      // store session in AsyncStorage
    autoRefreshToken: true,     // refresh session automatically
    persistSession: true,       // keep session after restart
    detectSessionInUrl: false,  // not needed in React Native
  },
});
