import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Replace with your actual Supabase project URL and anon key
const supabaseUrl = 'https://tzhkoyxqklqkkpizoham.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aGtveXhxa2xxa2twaXpvaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTcyNzcsImV4cCI6MjA3MzgzMzI3N30.JB2HOUOCyxmU2VsrUWVW7ZIj0VxI1h0VsFmSkK4WqVw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
