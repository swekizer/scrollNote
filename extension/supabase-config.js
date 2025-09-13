// Supabase Configuration for scrollNote Extension
const SUPABASE_URL = 'https://lfcvtdvbxpxfvtmsjrqm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmY3Z0ZHZieHB4ZnZ0bXNqcnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5NTU5MzYsImV4cCI6MjAxNTUzMTkzNn0.Yd_LbJwGWJpFNJOK9g9KPmUZTvXZgDJRXgbTQoJrCWE';

// Initialize the Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);