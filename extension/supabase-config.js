const SUPABASE_URL = 'https://xzdnfjznwulocsolsvxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZG5manpud3Vsb2Nzb2xzdnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzM4MjIsImV4cCI6MjA2NjM0OTgyMn0.TPlgAXLg4WjhGLwvNq17lAmLWLiy6R-cIEQu1WSD4Pg';
// Create table in Supabase:
/*
CREATE TABLE snaps (
  id SERIAL PRIMARY KEY,
  text TEXT,
  url TEXT,
  title TEXT,
  h1 TEXT,
  position JSONB,
  timestamp TIMESTAMPTZ,
  note TEXT,
  screenshot TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/