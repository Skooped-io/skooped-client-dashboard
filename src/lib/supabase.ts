import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ordxzakffddgytanahnc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZHh6YWtmZmRkZ3l0YW5haG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTQxMDAsImV4cCI6MjA4OTE3MDEwMH0.W86DqwM15V63CURzfYE84iageG75GK9RhGoapZutU5Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
