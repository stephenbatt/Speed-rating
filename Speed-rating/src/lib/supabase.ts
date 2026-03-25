import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://bkpuppwrosihvuzmjrdb.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjhiNmM5MmI5LWUwODgtNGE2OC1hODk2LTBhZDgwYjYyZTExNSJ9.eyJwcm9qZWN0SWQiOiJia3B1cHB3cm9zaWh2dXptanJkYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5NDc2MDQxLCJleHAiOjIwODQ4MzYwNDEsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.W6kMAYVJN7Y3-BNm_En4jmCH103n4oEQcbzrfUKmEDc';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };