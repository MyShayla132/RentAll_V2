// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fxluryosukljugnsfkcm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4bHVyeW9zdWtsanVnbnNma2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MTQ5NzIsImV4cCI6MjA2NjE5MDk3Mn0.YYUF8BLpOKND8998OYrcx9AcsMFXiSv1zxFiTximF00";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
