
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cipcpgpbjimnhesuerrk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcGNwZ3Biamltbmhlc3VlcnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY0NTg0MjgsImV4cCI6MjAzMjAzNDQyOH0.sb_publishable_HLa6pQB2-9YWv9ILf_IfKg_XLC_g9jT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
